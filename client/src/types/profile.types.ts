export interface EducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  phone?: string;
  location?: string;
  bio?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  activeResume?: Resume | string;
}

export type UpdateProfilePayload = Partial<
  Pick<UserProfile, 'name' | 'phone' | 'location' | 'bio' | 'education' | 'experience' | 'skills' | 'github' | 'linkedin' | 'portfolio'>
>;

export type ResumeStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Resume {
  _id: string;
  originalFilename: string;
  status: ResumeStatus;
  sizeBytes: number;
  failureReason?: string;
  parsed?: {
    skills: string[];
    education: { institution: string; degree?: string; raw: string }[];
    experience: { organization?: string; title?: string; raw: string }[];
    projectTitles: string[];
  };
  createdAt: string;
}
