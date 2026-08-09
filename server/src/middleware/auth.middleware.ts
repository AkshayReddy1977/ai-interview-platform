import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';
import { Role } from '../models/User.model';

/**
 * Requires a valid access token in the Authorization header.
 * Populates req.user with { id, email, role } decoded from the token —
 * it is NOT re-fetched from the DB on every request for performance;
 * routes that need fresh/authoritative user state (e.g. checking isActive)
 * should query the DB explicitly in their service layer.
 */
export function protect(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

/**
 * Restricts a route to specific roles. Must run after `protect`.
 * Usage: router.get('/admin/stats', protect, authorize(Role.ADMIN), handler)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
