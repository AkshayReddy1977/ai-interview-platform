import { Schema, model, Document, Types } from 'mongoose';
import { INTERVIEW_CATEGORIES, DIFFICULTIES, InterviewCategory, Difficulty } from '../data/questionBank';

export enum InterviewStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface IInterviewTurn {
  question: string;
  expectedTopics: string[];
  difficulty: Difficulty;
  askedAt: Date;
  answer?: string;
  answeredAt?: Date;
  evaluation?: {
    technicalAccuracy: number;
    completeness: number;
    clarity: number;
    communication: number;
    depth: number;
    confidence: number;
    score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  };
  usedFallback: boolean;
}

export interface IInterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  knowledgeDepth: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendedTopics: string[];
  summary: string;
  generatedAt: Date;
}

export interface IInterview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  category: InterviewCategory;
  status: InterviewStatus;
  currentDifficulty: Difficulty;
  jobDescription?: Types.ObjectId;
  resume?: Types.ObjectId;
  turns: IInterviewTurn[];
  report?: IInterviewReport;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const turnSchema = new Schema<IInterviewTurn>(
  {
    question: { type: String, required: true },
    expectedTopics: { type: [String], default: [] },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    askedAt: { type: Date, default: Date.now },
    answer: { type: String },
    answeredAt: { type: Date },
    evaluation: {
      type: {
        technicalAccuracy: Number,
        completeness: Number,
        clarity: Number,
        communication: Number,
        depth: Number,
        confidence: Number,
        score: Number,
        strengths: [String],
        weaknesses: [String],
        feedback: String,
      },
      required: false,
    },
    usedFallback: { type: Boolean, default: false },
  },
  { _id: true }
);

const interviewSchema = new Schema<IInterview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: INTERVIEW_CATEGORIES, required: true },
    status: { type: String, enum: Object.values(InterviewStatus), default: InterviewStatus.IN_PROGRESS },
    currentDifficulty: { type: String, enum: DIFFICULTIES, default: 'Beginner' },
    jobDescription: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
    resume: { type: Schema.Types.ObjectId, ref: 'Resume' },
    turns: { type: [turnSchema], default: [] },
    report: {
      type: {
        overallScore: Number,
        technicalScore: Number,
        communicationScore: Number,
        problemSolvingScore: Number,
        knowledgeDepth: Number,
        strongAreas: [String],
        weakAreas: [String],
        recommendedTopics: [String],
        summary: String,
        generatedAt: Date,
      },
      required: false,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ user: 1, status: 1 });

export const Interview = model<IInterview>('Interview', interviewSchema);
