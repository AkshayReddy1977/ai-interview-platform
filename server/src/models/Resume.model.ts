import { Schema, model, Document, Types } from 'mongoose';

export enum ResumeStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface ParsedEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  raw: string; // original line(s), kept for cases the parser under-extracts
}

interface ParsedExperience {
  organization?: string;
  title?: string;
  raw: string;
}

export interface IResume extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: ResumeStatus;
  extractedText?: string;
  parsed: {
    skills: string[];
    education: ParsedEducation[];
    experience: ParsedExperience[];
    projectTitles: string[];
  };
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalFilename: { type: String, required: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: { type: String, enum: Object.values(ResumeStatus), default: ResumeStatus.PROCESSING },
    extractedText: { type: String, select: false }, // large, only load when explicitly needed
    parsed: {
      skills: { type: [String], default: [] },
      education: {
        type: [
          {
            institution: String,
            degree: String,
            fieldOfStudy: String,
            raw: String,
          },
        ],
        default: [],
      },
      experience: {
        type: [
          {
            organization: String,
            title: String,
            raw: String,
          },
        ],
        default: [],
      },
      projectTitles: { type: [String], default: [] },
    },
    failureReason: { type: String },
  },
  { timestamps: true }
);

// Every resume list/detail query is scoped to a user; this makes that fast
// and also makes "most recent resume for user" queries efficient.
resumeSchema.index({ user: 1, createdAt: -1 });

export const Resume = model<IResume>('Resume', resumeSchema);
