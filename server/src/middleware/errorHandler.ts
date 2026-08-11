import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

/**
 * Wraps async route handlers so thrown/rejected errors are forwarded
 * to Express's error pipeline instead of crashing the process or
 * requiring a try/catch in every controller.
 */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  } else if (err instanceof mongoose.Error.VersionError) {
    // A concurrent update raced this one out (optimistic concurrency
    // conflict). Treat as a conflict rather than an opaque 500 — the
    // client can typically just retry the request.
    statusCode = 409;
    message = 'This resource was updated by another request. Please try again.';
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate resource';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  const isServerError = statusCode >= 500;
  logger.log(isServerError ? 'error' : 'warn', message, {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    stack: isServerError ? err.stack : undefined,
  });

  sendError(res, message, statusCode, isProduction && isServerError ? undefined : errors);
}
