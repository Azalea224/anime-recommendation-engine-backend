import { Router } from 'express';
import { logout } from '../../controllers/authController.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/logout', authenticate, asyncHandler(logout));

export default router;

