import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, UploadedFileRef } from './StorageProvider';
import { AppError } from '../../utils/AppError';

const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads');

// Signed local URLs are just a short-lived HMAC token appended to the
// key, verified by a dedicated route — this mirrors how a real pre-signed
// S3 URL behaves (time-limited, tamper-proof) without needing a cloud account.
const SIGNING_SECRET = process.env.JWT_SECRET ?? 'dev-only-fallback-secret';

function sign(key: string, expiresAt: number): string {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(`${key}:${expiresAt}`).digest('hex');
}

export function verifyLocalSignature(key: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) return false;
  const expected = sign(key, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export class LocalStorageProvider implements StorageProvider {
  private resolvePath(key: string): string {
    const resolved = path.resolve(STORAGE_ROOT, key);
    // Defense in depth against path traversal (e.g. key containing "../../").
    if (!resolved.startsWith(STORAGE_ROOT)) {
      throw AppError.badRequest('Invalid storage key');
    }
    return resolved;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadedFileRef> {
    const filePath = this.resolvePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return { key, size: buffer.length, mimeType };
  }

  async download(key: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.resolvePath(key));
    } catch {
      throw AppError.notFound('File not found in storage');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolvePath(key));
    } catch {
      // Already gone — deletion is idempotent, not an error.
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const signature = sign(key, expiresAt);
    return `/api/files/local?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${signature}`;
  }
}
