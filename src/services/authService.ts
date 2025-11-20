import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { getEnv } from '../config/environment.js';
import { TOKEN_EXPIRY, COOKIE_NAMES } from '../utils/constants.js';
import { JWTPayload } from '../types/index.js';

export function generateAccessToken(userId: string, email: string): string {
  const { JWT_SECRET } = getEnv();
  const payload: JWTPayload = {
    userId,
    email,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
  });
}

export function generateRefreshToken(userId: string, email: string): string {
  const { JWT_REFRESH_SECRET } = getEnv();
  const payload: JWTPayload = {
    userId,
    email,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
  });
}

export function verifyAccessToken(token: string): JWTPayload {
  const { JWT_SECRET } = getEnv();
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
  
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
}

export function verifyRefreshToken(token: string): JWTPayload {
  const { JWT_REFRESH_SECRET } = getEnv();
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
}

export function extractTokenFromCookie(req: Request, cookieName: string): string | null {
  return req.cookies?.[cookieName] || null;
}

export function getAccessTokenFromCookie(req: Request): string | null {
  return extractTokenFromCookie(req, COOKIE_NAMES.ACCESS_TOKEN);
}

export function getRefreshTokenFromCookie(req: Request): string | null {
  return extractTokenFromCookie(req, COOKIE_NAMES.REFRESH_TOKEN);
}

export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // Check for "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

