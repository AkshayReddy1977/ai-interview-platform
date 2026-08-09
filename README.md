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
- [ ] Phase 4 — Job description analysis
- [ ] Phase 5 — Projects and skills
- [ ] Phase 6 — AI question generation
- [ ] Phase 7 — Adaptive interview engine
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

## License

Private — add a license before making this repository public.
