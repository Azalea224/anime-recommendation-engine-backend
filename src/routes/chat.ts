import { Router } from 'express';
import { z } from 'zod';
import { chat, getChatHistory, clearChatHistory } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
    useStoredHistory: z.boolean().optional().default(true),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
  }),
});

const getHistorySchema = z.object({
  query: z.object({
    limit: z.string().optional(),
    skip: z.string().optional(),
  }),
});

router.post('/', authenticate, chatLimiter, validate(chatSchema), asyncHandler(chat));
router.get('/history', authenticate, validate(getHistorySchema), asyncHandler(getChatHistory));
router.delete('/history', authenticate, asyncHandler(clearChatHistory));

export default router;

