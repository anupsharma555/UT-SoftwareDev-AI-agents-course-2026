# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

DevAnswers is a Stack Overflow–style developer Q&A app. The repo holds two **independent** npm packages with no root `package.json` or workspace tooling — install dependencies and run commands inside each package directory separately:

- `devanswers-backend/` — Express 5 REST API (ESM), MongoDB via Mongoose
- `devanswers-frontend/` — React 19 SPA, Vite, Redux Toolkit, React Router 7, Bootstrap

The frontend talks to the backend at `http://localhost:3000/api` (hardcoded in `src/api/axiosInstance.js`).

## Commands

### Backend (`cd devanswers-backend`)
- `npm run dev` — start with nodemon (hot reload) on `PORT` (default 3000)
- `npm start` — start once via `node main.js`
- `npm test` — run the full Vitest suite (`vitest run`); tests spin up an in-memory MongoDB (`mongodb-memory-server`), so no live DB is needed
- `npm run populate` — seed the database from `src/scripts/seed-data.js`. **This wipes all existing collections first** — never run against a database with real data
- Run a single test file: `npx vitest run tests/integration/questions.test.js`
- Watch mode: `npx vitest`

### Frontend (`cd devanswers-frontend`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the built bundle
- `npm run lint` — ESLint (flat config; the backend has **no** lint setup)
- `npm test` — Vitest in jsdom with MSW-mocked HTTP (`tests/mocks/server.js`)
- Run a single test file: `npx vitest run tests/unit/components/Navbar.test.jsx`

## Backend architecture

Strict layered flow — keep each layer's responsibility intact when adding features:

```
routes → controllers → services → models (Mongoose)
```

- **Entry point**: `main.js` orchestrates startup/shutdown by calling `connectToDB`/`disconnectFromDB` (`db.js`) and `startServer`/`stopServer` (`server.js`). The Express app itself is built in `src/app.js`. Routes are aggregated in `src/routes/index.js` and mounted under `/api`.
- **Controllers are thin**: read `req`, call a service, and respond. Every response uses the envelope `{ success, message, data }`. The frontend always reads the payload from `res.data.data`.
- **Services hold all business logic** and DB access. They signal failures by throwing `createAppError(message, statusCode)` (`src/utils/createAppError.js`), which attaches `statusCode` to a plain `Error`.
- **Error handling**: controllers do **not** wrap logic in try/catch. They rely on Express 5's built-in async error forwarding — a thrown/rejected error propagates to `errorHandler` (`src/middleware/errorHandler.js`), which reads `err.statusCode` and emits the failure envelope (stack included only when `NODE_ENV=development`). Follow this pattern: throw from services, never catch-and-respond in controllers.
- **Auth**: `authHandler.js` middleware verifies the `Authorization: Bearer <jwt>` header against `JWT_SECRET`, loads the user, and sets `req.user = { id, isAdmin }`. Apply it per-route (see `src/routes/questions.js` — GETs are public, mutations are protected). Authorization checks (owner-or-admin) live in the services, comparing `question.author` against `loggedInUser.id`/`isAdmin`.
- **Voting**: questions and answers share one generic `handleVote(Model, id, userId, voteType)` (`src/services/voteService.js`). `upvotes`/`downvotes` are arrays of user ObjectIds; `voteCount` is derived as `upvotes.length - downvotes.length`. Voting is a toggle/switch (re-voting the same way is a no-op; opposite vote moves the user between arrays).
- **AI features** (Google Gemini, `@google/genai`, model `gemini-2.5-flash`): accessed through the lazy singleton `getAI()` in `src/utils/geminiClient.js`. Gemini is prompted to return raw JSON, which `extractJSON()` salvages with a `{...}` regex match. Two endpoints use it: `POST /api/questions/improve` and `POST /api/answers/summarize`.
- **Security middleware** in `app.js`: `helmet`, `cors` (open), and `express-rate-limit` (100 requests / 15 min per IP).

## Frontend architecture

- **State**: Redux Toolkit store (`src/store.js`) with three slices — `user`, `question`, `theme`. Side-effectful API calls go through `createAsyncThunk`; thunks call the service layer, never axios directly.
- **API layer**: all endpoint paths are centralized in `src/config/config.js` (e.g. `QUESTION_API`, `AUTH_API`, `AI_API`). Domain services in `src/services/` use the shared `axiosInstance` and return `res.data.data`. Add new endpoints to `config.js` rather than hardcoding URLs.
- **Auth token**: stored in `localStorage` under `userInfo` (`{ token, userId, name }`), hydrated as Redux initial state in `userSlice.js`. There is **no axios interceptor** — the JWT is passed explicitly as a `Bearer` header on each protected request (see `questionService.js`). `localStorage` writes happen in thunks, not reducers.
- **Routing**: defined in `App.jsx`. Most pages render inside nested layouts (`BaseLayout` → `SideBarLayout` via an `<Outlet />`); `/login` and `/register` render outside the sidebar layout.
- **Tests**: Vitest + Testing Library + `jest-dom`, with MSW intercepting HTTP. Global handlers and fixtures live in `tests/mocks/`; `tests/setup.js` starts/stops the MSW server.

## Environment

Backend requires a `.env` (see `devanswers-backend/.env.example`): `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRATION` (e.g. `7d`), `GEMINI_API_KEY`. The frontend has no env file — the API base URL is hardcoded in `axiosInstance.js`.
