import { Router } from 'express';
import { z } from 'zod';
import { signup } from '../../controllers/authController.js';
import { validate } from '../../middleware/validator.js';
import { loginSignupLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

router.post('/signup', loginSignupLimiter, validate(signupSchema), asyncHandler(signup));

export default router;

