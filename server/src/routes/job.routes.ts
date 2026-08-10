import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../validators/auth.validator';
import { analyzeJobSchema, createJobSchema } from '../validators/job.validator';

const router = Router();

router.use(protect);

router.post('/', validateBody(createJobSchema), jobController.createJob);
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);
router.delete('/:id', jobController.deleteJob);
router.post('/:id/analyze', validateBody(analyzeJobSchema), jobController.analyzeJob);

export default router;
