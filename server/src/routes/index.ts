import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import resumeRoutes from './resume.routes';
import filesRoutes from './files.routes';
import jobRoutes from './job.routes';
import projectRoutes from './project.routes';
import interviewRoutes from './interview.routes';

const router = Router();

/**
 * Feature routers are mounted here as each phase is built.
 *
 * Phase 2 added: /auth
 * Phase 3 added: /users, /resumes, /files
 * Phase 4 added: /jobs
 * Phase 5 added: /projects
 * Phase 6 & 7 added: /interviews
 */

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/files', filesRoutes);
router.use('/jobs', jobRoutes);
router.use('/projects', projectRoutes);
router.use('/interviews', interviewRoutes);

router.get('/', (_req, res) => {
  sendSuccess(res, { name: 'AI Interview Platform API', version: '1.0.0' }, 'API is running');
});

export default router;
