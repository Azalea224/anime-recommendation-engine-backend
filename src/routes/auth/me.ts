import { Router } from 'express';
import { me } from '../../controllers/authController.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.get('/me', authenticate, asyncHandler(me));

export default router;

