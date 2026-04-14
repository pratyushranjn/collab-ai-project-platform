# Contributing to Collab AI Project Platform

Thank you for your interest in contributing to **CollabHub**! 🎉  
This guide will help you get started quickly and make sure your contributions are aligned with the project's standards.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Making a Contribution](#making-a-contribution)
- [Code Standards](#code-standards)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/collab-ai-project-platform.git
   cd collab-ai-project-platform
   ```
3. Add the upstream remote so you can keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/pratyushranjn/collab-ai-project-platform.git
   ```

---

## Project Structure

```
collab-ai-project-platform/
├── backend/      # Node.js + Express API (MongoDB, Redis, Socket.IO)
└── frontend/     # React + Vite + Tailwind CSS
```

---

## Development Setup

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18+ |
| MongoDB | 6+ |
| Redis | 7+ |
| npm | 9+ |

### Backend

```bash
cd backend
cp .env.example .env   # fill in your environment variables
npm install
npm run dev            # starts with nodemon on port 3000
```

Required `.env` keys:

```
PORT=3000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<strong-secret>
REDIS_URL=<your-redis-url>
GEMINI_API_KEY=<your-gemini-key>
EMAIL_HOST=<smtp-host>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-password>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:3000
npm install
npm run dev            # starts on port 5173
```

### Docker (optional)

If you have Docker and Docker Compose installed, spin up both services at once:

```bash
docker-compose up --build
```

---

## Making a Contribution

1. **Sync your fork** with upstream before starting work:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. **Create a feature branch** with a descriptive name:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/short-bug-description
   ```
3. **Make your changes** — keep commits small and focused.
4. **Lint your code** before pushing:
   ```bash
   # Frontend
   cd frontend && npm run lint
   ```
5. **Push** your branch and open a Pull Request against `main`.

---

## Code Standards

### Backend (Node.js / Express)

- Use `asyncWrap` for all async route handlers instead of try/catch blocks.
- Throw `ExpressError(statusCode, message)` for error responses — never call `res.status(...).json(...)` directly in error paths.
- Keep controllers thin — move business logic and third-party calls into the `services/` directory.
- Remove any debug `console.log` statements before committing.

### Frontend (React / Tailwind)

- Use functional components with React hooks.
- Keep components in the `src/components/` directory; pages go in `src/pages/`.
- Use `axios` (via `src/api/`) for all API calls — avoid `fetch` directly.
- Style exclusively with Tailwind CSS utility classes.

### Git Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add dark mode toggle
fix: correct task ordering on Kanban drop
chore: update dependencies
docs: improve CONTRIBUTING guide
```

---

## Submitting a Pull Request

1. Make sure your branch is up to date with `upstream/main`.
2. Fill in the PR template (title, description of changes, screenshots for UI changes).
3. Link any related issue with `Closes #<issue-number>`.
4. Request a review from a maintainer.
5. Address review feedback promptly — keep the discussion respectful and constructive.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/pratyushranjn/collab-ai-project-platform/issues) and include:

- A clear and concise description of the bug.
- Steps to reproduce the behaviour.
- Expected vs. actual result.
- Screenshots or error logs if applicable.
- Environment details (OS, browser, Node version).

---

## Suggesting Features

Open an issue with the **enhancement** label and describe:

- The problem you're trying to solve.
- Your proposed solution or idea.
- Any alternative approaches you considered.

---

We appreciate every contribution, no matter how small. Happy coding! 🚀
