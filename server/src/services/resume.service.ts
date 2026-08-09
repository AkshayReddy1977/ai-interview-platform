import pdfParse from 'pdf-parse';
import { Resume, ResumeStatus, IResume } from '../models/Resume.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { getStorageProvider } from './storage/storage.factory';
import { buildStorageKey } from './storage/StorageProvider';
import { parseResumeText } from './resumeParser.service';

export { buildStorageKey };

export const resumeService = {
  async upload(userId: string, file: Express.Multer.File): Promise<IResume> {
    const storage = getStorageProvider();
    const key = buildStorageKey(userId, 'resumes', file.originalname);

    await storage.upload(key, file.buffer, file.mimetype);

    const resume = await Resume.create({
      user: userId,
      originalFilename: file.originalname,
      storageKey: key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: ResumeStatus.PROCESSING,
    });

    // Extraction happens synchronously here for simplicity at this scale.
    // A production system with heavier traffic would push this to a queue
    // (BullMQ/SQS) and let the client poll `status`; the API shape below
    // (status: PROCESSING -> COMPLETED/FAILED) is already designed for
    // that upgrade without a breaking change.
    try {
      const { text } = await pdfParse(file.buffer);
      const parsed = parseResumeText(text);

      resume.extractedText = text;
      resume.parsed = parsed;
      resume.status = ResumeStatus.COMPLETED;
      await resume.save();

      // Merge extracted skills into the user's profile (union, no duplicates)
      // so job-description matching in Phase 4 has something to work with
      // immediately, without requiring the user to re-enter everything.
      await User.updateOne({ _id: userId }, { $addToSet: { skills: { $each: parsed.skills } }, activeResume: resume._id });

      logger.info('Resume parsed successfully', { userId, resumeId: resume._id.toString() });
    } catch (error) {
      resume.status = ResumeStatus.FAILED;
      resume.failureReason = 'Could not extract text from this PDF. It may be scanned/image-based or corrupted.';
      await resume.save();
      logger.error('Resume parsing failed', { userId, resumeId: resume._id.toString(), error: (error as Error).message });
    }

    return resume;
  },

  async listForUser(userId: string): Promise<IResume[]> {
    return Resume.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getByIdForUser(userId: string, resumeId: string): Promise<IResume> {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) {
      // Same message whether it doesn't exist or belongs to someone else —
      // never leak which case it is.
      throw AppError.notFound('Resume not found');
    }
    return resume;
  },

  async deleteForUser(userId: string, resumeId: string): Promise<void> {
    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) {
      throw AppError.notFound('Resume not found');
    }

    const storage = getStorageProvider();
    await storage.delete(resume.storageKey);
    await resume.deleteOne();

    await User.updateOne({ _id: userId, activeResume: resume._id }, { $unset: { activeResume: '' } });
  },
};
