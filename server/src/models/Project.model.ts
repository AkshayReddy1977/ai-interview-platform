import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description: string;
  technologies: string[];
  features: string[];
  role?: string;
  challenges?: string;
  solutions?: string;
  githubUrl?: string;
  liveUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    technologies: { type: [String], default: [] },
    features: { type: [String], default: [] },
    role: { type: String, trim: true, maxlength: 150 },
    challenges: { type: String, trim: true, maxlength: 2000 },
    solutions: { type: String, trim: true, maxlength: 2000 },
    githubUrl: { type: String, trim: true, maxlength: 300 },
    liveUrl: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, createdAt: -1 });

export const Project = model<IProject>('Project', projectSchema);
