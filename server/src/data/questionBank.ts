export type InterviewCategory =
  | 'JavaScript'
  | 'React'
  | 'Node.js'
  | 'Express'
  | 'MongoDB'
  | 'REST APIs'
  | 'Authentication'
  | 'System Design'
  | 'DBMS'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'DSA'
  | 'Behavioral'
  | 'Project-based'
  | 'HR';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface BankQuestion {
  question: string;
  expectedTopics: string[];
}

type QuestionBank = Record<InterviewCategory, Partial<Record<Difficulty, BankQuestion[]>>>;

export const QUESTION_BANK: QuestionBank = {
  JavaScript: {
    Beginner: [
      { question: 'What is the difference between `var`, `let`, and `const`?', expectedTopics: ['scope', 'hoisting', 'reassignment'] },
      { question: 'Explain what `NaN` is and how to check if a value is `NaN`.', expectedTopics: ['NaN', 'isNaN', 'Number.isNaN'] },
    ],
    Intermediate: [
      { question: 'Explain closures with an example.', expectedTopics: ['closure', 'lexical scope', 'function'] },
      { question: 'What is the event loop and how does it handle asynchronous code?', expectedTopics: ['event loop', 'call stack', 'microtask', 'macrotask'] },
    ],
    Advanced: [
      { question: 'How does prototypal inheritance work in JavaScript, and how does it differ from classical inheritance?', expectedTopics: ['prototype', 'inheritance', '__proto__', 'Object.create'] },
      { question: 'Explain debouncing and throttling, and when you would use each.', expectedTopics: ['debounce', 'throttle', 'performance', 'rate limiting'] },
    ],
    Expert: [
      { question: 'Walk through how you would implement your own version of `Promise.all`.', expectedTopics: ['promise', 'async', 'concurrency', 'error handling'] },
    ],
  },
  React: {
    Beginner: [
      { question: 'What is the difference between props and state?', expectedTopics: ['props', 'state', 'immutability'] },
    ],
    Intermediate: [
      { question: 'Explain the dependency array in `useEffect` and common pitfalls with it.', expectedTopics: ['useEffect', 'dependency array', 'stale closure'] },
      { question: 'How would you optimize a React app that re-renders too often?', expectedTopics: ['memo', 'useMemo', 'useCallback', 're-render'] },
    ],
    Advanced: [
      { question: 'Explain how React\'s reconciliation algorithm works.', expectedTopics: ['reconciliation', 'virtual DOM', 'diffing', 'keys'] },
    ],
    Expert: [
      { question: 'How would you design a custom hook for optimistic UI updates with rollback on failure?', expectedTopics: ['custom hook', 'optimistic update', 'rollback', 'state management'] },
    ],
  },
  'Node.js': {
    Beginner: [{ question: 'What is the event loop in Node.js?', expectedTopics: ['event loop', 'non-blocking', 'single-threaded'] }],
    Intermediate: [
      { question: 'How do streams work in Node.js, and why are they useful?', expectedTopics: ['streams', 'buffer', 'backpressure'] },
    ],
    Advanced: [
      { question: 'How would you handle CPU-intensive work in a Node.js server without blocking the event loop?', expectedTopics: ['worker threads', 'child process', 'clustering'] },
    ],
    Expert: [],
  },
  Express: {
    Beginner: [{ question: 'What is middleware in Express and how does it work?', expectedTopics: ['middleware', 'next()', 'request pipeline'] }],
    Intermediate: [
      { question: 'How would you structure error handling in a large Express application?', expectedTopics: ['error handling', 'middleware', 'centralized'] },
    ],
    Advanced: [],
    Expert: [],
  },
  MongoDB: {
    Beginner: [{ question: 'What is the difference between SQL and MongoDB\'s document model?', expectedTopics: ['document', 'schema', 'NoSQL'] }],
    Intermediate: [
      { question: 'When would you embed documents vs reference them in MongoDB?', expectedTopics: ['embedding', 'referencing', 'denormalization'] },
      { question: 'How do indexes work in MongoDB and when would you add one?', expectedTopics: ['index', 'query performance', 'compound index'] },
    ],
    Advanced: [
      { question: 'Explain how you would design a schema for a many-to-many relationship at scale.', expectedTopics: ['many-to-many', 'schema design', 'aggregation'] },
    ],
    Expert: [],
  },
  'REST APIs': {
    Beginner: [{ question: 'What makes an API RESTful?', expectedTopics: ['REST', 'statelessness', 'resources', 'HTTP methods'] }],
    Intermediate: [{ question: 'How would you design pagination for a large list endpoint?', expectedTopics: ['pagination', 'cursor', 'offset', 'limit'] }],
    Advanced: [],
    Expert: [],
  },
  Authentication: {
    Beginner: [{ question: 'What is the difference between authentication and authorization?', expectedTopics: ['authentication', 'authorization'] }],
    Intermediate: [
      { question: 'Explain how JWT-based authentication works, including its tradeoffs vs sessions.', expectedTopics: ['JWT', 'session', 'stateless', 'token'] },
    ],
    Advanced: [
      { question: 'How would you securely implement refresh token rotation?', expectedTopics: ['refresh token', 'rotation', 'revocation'] },
    ],
    Expert: [],
  },
  'System Design': {
    Beginner: [],
    Intermediate: [
      { question: 'How would you design a URL shortener at a high level?', expectedTopics: ['scalability', 'database', 'hashing', 'caching'] },
    ],
    Advanced: [
      { question: 'Design a scalable notification system that supports email, SMS, and push notifications.', expectedTopics: ['queue', 'scalability', 'fan-out', 'reliability'] },
    ],
    Expert: [
      { question: 'Design a distributed rate limiter that works across multiple server instances.', expectedTopics: ['rate limiting', 'distributed systems', 'redis', 'consistency'] },
    ],
  },
  DBMS: {
    Beginner: [{ question: 'What is database normalization and why is it used?', expectedTopics: ['normalization', 'redundancy'] }],
    Intermediate: [{ question: 'Explain ACID properties in the context of transactions.', expectedTopics: ['atomicity', 'consistency', 'isolation', 'durability'] }],
    Advanced: [],
    Expert: [],
  },
  'Operating Systems': {
    Beginner: [{ question: 'What is the difference between a process and a thread?', expectedTopics: ['process', 'thread', 'memory'] }],
    Intermediate: [{ question: 'Explain deadlock and the conditions required for it to occur.', expectedTopics: ['deadlock', 'mutual exclusion', 'circular wait'] }],
    Advanced: [],
    Expert: [],
  },
  'Computer Networks': {
    Beginner: [{ question: 'What happens when you type a URL into a browser and press enter?', expectedTopics: ['DNS', 'TCP', 'HTTP', 'TLS'] }],
    Intermediate: [{ question: 'Explain the difference between TCP and UDP and when you would use each.', expectedTopics: ['TCP', 'UDP', 'reliability', 'latency'] }],
    Advanced: [],
    Expert: [],
  },
  DSA: {
    Beginner: [{ question: 'Explain the time complexity difference between an array and a linked list for insertion.', expectedTopics: ['array', 'linked list', 'big O'] }],
    Intermediate: [{ question: 'How would you detect a cycle in a linked list?', expectedTopics: ['cycle detection', 'linked list', 'two pointer'] }],
    Advanced: [{ question: 'Explain how you would find the shortest path in a weighted graph.', expectedTopics: ['dijkstra', 'graph', 'shortest path'] }],
    Expert: [],
  },
  Behavioral: {
    Beginner: [{ question: 'Tell me about a time you disagreed with a teammate. How did you handle it?', expectedTopics: ['conflict resolution', 'communication', 'teamwork'] }],
    Intermediate: [{ question: 'Describe a time you had to meet a tight deadline. What was your approach?', expectedTopics: ['time management', 'prioritization'] }],
    Advanced: [],
    Expert: [],
  },
  'Project-based': {
    Beginner: [],
    Intermediate: [],
    Advanced: [],
    Expert: [],
  },
  HR: {
    Beginner: [{ question: 'Why do you want to work at our company?', expectedTopics: ['motivation', 'company research'] }],
    Intermediate: [{ question: 'Where do you see yourself in five years?', expectedTopics: ['career goals'] }],
    Advanced: [],
    Expert: [],
  },
};

export const INTERVIEW_CATEGORIES = Object.keys(QUESTION_BANK) as InterviewCategory[];
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

/**
 * Picks a fallback question for the given category/difficulty, avoiding
 * questions already asked in this session where possible.
 */
export function pickFallbackQuestion(
  category: InterviewCategory,
  difficulty: Difficulty,
  excludeQuestions: string[]
): BankQuestion {
  const pool = QUESTION_BANK[category]?.[difficulty] ?? [];
  const unused = pool.filter((q) => !excludeQuestions.includes(q.question));
  const candidates = unused.length > 0 ? unused : pool;

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // No question at this exact difficulty — fall back to any difficulty in the category.
  const allInCategory = Object.values(QUESTION_BANK[category] ?? {}).flat();
  const fallbackUnused = allInCategory.filter((q) => !excludeQuestions.includes(q.question));
  const finalPool = fallbackUnused.length > 0 ? fallbackUnused : allInCategory;

  if (finalPool.length === 0) {
    return {
      question: `Tell me about your experience with ${category}.`,
      expectedTopics: [category.toLowerCase()],
    };
  }
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
