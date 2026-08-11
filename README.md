# AI Interview & Career Preparation Platform

Personalized AI-powered interview preparation based on your resume, target job description, projects, skills, and study material.

> **Status:** Phase 1 of 15 complete — project architecture & scaffolding. See [Build Order](#build-order) below.

## Project Overview

This platform helps students and job seekers prepare for technical interviews by:
- Analyzing resumes against job descriptions to surface skill gaps
- Running adaptive AI mock interviews that get harder or easier based on answer quality
- Generating personalized learning plans for weak areas
- Letting users chat with their own uploaded study material via RAG

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS + Redux Toolkit + React Router |
| Backend | Node.js + Express + TypeScript + Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (access + refresh), bcrypt, role-based authorization |
| AI | LLM abstraction layer (provider-agnostic), structured JSON outputs |
| RAG | PDF/DOCX parsing → chunking → embeddings → MongoDB Atlas Vector Search |
| File storage | S3-compatible object storage (Cloudflare R2 / AWS S3) |
| Deployment | Frontend on Vercel, backend on Render/Railway (Docker), DB on Atlas |

## Architecture

```
ai-interview-platform/
├── client/        React + Vite + TS frontend
├── server/        Express + TS backend (REST API)
├── docker-compose.yml   Local dev: Mongo + Redis + server
└── .env.example
```

**Why the backend isn't on Vercel serverless:** the adaptive interview engine holds
conversational state across a session, RAG chunking/embedding is CPU/time-heavy, and
AI responses are streamed. Vercel functions are stateless with execution-time caps,
which is a poor fit here. Instead: frontend on Vercel, backend as a persistent Docker
container on Render or Railway. Full reasoning and alternative Vercel-adaptation notes
are in the [Deployment](#deployment) section (added in Phase 15).

## Installation

```bash
git clone <your-repo-url>
cd ai-interview-platform
npm install                # installs root + both workspaces
cp .env.example server/.env
# fill in server/.env with real values (see below)
```

## Environment Variables

See [`.env.example`](./.env.example) for the full list with descriptions. Copy it to
`server/.env` and never commit the filled-in version.

## Local Development

```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

- Backend: http://localhost:5000 (health check: `GET /health`)
- Frontend: http://localhost:5173

Or with Docker (backend + local Mongo + Redis):

```bash
docker compose up --build
```

## Build Order

- [x] Phase 1 — Project architecture & scaffolding
- [x] Phase 2 — MongoDB models + authentication
- [x] Phase 3 — User profile + resume management
- [x] Phase 4 — Job description analysis
- [x] Phase 5 — Projects and skills
- [x] Phase 6 — AI question generation
- [x] Phase 7 — Adaptive interview engine
- [ ] Phase 8 — Interview evaluation and analytics
- [ ] Phase 9 — PDF/document processing
- [ ] Phase 10 — RAG document chat
- [ ] Phase 11 — Personalized learning plan
- [ ] Phase 12 — Admin dashboard
- [ ] Phase 13 — Testing
- [ ] Phase 14 — Security hardening
- [ ] Phase 15 — Production deployment

Sections for API Documentation, Database Design, AI/RAG Architecture, Testing, and
Deployment will be filled in as each corresponding phase is built.

## API Endpoints (so far)

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account (name, email, password) |
| POST | `/api/auth/login` | No | Log in, returns access token + sets refresh cookie |
| POST | `/api/auth/refresh` | Refresh cookie | Rotates tokens, returns a new access token |
| POST | `/api/auth/logout` | Yes | Revokes the current refresh token |
| GET | `/api/auth/me` | Yes | Returns the current authenticated user |

All responses follow `{ success, data, message }`. Auth endpoints are rate-limited
(20 requests / 15 min) separately from the global API rate limit.

**Security notes:**
- Passwords are hashed with bcrypt (cost factor 12), never stored/logged in plaintext.
- Access tokens are short-lived JWTs sent in the response body (client keeps them in
  memory only — never localStorage, to reduce XSS exposure).
- Refresh tokens are long-lived, stored as httpOnly/secure cookies scoped to
  `/api/auth`, and stored server-side as SHA-256 hashes (not plaintext) so a DB leak
  alone can't be replayed. Refresh rotates the token and revokes the old one on each use.
- `role` can never be set by the client — the registration/login validators don't
  accept a `role` field at all, and the service layer hardcodes `USER` on creation.

### Users & Resumes (Phase 3)

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Yes | Get the current user's full profile |
| PUT | `/api/users/profile` | Yes | Update profile fields (never email/role/password) |
| POST | `/api/resumes` | Yes | Upload a resume PDF (`multipart/form-data`, field name `resume`) |
| GET | `/api/resumes` | Yes | List the current user's resumes |
| GET | `/api/resumes/:id` | Yes | Get one resume (ownership-checked) |
| DELETE | `/api/resumes/:id` | Yes | Delete a resume and its stored file |
| GET | `/api/files/local` | Signed URL | Serves locally-stored files via a short-lived signed link |

**File storage:** local disk by default (`server/uploads/`, gitignored), swappable for
S3/R2 by setting `STORAGE_PROVIDER=s3` and the matching credentials in `.env` — no
code changes needed. See `server/src/services/storage/`.

**Resume parsing:** PDF text extraction via `pdf-parse`, then heuristic
skill/education/experience extraction against a curated skills dictionary
(`server/src/data/knownSkills.ts`). This gets replaced/augmented by a real AI-driven
extraction in Phase 6 without changing the API shape.

### Jobs & Projects (Phase 4 & 5)

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/jobs` | Yes | Save a job description; extracts requirements immediately |
| GET | `/api/jobs` | Yes | List saved job descriptions |
| GET | `/api/jobs/:id` | Yes | Get one job description |
| DELETE | `/api/jobs/:id` | Yes | Delete a job description |
| POST | `/api/jobs/:id/analyze` | Yes | Compare against a resume (`{ resumeId }`), returns match score/gaps |
| POST | `/api/projects` | Yes | Add a project |
| GET | `/api/projects` | Yes | List projects |
| PUT | `/api/projects/:id` | Yes | Update a project |
| DELETE | `/api/projects/:id` | Yes | Delete a project |

**AI architecture:** `server/src/ai/` holds the provider abstraction (`AIProvider`
interface, `AnthropicProvider` implementation, `ai.factory.ts` for provider
selection) plus `generateStructured()`, which forces the model to return JSON
matching a Zod schema and auto-retries once with the validation error fed back if
the first response is malformed.

**Graceful AI degradation:** job description extraction and resume-match analysis
both try the real AI first, and **automatically fall back to a heuristic analyzer**
(`server/src/services/jdHeuristics.service.ts`) if the AI call fails or isn't
configured — so the feature works out of the box even without a valid `AI_API_KEY`.
Responses include `usedFallbackAnalysis: true` when this happens, so the frontend
can be transparent about it.

### Interviews (Phase 6 & 7)

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/interviews` | Yes | Start a session (`{ category, startingDifficulty? }`) — generates Q1 |
| GET | `/api/interviews` | Yes | List the user's interview sessions |
| GET | `/api/interviews/:id` | Yes | Get one session with all turns so far |
| POST | `/api/interviews/:id/answer` | Yes | Submit an answer to the current question — triggers evaluation + adaptive difficulty update |
| POST | `/api/interviews/:id/next-question` | Yes | Generate the next question (only after answering the current one) |
| GET | `/api/interviews/:id/report` | Yes | Generate (or re-fetch) the final aggregated report, marks session COMPLETED |
| POST | `/api/interviews/:id/abandon` | Yes | Mark an in-progress session as abandoned |

**Adaptive difficulty:** each answer evaluation includes a `suggestedNextDifficulty`
(from the AI, or from the heuristic fallback's score thresholds), which becomes
`currentDifficulty` for the next generated question. Sessions cap at 8 questions.

**Data model note:** `Interview` embeds each question/answer/evaluation as a `turns[]`
subdocument rather than using separate `InterviewQuestion`/`InterviewAnswer`
collections — turns are never queried or reused independently of their parent
interview, so embedding avoids unnecessary joins (see section 15's "avoid
unnecessary denormalization" — the reverse holds here: normalizing would be the
unnecessary complexity).

**Fallback question bank:** `server/src/data/questionBank.ts` has real, hand-written
questions per category/difficulty, used whenever AI generation fails or isn't
configured — the full interview flow (start → answer → adapt → next question →
report) works end-to-end without a live `AI_API_KEY`. Same pattern for answer
evaluation (`interviewHeuristics.service.ts`, keyword-overlap + length scoring) —
clearly weaker than real AI grading, and every fallback-scored turn is flagged via
`usedFallback: true` in the API response so the UI can show a disclaimer.

## License

Private — add a license before making this repository public.
