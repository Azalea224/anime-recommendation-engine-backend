import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../types/index.js';
import { getEnv } from '../config/environment.js';
import { COOKIE_NAMES } from '../utils/constants.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No access token provided',
      });
      return;
    }

    const { JWT_SECRET } = getEnv();
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
      return;
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

