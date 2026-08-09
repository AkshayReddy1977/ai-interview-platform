import { KNOWN_SKILLS } from '../data/knownSkills';

interface ParsedResumeData {
  skills: string[];
  education: { institution: string; degree?: string; fieldOfStudy?: string; raw: string }[];
  experience: { organization?: string; title?: string; raw: string }[];
  projectTitles: string[];
}

const SECTION_HEADERS = {
  education: /^(education|academic background)\b/i,
  experience: /^(experience|work experience|employment history|professional experience)\b/i,
  projects: /^(projects|personal projects|academic projects)\b/i,
  skills: /^(skills|technical skills|technologies)\b/i,
};

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const sections: Record<string, string[]> = { other: [] };
  let current = 'other';

  for (const line of lines) {
    const matchedHeader = Object.entries(SECTION_HEADERS).find(([, pattern]) => pattern.test(line));
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

function extractSkills(fullText: string): string[] {
  const lowerText = fullText.toLowerCase();
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    // Word-boundary match to avoid "go" matching inside "google", etc.
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (pattern.test(lowerText)) {
      found.add(skill);
    }
  }
  return Array.from(found).sort();
}

function extractEducation(lines: string[]): ParsedResumeData['education'] {
  // Heuristic: education entries typically start with a line containing
  // a degree keyword or are the first line of a paragraph-like chunk.
  const degreeKeywords = /(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|phd|diploma|b\.?e\.?|m\.?e\.?)/i;
  const entries: ParsedResumeData['education'] = [];

  for (const line of lines) {
    if (!line) continue;
    const degreeMatch = line.match(degreeKeywords);
    entries.push({
      institution: line.split(',')[0]?.trim() || line,
      degree: degreeMatch ? degreeMatch[0] : undefined,
      raw: line,
    });
  }

  return entries.slice(0, 10); // sane cap
}

function extractExperience(lines: string[]): ParsedResumeData['experience'] {
  const entries: ParsedResumeData['experience'] = [];
  for (const line of lines) {
    if (!line) continue;
    // Common resume pattern: "Title, Company" or "Title at Company" or "Company - Title"
    const atMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    const commaMatch = line.split(',');
    entries.push({
      title: atMatch ? atMatch[1].trim() : commaMatch[0]?.trim(),
      organization: atMatch ? atMatch[2].trim() : commaMatch[1]?.trim(),
      raw: line,
    });
  }
  return entries.slice(0, 15);
}

function extractProjectTitles(lines: string[]): string[] {
  // Project section entries are usually short title lines, often followed
  // by bullet-point descriptions — we only want the title lines themselves.
  return lines
    .filter((line) => line.length > 0 && line.length < 100 && !line.startsWith('•') && !line.startsWith('-'))
    .slice(0, 20);
}

export function parseResumeText(rawText: string): ParsedResumeData {
  const sections = splitIntoSections(rawText);

  return {
    skills: extractSkills(rawText),
    education: extractEducation(sections.education ?? []),
    experience: extractExperience(sections.experience ?? []),
    projectTitles: extractProjectTitles(sections.projects ?? []),
  };
}
