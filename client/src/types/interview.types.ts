export type InterviewCategory =
  | 'JavaScript' | 'React' | 'Node.js' | 'Express' | 'MongoDB' | 'REST APIs' | 'Authentication'
  | 'System Design' | 'DBMS' | 'Operating Systems' | 'Computer Networks' | 'DSA'
  | 'Behavioral' | 'Project-based' | 'HR';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface TurnEvaluation {
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
}

export interface InterviewTurn {
  _id: string;
  question: string;
  expectedTopics: string[];
  difficulty: Difficulty;
  answer?: string;
  evaluation?: TurnEvaluation;
  usedFallback: boolean;
}

export interface InterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  knowledgeDepth: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendedTopics: string[];
  summary: string;
}

export interface Interview {
  _id: string;
  category: InterviewCategory;
  status: InterviewStatus;
  currentDifficulty: Difficulty;
  turns: InterviewTurn[];
  report?: InterviewReport;
  startedAt: string;
  completedAt?: string;
}

export const INTERVIEW_CATEGORIES: InterviewCategory[] = [
  'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Authentication',
  'System Design', 'DBMS', 'Operating Systems', 'Computer Networks', 'DSA',
  'Behavioral', 'Project-based', 'HR',
];
