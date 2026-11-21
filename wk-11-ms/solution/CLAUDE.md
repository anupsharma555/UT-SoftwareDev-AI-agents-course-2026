# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ThreadHive is a Reddit-style forum: users post **threads** inside **subreddits**, write **comments**, and **vote** on both. It also has GenAI features (AI thread summaries and text rephrasing). The repo holds two independent npm projects with **no root `package.json`** — run all commands from inside the relevant project directory:

- `threadhive-backend/` — Express 5 + MongoDB/Mongoose REST API
- `threadhive-frontend/` — React 19 + Vite SPA with Redux Toolkit

## Commands

Backend (`cd threadhive-backend`):
- `npm run dev` — start with nodemon (reload on change)
- `npm start` — start once (`node main.js`)
- `npm test` — run the Vitest suite once
- `npm run populate` — wipe and reseed the DB from `src/scripts/seed-data.js`
- `npm run format` — Prettier write
- Single test: `npx vitest run tests/integration/thread.test.js` or filter by name with `npx vitest run -t "creates a thread"`

Frontend (`cd threadhive-frontend`):
- `npm run dev` — Vite dev server
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint
- `npm test` — Vitest (watch); `npm run test:ui`, `npm run test:coverage`
- Single test: `npx vitest run tests/unit/components/ThreadCard.test.jsx`

## Environment & local setup gotcha

Backend needs a `.env` (copy `.env.example`): `MONGODB_URI`, `PORT`, `JWT_SECRET`, and the AI keys (`GEMINI_API_KEY`/`GEMINI_MODEL` or `OPENAI_API_KEY`/`OPENAI_MODEL`).

**The frontend hardcodes the backend at `http://localhost:5000/api`** (`src/api/axiosInstance.js`), but `server.js` defaults to port **3000** when `PORT` is unset. You must set `PORT=5000` in the backend `.env` (as `.env.example` does) or the frontend cannot reach the API.

## Backend architecture

Strict layering, one module per resource (auth, thread, subreddit, comment, vote):

```
routes/ → controllers/ → services/ → models/
```

- **routes/** declare endpoints and attach `authHandler` middleware per route.
- **controllers/** read `req`, validate required fields, call a service, and send the response. They contain no DB logic.
- **services/** hold all business logic and Mongoose queries.
- **models/** are Mongoose schemas.

Entry chain: `main.js` → `connectToDB()` (`db.js`) + `startServer()` (`server.js`) → `src/app.js` (the Express app; mounts security middleware, rate limiter, routes, then `errorHandler`).

Conventions that the whole backend depends on — match them in new code:

- **No try/catch in controllers, no async wrapper.** This relies on **Express 5**, which auto-forwards rejected promises to the error middleware. Controllers and services just `throw`.
- **Errors** are created with `createAppError(message, statusCode)` (`src/utils/createAppError.js`) and rendered by `src/middleware/errorHandler.js` into `{ success: false, message, ...stack-in-dev }`.
- **Every success response uses the shape** `{ success, message, data }`. The frontend unwraps `res.data.data`.
- **Auth** is JWT Bearer. `authHandler` verifies the token, loads the user, and sets `req.user = { userId }`. Protected controllers read the author/voter from `req.user.userId`, never from the body.
- **Route mounting quirk:** vote routes are mounted at `/api` (so full paths are `/api/threads/:id/upvote`, `/api/comments/:id/downvote`), while the others mount under `/api/threads`, `/api/subreddits`, `/api/auth`, `/api/comments`. Comments are fetched at `/api/comments/thread/:threadId`.
- **Voting** is centralized in `voteService.js`'s `voteHandler(Model, id, userId, type)`, shared by Thread and Comment. It maintains `upvotedBy`/`downvotedBy` arrays plus derived `upvotes`/`downvotes`/`voteCount`.

### Swapping the AI provider

`src/utils/aiProvider.js` exposes a single `generateAIContent(prompt)` used by the GenAI services. It supports OpenAI and Gemini via a **comment/uncomment** toggle (Gemini is active by default). To switch: comment out one provider block, uncomment the other, ensure the matching key is in `.env`, restart. Don't scatter provider-specific calls elsewhere — keep them behind this function.

## Frontend architecture

Redux Toolkit + react-router v7 + React Bootstrap.

- **Store** (`src/store/store.js`) combines slices: `auth`, `threads` (the list), `selectedThread` (current thread view), `comments`, `theme` (dark mode), `subreddits`.
- **Data flow:** component dispatches a `createAsyncThunk` (in `src/reducers/*Slice.js`) → thunk calls a function in `src/services/*Service.js` → service calls `axiosInstance` using the endpoint constants in `src/config/apiConfig.js`. Thunks wrap failures with `handleApiError` and store the message in slice `error`.
- **Auth/token handling:** the JWT lives in `localStorage`. Services attach it via `getAuthHeaders()` (Bearer). `src/utils/handleApiError.js` clears storage and hard-redirects to `/login` on any **401**. `authSlice` keeps localStorage side effects inside thunks, not reducers.
- **Routing:** `App.jsx` wraps protected pages (`/home`, `/thread/:threadId`, `/profile`) in `PrivateRoute`; the sidebar only renders when a token exists. Unknown routes redirect to `/home`.
- **Theming:** dark mode is a Redux slice; `App.jsx` reflects it by toggling `data-theme="dark"` on `<html>`.

## Testing

- **Backend:** Vitest in a Node env, **run serially** (`fileParallelism: false`) with 60s timeouts because MongoDB startup is slow. Integration tests `import '../setup.js'`, which spins up an in-memory Mongo (`mongodb-memory-server`) and drives the real app with `supertest`. The AI provider is mocked with `vi.mock` so tests make no real API calls — mock it the same way in any test that touches GenAI.
- **Frontend:** Vitest + jsdom + Testing Library. `tests/setup.js` starts an **MSW** mock server; request handlers live in `tests/mocks/handlers.js` and fixtures in `tests/mocks/mockData.js`. Add/override handlers per test rather than hitting a real backend.

## Project tooling

`.claude/commands/` defines custom slash commands (`/open-pr`, `/plan-feature`, `/spec`). `resources/prompts.md` documents the intended feature workflow: spec-driven, one git worktree per feature branch. `.claude/settings.json` denies reading `threadhive-backend/.env`.
