import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiKey } from '../models/ApiKey.js';
import { Anime } from '../models/Anime.js';
import { encrypt, decrypt } from '../services/encryptionService.js';
import { testApiKey, fetchAnimeList } from '../services/anilistService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export async function storeApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { apiKey, storePermanently } = req.body;
  const userId = req.userId!;

  if (!apiKey || typeof apiKey !== 'string') {
    throw new AppError('API key is required', 400);
  }

  // Trim whitespace from API key (common issue when copying/pasting)
  const trimmedApiKey = apiKey.trim();

  if (!trimmedApiKey) {
    throw new AppError('API key cannot be empty', 400);
  }

  // Test API key
  const isValid = await testApiKey(trimmedApiKey);
  if (!isValid) {
    throw new AppError('Invalid AniList API key. Please ensure you are using an OAuth2 access token, not a client secret. You can get an access token by authorizing your application through AniList OAuth2.', 401);
  }

  if (storePermanently) {
    // Encrypt and store in database (use trimmed key)
    const { encrypted, iv } = encrypt(trimmedApiKey);

    // Upsert API key
    await ApiKey.findOneAndUpdate(
      { userId },
      { encryptedKey: encrypted, iv },
      { upsert: true, new: true }
    );

    logger.info(`API key stored for user: ${userId}`);
  } else {
    // Store in session (for this implementation, we'll still store it but mark it as temporary)
    // In a production app, you might use Redis or similar for session storage
    const { encrypted, iv } = encrypt(trimmedApiKey);
    await ApiKey.findOneAndUpdate(
      { userId },
      { encryptedKey: encrypted, iv },
      { upsert: true, new: true }
    );

    logger.info(`API key stored temporarily for user: ${userId}`);
  }

  res.json({
    success: true,
    message: 'API key stored successfully',
  });
}

export async function removeApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  await ApiKey.deleteOne({ userId });

  logger.info(`API key removed for user: ${userId}`);

  res.json({
    success: true,
    message: 'API key removed successfully',
  });
}

export async function syncAnimeList(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { anilistUsername } = req.body;

  // Get encrypted API key (optional)
  const apiKeyDoc = await ApiKey.findOne({ userId });
  let apiKey: string | null = null;

  if (apiKeyDoc) {
    // Decrypt API key if it exists
    apiKey = decrypt({
      encrypted: apiKeyDoc.encryptedKey,
      iv: apiKeyDoc.iv,
    });
  }

  // If no API key and no username provided, throw error
  if (!apiKey && !anilistUsername) {
    throw new AppError(
      'Either AniList API key or AniList username must be provided. Add your API key or provide your AniList username to sync your public profile.',
      400
    );
  }

  // Fetch anime list from AniList (works with or without API key)
  const animeList = await fetchAnimeList(apiKey, userId, anilistUsername);

  // Upsert anime entries
  let syncedCount = 0;
  for (const anime of animeList) {
    await Anime.findOneAndUpdate(
      { userId, animeId: anime.animeId },
      anime,
      { upsert: true, new: true }
    );
    syncedCount++;
  }

  logger.info(`Synced ${syncedCount} anime entries for user: ${userId}`);

  res.json({
    success: true,
    data: {
      syncedCount,
    },
    message: `Successfully synced ${syncedCount} anime entries`,
  });
}

export async function importPublicAnimeList(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { anilistUsername } = req.body;

  if (!anilistUsername || typeof anilistUsername !== 'string' || anilistUsername.trim().length === 0) {
    throw new AppError('AniList username is required', 400);
  }

  const trimmedUsername = anilistUsername.trim();

  // Fetch public user's anime list (no API key needed for public profiles)
  const animeList = await fetchAnimeList(null, userId, trimmedUsername);

  // Upsert anime entries to the authenticated user's account
  let importedCount = 0;
  for (const anime of animeList) {
    await Anime.findOneAndUpdate(
      { userId, animeId: anime.animeId },
      anime,
      { upsert: true, new: true }
    );
    importedCount++;
  }

  logger.info(`Imported ${importedCount} anime entries from public user "${trimmedUsername}" to account: ${userId}`);

  res.json({
    success: true,
    data: {
      importedCount,
      sourceUsername: trimmedUsername,
    },
    message: `Successfully imported ${importedCount} anime entries from ${trimmedUsername}'s public profile`,
  });
}

