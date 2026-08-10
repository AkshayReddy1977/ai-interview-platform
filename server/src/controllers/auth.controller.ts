import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/apiResponse';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { clearRefreshTokenCookie, REFRESH_COOKIE_NAME, setRefreshTokenCookie } from '../utils/cookies';
import { LoginInput, RegisterInput } from '../validators/auth.validator';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const { user, accessToken, refreshToken } = await authService.register(input);
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken }, 'Account created successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const { user, accessToken, refreshToken } = await authService.login(input);
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken }, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!presentedToken) {
    throw AppError.unauthorized('No refresh token provided');
  }

  const { user, accessToken, refreshToken } = await authService.refresh(presentedToken);
  setRefreshTokenCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const presentedToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (req.user) {
    await authService.logout(req.user.id, presentedToken);
  }
  clearRefreshTokenCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user is guaranteed by the `protect` middleware running before this.
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, { user }, 'Current user retrieved');
});
