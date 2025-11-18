import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationsController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticate, asyncHandler(getRecommendations));

export default router;

