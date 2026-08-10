import { JobDescription, JobStatus, IJobDescription } from '../models/JobDescription.model';
import { Resume } from '../models/Resume.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { generateStructured } from '../ai/generateStructured';
import { buildJobExtractionPrompt, jobExtractionSchema } from '../ai/prompts/jobExtraction.prompt';
import { buildMatchAnalysisPrompt, matchAnalysisSchema } from '../ai/prompts/matchAnalysis.prompt';
import { analyzeJobHeuristically, compareResumeToJobHeuristically } from './jdHeuristics.service';

export const jobService = {
  async create(userId: string, input: { title: string; company?: string; rawText: string }): Promise<IJobDescription> {
    const job = await JobDescription.create({
      user: userId,
      title: input.title,
      company: input.company,
      rawText: input.rawText,
      status: JobStatus.PROCESSING,
    });

    let usedFallback = false;
    try {
      const extraction = await generateStructured(buildJobExtractionPrompt(input.rawText), jobExtractionSchema);
      Object.assign(job, extraction);
    } catch (error) {
      // AI unavailable/misconfigured/malformed output — degrade gracefully
      // rather than failing the whole request. The user still gets a
      // usable extraction, just a less nuanced one.
      logger.warn('AI job extraction failed, using heuristic fallback', { error: (error as Error).message });
      Object.assign(job, analyzeJobHeuristically(input.rawText));
      usedFallback = true;
    }

    job.status = JobStatus.COMPLETED;
    job.usedFallbackAnalysis = usedFallback;
    await job.save();

    return job;
  },

  async listForUser(userId: string): Promise<IJobDescription[]> {
    return JobDescription.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getByIdForUser(userId: string, jobId: string): Promise<IJobDescription> {
    const job = await JobDescription.findOne({ _id: jobId, user: userId });
    if (!job) throw AppError.notFound('Job description not found');
    return job;
  },

  async deleteForUser(userId: string, jobId: string): Promise<void> {
    const result = await JobDescription.deleteOne({ _id: jobId, user: userId });
    if (result.deletedCount === 0) throw AppError.notFound('Job description not found');
  },

  async analyzeAgainstResume(userId: string, jobId: string, resumeId: string): Promise<IJobDescription> {
    const job = await JobDescription.findOne({ _id: jobId, user: userId });
    if (!job) throw AppError.notFound('Job description not found');

    const resume = await Resume.findOne({ _id: resumeId, user: userId }).select('+extractedText');
    if (!resume) throw AppError.notFound('Resume not found');

    let analysisResult;
    let usedFallback = false;
    try {
      analysisResult = await generateStructured(
        buildMatchAnalysisPrompt({
          resumeSkills: resume.parsed?.skills ?? [],
          resumeText: resume.extractedText ?? '',
          jobRequiredSkills: job.requiredSkills,
          jobPreferredSkills: job.preferredSkills,
          jobText: job.rawText,
        }),
        matchAnalysisSchema
      );
    } catch (error) {
      logger.warn('AI match analysis failed, using heuristic fallback', { error: (error as Error).message });
      analysisResult = compareResumeToJobHeuristically({
        resumeSkills: resume.parsed?.skills ?? [],
        jobRequiredSkills: job.requiredSkills,
        jobPreferredSkills: job.preferredSkills,
      });
      usedFallback = true;
    }

    job.analysis = {
      resume: resume._id,
      ...analysisResult,
      analyzedAt: new Date(),
    };
    job.usedFallbackAnalysis = usedFallback;
    await job.save();

    return job;
  },
};
