import { Router } from 'express';
import { z } from 'zod';
import { login } from '../../controllers/authController.js';
import { validate } from '../../middleware/validator.js';
import { loginSignupLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/login', loginSignupLimiter, validate(loginSchema), asyncHandler(login));

export default router;

