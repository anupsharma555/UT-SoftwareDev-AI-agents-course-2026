# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the Week 9 milestone of the course: adding Gemini-backed AI features to ThreadHive, a Reddit-style discussion application. The problem statement is in `WK9_MLS_Problem_Statement.pdf`.

| Directory | Purpose |
| --- | --- |
| `WK9_MLS_Starter_Code/` | The application **before** AI features. All implementation work happens here. `resources/prompts.md` contains the planning prompts for the two features: Thread Summary and Rephrase Text. |
| `WK9_MLS_Solution/` | Reference implementation. Use it for comparison only; do not modify it. |

`threadhive-backend/` and `threadhive-frontend/` are independent npm projects. Run all commands from within the respective directory.

The solution's backend differs from the starter in the following ways:

- Adds `src/utils/aiProvider.js`.
- Adds an auth-protected `GET /api/threads/:id/summary` route, wired through `threadController` → `threadService.generateThreadSummaryService`.
- Adds the dependencies `@google/genai` and `openai`.

## Commands

### Backend (`threadhive-backend`: Express 5, ES modules, MongoDB/Mongoose)

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Configure environment | Copy `.env.example` to `.env` and set `MONGODB_URI`, `PORT`, `JWT_SECRET`, `JWT_EXPIRATION`, `NODE_ENV`, `GEMINI_API_KEY` |
| Seed the database | `npm run populate` (runs `src/scripts/populate_db.js`) |
| Run in development / production | `npm run dev` (nodemon) / `npm start` |
| Run all tests | `npm test` (vitest) |
| Run a single test file | `npx vitest run tests/unit/services/threadService.test.js` |
| Run tests by name | `npx vitest run -t "pattern"` |
| Format code | `npm run format` (prettier) |

### Frontend (`threadhive-frontend`: Vite + React 19)

| Task | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Run tests (watch mode) | `npm test` |
| Run a single test file once | `npx vitest run tests/integration/threadFlow.test.jsx` |

## Architecture

### Backend

Request flow: `src/app.js` (helmet, rate limit of 100 requests per 15 minutes, cors, json) → `routes/*` → `controllers/*` → `services/*` → `models/*`, with `middleware/errorHandler.js` registered last.

- **Business logic** lives in services, which throw errors via `utils/createAppError.js` (message and status code).
- **Error responses** are formatted by the error handler as `{ success: false, message }`, with `stack` added when `NODE_ENV=development`.
- **Authentication** uses JWT, enforced by `middleware/authHandler.js`.
- **Routes** are mounted at `/api/threads`, `/api/subreddits`, `/api/auth`, `/api/comments`, and `/api` (votes).
- **Startup:** `main.js` connects to the database and then starts `server.js`. `app.js` is exported separately so tests can use supertest.

**Tests:** `tests/unit/**` covers controllers, services, middleware, and utils. `tests/integration/**` uses supertest. `tests/setup.js` uses `mongodb-memory-server`. Test files run serially (`fileParallelism: false`) with a 60-second timeout.

### Frontend

- **State:** Redux Toolkit store (`store/store.js`) with slices in `reducers/` (auth, threads, currentThread, comments, theme, subreddits).
- **Data flow:** page/component → `services/*` → `api/axiosInstance.js` (base URL hardcoded to `http://localhost:5001/api`), using endpoint paths from `config/apiConfig.js`. New endpoints belong in `apiConfig.js` and a corresponding service.
- **Pages:** `pages/` contains Home, ThreadPage, Profile, and Auth. The Summarize feature belongs on the thread page, below the thread content and above the comment form and list.
- **UI:** react-bootstrap.

**Tests:** Integration tests (`tests/integration/*Flow.test.jsx`) mock the API with MSW (`tests/mocks/handlers.js`, `mockData.js`) against the same `localhost:5001/api` base URL. Add a handler there whenever a new endpoint is added.

## Important Notes

- **Initialize the Gemini client after dotenv.** Create it only after `dotenv.config()` has run. ES module imports are hoisted, so reading `process.env.GEMINI_API_KEY` in a module imported before `main.js` loads dotenv returns `undefined`. The solution's `aiProvider.js` avoids this by calling `dotenv.config()` at the top of the file.
- **Use `.js` extensions in local imports.** This is required for ES modules.
- **Never commit real API keys.** The starter's `.env` is present locally but is not safe to track.
