import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../validators/auth.validator';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

router.use(protect); // every route in this file requires authentication

router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), userController.updateProfile);

export default router;
