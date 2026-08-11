import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(AppError.badRequest('Only PDF files are allowed'));
    return;
  }
  cb(null, true);
}

/**
 * Uses memory storage rather than disk storage: the file buffer is
 * validated (type, size) and handed to the StorageProvider abstraction
 * directly, without ever writing an unvalidated file to disk first.
 */
export const uploadResumePdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter,
}).single('resume');
