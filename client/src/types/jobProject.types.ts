export interface JobMatchAnalysis {
  overallMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
  experienceGaps: string[];
  technologyGaps: string[];
  recommendedPreparationTopics: string[];
  analyzedAt: string;
}

export interface JobDescription {
  _id: string;
  title: string;
  company?: string;
  rawText: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirement?: string;
  educationRequirement?: string;
  technologies: string[];
  responsibilities: string[];
  analysis?: JobMatchAnalysis;
  usedFallbackAnalysis: boolean;
  createdAt: string;
}

export interface CreateJobPayload {
  title: string;
  company?: string;
  rawText: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  technologies: string[];
  features: string[];
  role?: string;
  challenges?: string;
  solutions?: string;
  githubUrl?: string;
  liveUrl?: string;
  createdAt: string;
}

export type CreateProjectPayload = Omit<Project, '_id' | 'createdAt'>;
