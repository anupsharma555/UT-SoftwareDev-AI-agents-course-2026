# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DevAnswers is a Stack Overflow-style Q&A app. The Week 11 graded project adds two features to the starter app: **bookmarks** (save questions, list them on the profile page) and **edit own posts** (questions and answers, with an "edited" indicator). Requirements are in `../WK11_GradedProject_Problem_Statement.pdf`. Both features are implemented. Their specs and plans are in `specs/` (`001-bookmarks`, `002-edit-posts`); read them before changing either feature. New specs go there too, via `/spec` and `/plan-feature`. This folder is the project root: it holds `devanswers-backend/`, `devanswers-frontend/`, `specs/` and the `.claude/` toolkit, so start Claude Code here.

The backend and frontend are two independent npm packages with no root `package.json`. Run every `npm` command from inside `devanswers-backend/` or `devanswers-frontend/`.

## Commands

Backend (`devanswers-backend/`):

```bash
npm run dev                  # nodemon main.js; the port comes from .env (this setup uses 3001)
npm test                     # vitest run (in-memory MongoDB, no live DB needed)
npx vitest run tests/integration/questions.test.js     # single file
npx vitest run tests/unit/services/voteService.test.js -t "upvote"   # single test by name
npm run populate             # seed sample data; WIPES existing collections
```

Frontend (`devanswers-frontend/`):

```bash
npm run dev                  # Vite, http://localhost:5173
npm test                     # vitest run (jsdom, MSW-mocked HTTP)
npx vitest run tests/unit/components/VoteButtons.test.jsx
npm run lint                 # eslint (the backend has no lint setup)
npm run build
```

Backend tests run with `fileParallelism: false` and long timeouts because each file boots `mongodb-memory-server`. The first run can be slow. Integration tests use `supertest` against `src/app.js`. Frontend tests mock HTTP with MSW (`tests/mocks/handlers.js`), so a new endpoint needs a handler there.

## Architecture

**Backend** (Express 5, Mongoose, ESM). Request flow is `routes -> controllers -> services -> models`.
- Routes are in `src/routes/` and mounted under `/api` by `src/routes/index.js`. Protected routes use the `authenticate` middleware (`src/middleware/authHandler.js`). It verifies the JWT and sets `req.user = { id, isAdmin }`.
- Controllers are thin. They read `req`, call a service, and return the envelope `{ success, message, data }`. There is no try/catch, because Express 5 forwards async errors to `src/middleware/errorHandler.js`.
- Services hold the business logic and throw `createAppError(message, statusCode)` from `src/utils/createAppError.js`. Do not return error objects.
- Authorization is checked in the service, not the middleware: compare `doc.author.toString()` with `loggedInUser.id.toString()` and throw a 403 otherwise. Edits are author-only (admins included); deletes still allow admins.
- Malformed ids are rejected with 400 via `mongoose.isValidObjectId` in the newer services (bookmarks, edits).
- List sorts use `{ createdAt: -1, _id: -1 }`; `_id` breaks ties between documents created in the same millisecond.
- Startup is split across `main.js` (dotenv, DB connect), `server.js` (listen, with a `PORT || 3000` fallback) and `src/app.js` (helmet, rate limit of 100 requests per 15 minutes, CORS, routes, error handler). Tests import `src/app.js` directly.
- Votes on questions and answers share `src/services/voteService.js` (`handleVote(Model, ...)`).

**Frontend** (React 19, Redux Toolkit, React Router 7, Vite). Data flows `config -> service -> slice -> component`.
- `src/config/config.js` holds every endpoint path as constants (`QUESTION_API`, `ANSWER_API`, and so on). Paths are relative.
- `src/api/axiosInstance.js` sets the base URL, which is hardcoded to `http://localhost:3001/api`. The same URL is hardcoded in `tests/mocks/handlers.js`, so change both together.
- `src/services/*` are thin axios wrappers. They return `res.data.data` and take the JWT as an explicit `token` argument, which they send as `Authorization: Bearer <token>`. The axios instance does not attach it.
- `src/reducers/*` are slices (`user`, `question`, `theme`, `bookmark`) registered in `src/store.js`. Thunks read the token from `getState().user.userInfo`, call a service, and use `rejectWithValue(error.response?.data?.message || ...)`.
- Auth state: `userInfo = { token, userId, name }` is persisted in `localStorage` under `userInfo`. Changing the backend `JWT_SECRET` leaves old tokens in `localStorage` that fail with "Token is not valid". Log in again to fix it.
- `QuestionDetail` loads one question with its answers embedded (`GET /questions/:id` returns `question.answers`). Question and answer state live in `questionSlice` as `questions` and `currentQuestion`.

