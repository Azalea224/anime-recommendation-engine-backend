// Token expiry times (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
} as const;

// Rate limit configurations
export const RATE_LIMITS = {
  LOGIN_SIGNUP: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },
  CHAT: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
  },
  SYNC: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1, // 1 request per 5 minutes
  },
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
} as const;

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

// Bcrypt salt rounds
export const BCRYPT_ROUNDS = 12;

// Response messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
} as const;

