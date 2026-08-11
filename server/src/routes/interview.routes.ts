import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../validators/auth.validator';
import { startInterviewSchema, submitAnswerSchema } from '../validators/interview.validator';

const router = Router();

router.use(protect);

router.post('/', validateBody(startInterviewSchema), interviewController.startInterview);
router.get('/', interviewController.listInterviews);
router.get('/:id', interviewController.getInterview);
router.post('/:id/answer', validateBody(submitAnswerSchema), interviewController.submitAnswer);
router.post('/:id/next-question', interviewController.nextQuestion);
router.get('/:id/report', interviewController.getReport);
router.post('/:id/abandon', interviewController.abandonInterview);

export default router;
