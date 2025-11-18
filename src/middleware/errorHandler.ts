import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let error: string | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    error = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication failed';
    error = err.message;
  }
  // Handle MongoDB duplicate key error
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    error = 'A record with this value already exists';
  }
  // Handle other errors
  else {
    error = err.message;
    logger.error('Unhandled error:', err);
  }

  const response: ApiResponse = {
    success: false,
    error,
    message,
  };

  res.status(statusCode).json(response);
}

