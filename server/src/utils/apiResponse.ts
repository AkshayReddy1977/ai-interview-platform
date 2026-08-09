import { Response } from 'express';

interface SuccessPayload<T> {
  success: true;
  data: T;
  message: string;
}

interface ErrorPayload {
  success: false;
  data: null;
  message: string;
  errors?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
  const payload: SuccessPayload<T> = { success: true, data, message };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, message: string, statusCode = 500, errors?: unknown): Response {
  const payload: ErrorPayload = { success: false, data: null, message, errors };
  return res.status(statusCode).json(payload);
}
