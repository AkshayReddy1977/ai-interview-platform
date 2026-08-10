import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);

/**
 * Node's own DNS resolver (c-ares) sometimes ignores the OS-level DNS
 * configuration on Windows, causing `mongodb+srv://` SRV-record lookups
 * to fail with ECONNREFUSED even when the OS's own DNS tools (nslookup)
 * resolve the same record fine. Pointing Node explicitly at public
 * resolvers fixes this without requiring OS network changes.
 */
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  } catch (error) {
    logger.error('MongoDB connection failed', { error: (error as Error).message });
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB error', { error: error.message });
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
