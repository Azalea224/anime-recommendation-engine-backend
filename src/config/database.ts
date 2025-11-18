import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { getEnv } from './environment.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    const { MONGODB_URI } = getEnv();
    
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

