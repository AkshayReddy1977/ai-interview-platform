import { KNOWN_SKILLS } from '../data/knownSkills';
import { JobExtractionResult } from '../ai/prompts/jobExtraction.prompt';
import { MatchAnalysisResult } from '../ai/prompts/matchAnalysis.prompt';

function matchKnownSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (pattern.test(lower)) found.add(skill);
  }
  return Array.from(found).sort();
}

function extractExperienceRequirement(text: string): string {
  const match = text.match(/(\d+)\+?\s*(?:-\s*(\d+))?\s*years?/i);
  if (!match) return '';
  return match[2] ? `${match[1]}-${match[2]} years` : `${match[1]}+ years`;
}

function extractEducationRequirement(text: string): string {
  const degrees = ["bachelor's", "master's", 'phd', 'b.tech', 'm.tech', 'b.sc', 'm.sc'];
  const lower = text.toLowerCase();
  const found = degrees.find((d) => lower.includes(d));
  if (!found) return '';
  const sentence = text.split(/[.\n]/).find((s) => s.toLowerCase().includes(found));
  return sentence?.trim() ?? found;
}

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const sectionHeaders: Record<string, RegExp> = {
    requirements: /^(requirements?|qualifications?)\s*:?\s*$/i,
    preferred: /^(preferred|nice to have|bonus)\s*:?\s*$/i,
    responsibilities: /^(responsibilities|what you'?ll do|key duties)\s*:?\s*$/i,
  };

  const sections: Record<string, string[]> = { other: [] };
  let current = 'other';

  for (const line of lines) {
    const matchedHeader = Object.entries(sectionHeaders).find(([, pattern]) => pattern.test(line));
    if (matchedHeader) {
      current = matchedHeader[0];
      sections[current] = sections[current] ?? [];
      continue;
    }
    sections[current] = sections[current] ?? [];
    sections[current].push(line);
  }

  return sections;
}

function extractResponsibilities(sectionLines: string[]): string[] {
  return sectionLines
    .map((l) => l.replace(/^[-•*]\s*/, ''))
    .filter(Boolean)
    .slice(0, 15);
}

export function analyzeJobHeuristically(jobText: string): JobExtractionResult {
  const skills = matchKnownSkills(jobText);
  // Without real NLP, split matched skills roughly: mentioned near
  // "required"/"must" -> required, near "preferred"/"nice to have" -> preferred,
  // otherwise default to required (safer default for prep purposes).
  const lower = jobText.toLowerCase();
  const preferredSection = lower.includes('preferred') ? lower.slice(lower.indexOf('preferred')) : '';

  const preferredSkills = skills.filter((s) => preferredSection.includes(s));
  const requiredSkills = skills.filter((s) => !preferredSkills.includes(s));

  return {
    requiredSkills,
    preferredSkills,
    experienceRequirement: extractExperienceRequirement(jobText),
    educationRequirement: extractEducationRequirement(jobText),
    technologies: skills,
    responsibilities: extractResponsibilities(splitIntoSections(jobText).responsibilities ?? []),
  };
}

export function compareResumeToJobHeuristically(params: {
  resumeSkills: string[];
  jobRequiredSkills: string[];
  jobPreferredSkills: string[];
}): MatchAnalysisResult {
  const resumeSkillsLower = new Set(params.resumeSkills.map((s) => s.toLowerCase()));
  const allJobSkills = [...params.jobRequiredSkills, ...params.jobPreferredSkills];

  const matchedSkills = allJobSkills.filter((s) => resumeSkillsLower.has(s.toLowerCase()));
  const missingSkills = allJobSkills.filter((s) => !resumeSkillsLower.has(s.toLowerCase()));
  const missingRequired = params.jobRequiredSkills.filter((s) => !resumeSkillsLower.has(s.toLowerCase()));

  const totalRelevant = allJobSkills.length || 1;
  const score = Math.round((matchedSkills.length / totalRelevant) * 100);

  return {
    overallMatchScore: score,
    matchedSkills,
    missingSkills,
    weakAreas: [], // heuristic matching can't reliably assess "shallow vs deep" experience
    experienceGaps: [],
    technologyGaps: missingRequired,
    recommendedPreparationTopics: missingRequired.slice(0, 8),
  };
}
