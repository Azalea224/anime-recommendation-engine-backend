import { Router } from 'express';
import { refresh } from '../../controllers/authController.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.post('/refresh', asyncHandler(refresh));

export default router;

