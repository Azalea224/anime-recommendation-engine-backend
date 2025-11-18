import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

export const loginSignupLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_SIGNUP.windowMs,
  max: RATE_LIMITS.LOGIN_SIGNUP.max,
  message: 'Too many login/signup attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatLimiter = rateLimit({
  windowMs: RATE_LIMITS.CHAT.windowMs,
  max: RATE_LIMITS.CHAT.max,
  message: 'Too many chat messages, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use userId if available, otherwise fall back to IP
    return (req as { userId?: string }).userId || req.ip || 'unknown';
  },
});

export const syncLimiter = rateLimit({
  windowMs: RATE_LIMITS.SYNC.windowMs,
  max: RATE_LIMITS.SYNC.max,
  message: 'Sync rate limit exceeded. Please wait before syncing again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as { userId?: string }).userId || req.ip || 'unknown';
  },
});

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

