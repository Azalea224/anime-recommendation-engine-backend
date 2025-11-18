import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { Anime } from '../models/Anime.js';
import { Chat } from '../models/Chat.js';
import { generateChatResponse } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export async function chat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { message, useStoredHistory } = req.body;
  const userId = req.userId!;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message is required', 400);
  }

  // Sanitize message (basic sanitization)
  const sanitizedMessage = message.trim().slice(0, 2000);

  // Fetch user's anime list
  const animeList = await Anime.find({ userId }).lean();

  // Get conversation history - either from database or use provided history
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  if (useStoredHistory !== false) {
    // Load conversation history from database (most recent first, limit to last 20 messages for context)
    const recentMessages = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Reverse to get chronological order (oldest first)
    conversationHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  } else if (req.body.conversationHistory) {
    // Use provided history if useStoredHistory is false
    conversationHistory = req.body.conversationHistory;
  }

  try {
    // Save user message to database
    await Chat.create({
      userId,
      role: 'user',
      content: sanitizedMessage,
    });

    // Generate response using Gemini
    const response = await generateChatResponse(
      sanitizedMessage,
      animeList,
      conversationHistory
    );

    // Save assistant response to database
    await Chat.create({
      userId,
      role: 'assistant',
      content: response,
    });

    logger.info(`Chat message processed and saved for user: ${userId}`);

    res.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error: any) {
    logger.error('Chat error:', error);
    
    // Re-throw as AppError to be handled by error handler
    throw new AppError(
      error.message || 'Failed to generate chat response',
      500
    );
  }
}

// New endpoint to get chat history
export async function getChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = parseInt(req.query.skip as string) || 0;

  const messages = await Chat.find({ userId })
    .sort({ createdAt: 1 }) // Oldest first
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Chat.countDocuments({ userId });

  res.json({
    success: true,
    data: {
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      total,
      limit,
      skip,
    },
  });
}

// New endpoint to clear chat history
export async function clearChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  await Chat.deleteMany({ userId });

  logger.info(`Chat history cleared for user: ${userId}`);

  res.json({
    success: true,
    message: 'Chat history cleared successfully',
  });
}
