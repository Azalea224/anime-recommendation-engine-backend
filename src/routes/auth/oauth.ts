import { Router } from 'express';
import { z } from 'zod';
import { oauth } from '../../controllers/authController.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

const oauthSchema = z.object({
  params: z.object({
    provider: z.enum(['google', 'github'], {
      errorMap: () => ({ message: 'Provider must be either google or github' }),
    }),
  }),
  query: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),
});

router.get('/oauth/:provider', validate(oauthSchema), asyncHandler(oauth));

export default router;

