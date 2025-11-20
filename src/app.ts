import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Auth routes
import signupRouter from './routes/auth/signup.js';
import loginRouter from './routes/auth/login.js';
import logoutRouter from './routes/auth/logout.js';
import refreshRouter from './routes/auth/refresh.js';
import meRouter from './routes/auth/me.js';
import oauthRouter from './routes/auth/oauth.js';

// AniList routes
import anilistKeyRouter from './routes/anilist/key.js';
import anilistSyncRouter from './routes/anilist/sync.js';

// Other routes
import chatRouter from './routes/chat.js';
import recommendationsRouter from './routes/recommendations.js';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration - support multiple origins for development and production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://157.230.117.180:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost origins
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    console.log(`CORS: Rejected origin: ${origin}`);
    console.log(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // Return false instead of throwing error to prevent unhandled error
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// General rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// API routes
app.use('/api/auth', signupRouter);
app.use('/api/auth', loginRouter);
app.use('/api/auth', logoutRouter);
app.use('/api/auth', refreshRouter);
app.use('/api/auth', meRouter);
app.use('/api/auth', oauthRouter);

app.use('/api/anilist', anilistKeyRouter);
app.use('/api/anilist', anilistSyncRouter);

app.use('/api/chat', chatRouter);
app.use('/api/recommendations', recommendationsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

