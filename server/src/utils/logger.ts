import winston from 'winston';
import { env, isProduction } from '../config/env';

/**
 * Fields that must never be written to logs, even accidentally
 * (e.g. someone spreads a whole request body into a log call).
 */
const REDACTED_KEYS = new Set([
  'password',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'AI_API_KEY',
  'EMBEDDING_API_KEY',
  'jwt',
]);

function redact(meta: unknown): unknown {
  if (meta === null || typeof meta !== 'object') return meta;
  if (Array.isArray(meta)) return meta.map(redact);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const redactFormat = winston.format((info) => {
  // Mutate in place rather than returning a new object — winston attaches
  // internal Symbol-keyed properties (level/message) to `info` that
  // colorize()/other formats depend on, and those are lost if we rebuild
  // the object with a spread.
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message' || key === 'timestamp') continue;
    info[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : redact(info[key]);
  }
  return info;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    isProduction ? winston.format.json() : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  transports: [new winston.transports.Console()],
});
