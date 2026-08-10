import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { userService } from '../services/user.service';
import { UpdateProfileInput } from '../validators/user.validator';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.id);
  sendSuccess(res, { user }, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.user!.id, input);
  sendSuccess(res, { user }, 'Profile updated');
});
