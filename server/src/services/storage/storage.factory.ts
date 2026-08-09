import { env } from '../../config/env';
import { StorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

let cachedProvider: StorageProvider | null = null;

/**
 * The only place in the codebase that reads STORAGE_PROVIDER. Everything
 * else — controllers, services — depends on the StorageProvider interface
 * and calls getStorageProvider(), so switching from local disk to S3/R2
 * in production is a one-line env change, not a code change.
 */
export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider = env.STORAGE_PROVIDER === 's3' ? new S3StorageProvider() : new LocalStorageProvider();

  return cachedProvider;
}
