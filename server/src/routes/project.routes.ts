import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../validators/auth.validator';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';

const router = Router();

router.use(protect);

router.post('/', validateBody(createProjectSchema), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', validateBody(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
