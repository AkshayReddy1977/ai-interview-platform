import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody, loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// Stricter than the global API rate limit — auth endpoints are the most
// attractive brute-force / credential-stuffing target in the whole app.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

export default router;
