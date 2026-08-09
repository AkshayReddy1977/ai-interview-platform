import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import resumeRoutes from './resume.routes';
import filesRoutes from './files.routes';

const router = Router();

/**
 * Feature routers are mounted here as each phase is built.
 *
 * Phase 2 added: /auth
 * Phase 3 added: /users, /resumes, /files
 * Phase 4 will add: /jobs
 * ...and so on per the build order.
 */

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/files', filesRoutes);

router.get('/', (_req, res) => {
  sendSuccess(res, { name: 'AI Interview Platform API', version: '1.0.0' }, 'API is running');
});

export default router;
