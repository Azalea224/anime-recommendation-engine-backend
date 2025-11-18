import { Router } from 'express';
import { z } from 'zod';
import { storeApiKey, removeApiKey, importPublicAnimeList } from '../../controllers/anilistController.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

const storeKeySchema = z.object({
  body: z.object({
    apiKey: z.string().min(1, 'API key is required'),
    storePermanently: z.boolean().optional().default(true),
  }),
});

const importSchema = z.object({
  body: z.object({
    anilistUsername: z.string().min(1, 'AniList username is required'),
  }),
});

router.post('/key', authenticate, validate(storeKeySchema), asyncHandler(storeApiKey));
router.delete('/key', authenticate, asyncHandler(removeApiKey));
router.post('/import', authenticate, validate(importSchema), asyncHandler(importPublicAnimeList));

export default router;

