import { Request } from 'express';
import { Document } from 'mongoose';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request extension for authenticated routes
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: IUser;
}

// User interface
export interface IUser extends Document {
  _id: string;
  email: string;
  username: string;
  passwordHash: string;
  oauthProviders: OAuthProvider[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthProvider {
  provider: 'google' | 'github';
  providerId: string;
}

// Anime interface
export interface IAnime extends Document {
  _id: string;
  userId: string;
  animeId: number;
  title: string;
  score: number;
  status: string;
  progress: number;
  totalEpisodes: number;
  format: string;
  genres: string[];
  tags: string[];
  coverImage: string;
  bannerImage?: string;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Key interface
export interface IApiKey extends Document {
  _id: string;
  userId: string;
  encryptedKey: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh Token interface
export interface IRefreshToken extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

// Chat interface
export interface IChat extends Document {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Environment variables
export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ENCRYPTION_KEY: string;
  GOOGLE_GEMINI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  FRONTEND_URL: string;
  ANILIST_API_URL: string;
}