## Implemented features

**Bookmarks** (spec `specs/001-bookmarks.md`)
- Backend: `Bookmark` model `{ user, question }` with a unique `(user, question)` index; `bookmarkService` / `bookmarkController`; routes in `src/routes/bookmarks.js`, all behind `authenticate`: `GET /api/bookmarks`, `GET /api/bookmarks/ids`, `POST /api/bookmarks` `{ questionId }` (201 new, 200 already saved), `DELETE /api/bookmarks/:questionId` (idempotent). Empty lists return `[]`, not 404. `deleteQuestionService` also deletes the question's bookmarks.
- Frontend: `BOOKMARK_API`, `services/bookmarkService.js`, `bookmarkSlice` (`ids`, `questions`, `pending`): `toggleBookmark` is optimistic with rollback, ignores a second toggle for the same question while one is in flight, and fetches keep in-flight toggles and discard results that finish after the user changed. The slice resets on `logout`. `QuestionList` takes `preserveOrder` so the profile keeps the server's newest-saved-first order. `App.jsx` loads saved ids whenever a token is present. `components/Shared/BookmarkButton.jsx` is used in `QuestionCard` and `QuestionContent`. `Profile.jsx` shows a Saved Questions section, filtered by `ids` so unsaving removes the item immediately.
- Select bookmark state with safe defaults (`state.bookmark?.ids ?? []`): many existing test stores do not include the slice.

**Edit own posts** (spec `specs/002-edit-posts.md`)
- Backend: `PUT /api/questions/:id` (`{ title, description, tags }`, `tags` a comma-separated string) and `PUT /api/answers/:answerId` (`{ answerText }`). Author-only, trimmed non-blank fields, at least one tag (empty segments and duplicates dropped), tags created only after validation and authorization pass. `editedAt` (Date, default `null`) on `Question` and `Answer` is set only when content actually changes. Do not use `updatedAt` as the edited signal: votes and views change it. The question update returns `author` and `tags` populated.
- Frontend: `updateQuestion` / `updateAnswer` thunks in `questionSlice` merge into `currentQuestion` (answers, votes and author are kept) and must not touch `loading`, because `QuestionDetail` shows a full-page spinner while it is true. Pencil controls and inline forms live in `QuestionContent` and `AnswerList`, shown only when `author._id === userInfo.userId`; never on list views. `components/Shared/EditedBadge.jsx` renders "(edited)" with a date tooltip.

## Gotchas

- Frontend `Profile.jsx` calls `USER_API.STATS` (`/auth/stats/:userId`) with bare `axios`. The path has no base URL, and no backend route serves it, so the stats request fails. This predates the graded features.
- Backend `tests/setup.js` clears the `Question`, `Answer` and `Bookmark` collections. Add any new collection there and to the wipe in `src/scripts/populate-db.js`.
- Model mocks used with `new` in unit tests must be `function`s, not arrow functions (`Tag.mockImplementation(function () { return ... })`); this vitest version rejects arrow-function constructors.
- Test helpers that name things with `Date.now()` alone can collide within a millisecond; add a random suffix.
- The backend reads its config from `devanswers-backend/.env`, which is gitignored. The backend integration tests also import `dotenv`, so keep that file in place. Never print or commit its values. The Gemini key is only needed for the AI features, not for bookmarks or editing.

## Constraints

- The existing backend and frontend test suites must keep passing, and the vote, auth and AI flows must keep working.
- Match the existing layering on both sides. Do not add logic to controllers or call axios directly from components.
- Out of scope: deleting posts, bookmarking answers, and folders, tags, notes, sharing or exporting of saved questions.
