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

// CORS configuration - use process.env directly since dotenv loads before this module
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
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

