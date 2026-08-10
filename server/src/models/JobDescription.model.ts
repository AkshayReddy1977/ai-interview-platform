import { Schema, model, Document, Types } from 'mongoose';

export enum JobStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface MatchAnalysis {
  resume: Types.ObjectId;
  overallMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
  experienceGaps: string[];
  technologyGaps: string[];
  recommendedPreparationTopics: string[];
  analyzedAt: Date;
}

export interface IJobDescription extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  company?: string;
  rawText: string;
  status: JobStatus;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirement?: string;
  educationRequirement?: string;
  technologies: string[];
  responsibilities: string[];
  analysis?: MatchAnalysis;
  usedFallbackAnalysis: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobDescriptionSchema = new Schema<IJobDescription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, trim: true, maxlength: 200 },
    rawText: { type: String, required: true },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.PROCESSING },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    experienceRequirement: { type: String },
    educationRequirement: { type: String },
    technologies: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    analysis: {
      type: {
        resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
        overallMatchScore: Number,
        matchedSkills: [String],
        missingSkills: [String],
        weakAreas: [String],
        experienceGaps: [String],
        technologyGaps: [String],
        recommendedPreparationTopics: [String],
        analyzedAt: Date,
      },
      required: false,
    },
    usedFallbackAnalysis: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobDescriptionSchema.index({ user: 1, createdAt: -1 });

export const JobDescription = model<IJobDescription>('JobDescription', jobDescriptionSchema);
