import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/AppError';
import { verifyLocalSignature } from '../services/storage/LocalStorageProvider';
import { getStorageProvider } from '../services/storage/storage.factory';

const router = Router();

router.get(
  '/local',
  asyncHandler(async (req: Request, res: Response) => {
    const { key, expires, sig } = req.query as { key?: string; expires?: string; sig?: string };

    if (!key || !expires || !sig) {
      throw AppError.badRequest('Missing signed URL parameters');
    }

    const isValid = verifyLocalSignature(key, Number(expires), sig);
    if (!isValid) {
      throw AppError.forbidden('This link has expired or is invalid');
    }

    const storage = getStorageProvider();
    const buffer = await storage.download(key);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  })
);

export default router;
