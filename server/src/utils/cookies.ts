import { Response } from 'express';
import { isProduction } from '../config/env';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_REFRESH_EXPIRES_IN default

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' needed cross-site (Vercel <-> Render), requires secure
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth', // only sent to auth endpoints, minimizing exposure
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export { REFRESH_COOKIE_NAME };
