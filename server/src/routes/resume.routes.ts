import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as resumeController from '../controllers/resume.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadResumePdf } from '../middleware/upload.middleware';

const router = Router();

router.use(protect); // every route in this file requires authentication

// PDF parsing is CPU-heavier than a typical request; limit more strictly
// than the general API rate limit to prevent abuse.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many uploads, please try again later.' },
});

router.post('/', uploadLimiter, uploadResumePdf, resumeController.uploadResume);
router.get('/', resumeController.listResumes);
router.get('/:id', resumeController.getResume);
router.delete('/:id', resumeController.deleteResume);

export default router;
