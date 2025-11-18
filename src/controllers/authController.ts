import { Response } from 'express';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { AuthenticatedRequest } from '../types/index.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/authService.js';
import { BCRYPT_ROUNDS, TOKEN_EXPIRY, COOKIE_NAMES } from '../utils/constants.js';
import { getEnv } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email, username, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new AppError('Email or username already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await User.create({
    email,
    username,
    passwordHash,
    oauthProviders: [],
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.email);

  // Store refresh token
  await RefreshToken.create({
    userId: user._id.toString(),
    token: refreshToken,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
  });

  // Set cookies
  const { NODE_ENV } = getEnv();
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN * 1000,
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN * 1000,
  });

  logger.info(`User signed up: ${user.email}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    },
    message: 'User created successfully',
  });
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  if (!user.passwordHash) {
    throw new AppError('Please use OAuth to sign in', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.email);

  // Store refresh token
  await RefreshToken.create({
    userId: user._id.toString(),
    token: refreshToken,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
  });

  // Set cookies
  const { NODE_ENV } = getEnv();
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN * 1000,
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN * 1000,
  });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    },
    message: 'Login successful',
  });
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  if (refreshToken && req.userId) {
    // Invalidate refresh token
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  // Clear cookies
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);

  logger.info(`User logged out: ${req.userId || 'unknown'}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}

export async function refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  if (!refreshToken) {
    throw new AppError('No refresh token provided', 401);
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if token exists in database
  const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
  if (!tokenDoc || tokenDoc.userId !== decoded.userId) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Generate new access token
  const accessToken = generateAccessToken(decoded.userId, decoded.email);

  // Optionally rotate refresh token
  const newRefreshToken = generateRefreshToken(decoded.userId, decoded.email);

  // Delete old refresh token
  await RefreshToken.deleteOne({ token: refreshToken });

  // Store new refresh token
  await RefreshToken.create({
    userId: decoded.userId,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
  });

  // Set cookies
  const { NODE_ENV } = getEnv();
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN * 1000,
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN * 1000,
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
  });
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        username: req.user.username,
      },
    },
  });
}

export async function oauth(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { provider } = req.params;
  const { code, state } = req.query;

  if (!code || !state) {
    throw new AppError('Missing authorization code or state', 400);
  }

  const { FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = getEnv();

  let userInfo: { email: string; name: string; id: string };

  if (provider === 'google') {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${FRONTEND_URL}/api/auth/oauth/google`,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    userInfo = {
      email: userResponse.data.email,
      name: userResponse.data.name,
      id: userResponse.data.id,
    };
  } else if (provider === 'github') {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
    }, {
      headers: { Accept: 'application/json' },
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    userInfo = {
      email: userResponse.data.email || `${userResponse.data.id}@github.local`,
      name: userResponse.data.name || userResponse.data.login,
      id: userResponse.data.id.toString(),
    };
  } else {
    throw new AppError('Invalid OAuth provider', 400);
  }

  // Find or create user
  let user = await User.findOne({ email: userInfo.email.toLowerCase() });

  if (!user) {
    // Create new user
    const username = userInfo.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
    user = await User.create({
      email: userInfo.email.toLowerCase(),
      username,
      oauthProviders: [{
        provider: provider as 'google' | 'github',
        providerId: userInfo.id,
      }],
    });
  } else {
    // Add OAuth provider if not exists
    const providerExists = user.oauthProviders.some(
      (p) => p.provider === provider && p.providerId === userInfo.id
    );

    if (!providerExists) {
      user.oauthProviders.push({
        provider: provider as 'google' | 'github',
        providerId: userInfo.id,
      });
      await user.save();
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email);
  const refreshToken = generateRefreshToken(user._id.toString(), user.email);

  // Store refresh token
  await RefreshToken.create({
    userId: user._id.toString(),
    token: refreshToken,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN * 1000),
  });

  // Set cookies
  const { NODE_ENV } = getEnv();
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.ACCESS_TOKEN * 1000,
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN * 1000,
  });

  logger.info(`OAuth login: ${user.email} via ${provider}`);

  // Redirect to frontend
  res.redirect(`${FRONTEND_URL}/auth/callback?success=true`);
}

