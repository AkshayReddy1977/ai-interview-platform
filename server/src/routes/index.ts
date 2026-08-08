import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import authRoutes from './auth.routes';

const router = Router();

/**
 * Feature routers are mounted here as each phase is built.
 *
 * Phase 2 added: /auth
 * Phase 3 will add: /users, /resumes
 * Phase 4 will add: /jobs
 * ...and so on per the build order.
 */

router.use('/auth', authRoutes);

router.get('/', (_req, res) => {
  sendSuccess(res, { name: 'AI Interview Platform API', version: '1.0.0' }, 'API is running');
});

export default router;
