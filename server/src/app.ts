import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from './config/env';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { sendSuccess } from './utils/apiResponse';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (needed on Render/Railway/behind Vercel edge)
  app.set('trust proxy', 1);

  // --- Security headers ---
  app.use(helmet());

  // --- CORS: only the configured client origin, with credentials for cookies ---
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
  );

  // --- Body parsing ---
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());

  // --- Request logging (never logs bodies, so no secrets/PII leak into logs) ---
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  // --- Global rate limiting (defense in depth; sensitive routes add stricter limits) ---
  app.use(
    '/api',
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, data: null, message: 'Too many requests, please try again later.' },
    })
  );

  // --- Health check (used by Render/Railway/uptime monitors) ---
  app.get('/health', (_req, res) => {
    sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'Service healthy');
  });

  // --- API routes ---
  app.use('/api', apiRouter);

  // --- 404 + centralized error handling (must be last) ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
