const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  error: (message: string, error?: Error | unknown, ...args: unknown[]): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);
    if (error && typeof error === 'object' && 'stack' in error && isDevelopment) {
      console.error('Stack trace:', error.stack);
    }
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  debug: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};

