import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Generic body-validation middleware. Parses req.body against the given
 * schema; on success, replaces req.body with the parsed (typed, trimmed,
 * coerced) result so downstream code never has to re-validate.
 *
 * Critically, schemas below never include a `role` field for user-supplied
 * input — role is set exclusively server-side in the service layer, so
 * there is no code path where a client request body can influence it.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(AppError.badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    req.body = result.data;
    next();
  };
}

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
