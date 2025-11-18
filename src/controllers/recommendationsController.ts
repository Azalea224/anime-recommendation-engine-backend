import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { Anime } from '../models/Anime.js';
import { generateRecommendations, analyzePreferences } from '../services/recommendationService.js';

export async function getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  // Fetch user's anime list
  const animeList = await Anime.find({ userId }).lean();

  // Analyze preferences
  const preferences = analyzePreferences(animeList);

  // Generate recommendations
  const recommendations = generateRecommendations(animeList);

  res.json({
    success: true,
    data: {
      preferences,
      recommendations,
    },
  });
}

