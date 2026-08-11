/**
 * Heuristic skill matching dictionary for Phase 3's rule-based resume
 * parser. This is intentionally not exhaustive — Phase 6 replaces/augments
 * this with an AIService.analyzeResume() call for far better extraction.
 * Keeping this as a flat, easily-extended list rather than embedding it
 * in parsing logic.
 */
export const KNOWN_SKILLS: string[] = [
  // Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift', 'sql',
  // Frontend
  'react', 'redux', 'vue', 'angular', 'next.js', 'tailwind', 'tailwind css', 'html', 'css', 'sass', 'webpack', 'vite',
  // Backend
  'node.js', 'express', 'nestjs', 'django', 'flask', 'spring', 'spring boot', 'graphql', 'rest api', 'grpc',
  // Databases
  'mongodb', 'mongoose', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'sqlite', 'firebase',
  // Cloud / DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'github actions', 'nginx',
  // AI / Data
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'llm', 'rag', 'nlp',
  // Testing
  'jest', 'mocha', 'cypress', 'playwright', 'pytest', 'junit',
  // General CS
  'data structures', 'algorithms', 'system design', 'microservices', 'oop', 'design patterns', 'agile', 'scrum',
  'git', 'linux', 'websockets', 'oauth', 'jwt',
];
