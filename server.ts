// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './src/config/environment.js';
import { connectDatabase } from './src/config/database.js';
import app from './src/app.js';
import { logger } from './src/utils/logger.js';

// Validate environment variables
let env;
try {
  env = validateEnv();
} catch (error) {
  logger.error('Environment validation failed:', error);
  process.exit(1);
}

const PORT = env.PORT || 5000;

// Connect to database
connectDatabase()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

