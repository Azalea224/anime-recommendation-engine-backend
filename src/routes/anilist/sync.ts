import { Router } from 'express';
import { z } from 'zod';
import { syncAnimeList } from '../../controllers/anilistController.js';
import { authenticate } from '../../middleware/auth.js';
import { syncLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validator.js';

const router = Router();

const syncSchema = z.object({
  body: z.object({
    anilistUsername: z.string().optional(),
  }),
});

router.post('/sync', authenticate, syncLimiter, validate(syncSchema), asyncHandler(syncAnimeList));

export default router;

