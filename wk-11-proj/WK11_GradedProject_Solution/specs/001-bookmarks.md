# 001 — Bookmarks (Saved Questions)

**Status:** Draft
**Feature:** Let a logged-in user save/unsave a question and view their saved questions on their profile.

## Problem / motivation

Users browsing DevAnswers frequently find questions they want to return to later — to follow the discussion, reference an answer, or answer it themselves. Today there is no way to keep a personal list of questions; the only way back to a question is search or browser history. Bookmarks give each authenticated user a private, persistent list of saved questions, reachable from their profile.

## Design decisions (resolved)

These were confirmed before writing the spec and drive the rest of the document:

1. **Storage:** a dedicated `Bookmark` collection (`{ user, question, createdAt }`) rather than an array on `User` or `Question`. Gives reliable saved-at ordering and keeps bookmarks as their own vertical slice (model → service → controller → route), mirroring how `tags` is structured.
2. **Save control placement:** a bookmark toggle on the question detail view **and** on every `QuestionCard` in lists (Home, Tags, profile). This requires the frontend to know which questions the current user has saved, hydrated into a Redux slice on login.
3. **Profile surface:** a "Saved Questions" section added to the existing `Profile` page (not a separate route), rendered with `QuestionCard`.

## User stories

- As a logged-in user, I can save a question from its detail page so I can find it later.
- As a logged-in user, I can save or unsave a question directly from any question card in a list without opening it.
- As a logged-in user, I can see at a glance which questions in a list I've already saved (filled vs. outline bookmark icon).
- As a logged-in user, I can open my profile and see all the questions I've saved, most recently saved first.
- As a logged-in user, I can unsave a question from my profile's saved list and have it disappear from the list.
- As a logged-out visitor, I do not see bookmark controls and cannot save questions.

## Acceptance criteria

Each criterion is independently testable.

1. `POST /api/bookmarks` with a valid `questionId` and a valid auth token creates a bookmark and responds `201` with the bookmark document.
2. `POST /api/bookmarks` for a question the user has **already** saved does not create a duplicate and responds `200` with `message: "Question already saved"` and the existing bookmark.
3. `POST /api/bookmarks` without an auth token responds `401`.
4. `POST /api/bookmarks` with a `questionId` that does not reference an existing question responds `404` with `message: "Question not found"`.
5. `POST /api/bookmarks` with a missing or malformed `questionId` responds `400`.
6. `DELETE /api/bookmarks/:questionId` removes the current user's bookmark for that question and responds `200`.
7. `DELETE /api/bookmarks/:questionId` for a question the user has not saved still responds `200` (idempotent — deleting a non-existent bookmark is not an error).
8. `GET /api/bookmarks` returns only the current user's saved questions, sorted by save time descending (most recently saved first), each populated with `author` (name only), `tags`, and an `answerCount`.
9. `GET /api/bookmarks` returns `200` with an empty array when the user has saved nothing (empty is a normal state, **not** a `404`).
10. `GET /api/bookmarks/ids` returns `200` with a flat array of the current user's saved question id strings.
11. A user can bookmark their own question (no self-restriction).
12. When a question is deleted, all bookmarks referencing it are removed, and it no longer appears in any user's saved list.
13. In the UI, a `QuestionCard` and the question detail view show a **filled** bookmark icon when the question is in the user's saved set and an **outline** icon otherwise; clicking it toggles the state and the icon updates without a page reload.
14. Bookmark controls are not rendered for logged-out visitors.
15. The Profile page shows a "Saved Questions" section listing the user's saved questions; unsaving from that list removes the card from the section.

## API contract

All endpoints are mounted under `/api/bookmarks` (new router added to `src/routes/index.js`). All require authentication via the existing `authenticate` middleware (`Authorization: Bearer <jwt>`), which sets `req.user = { id, isAdmin }`. All responses use the project envelope `{ success, message, data }`. Errors are produced by throwing `createAppError(message, statusCode)` from the service layer and surfaced by the existing `errorHandler`.

### `POST /api/bookmarks` — save a question
- **Auth:** required.
- **Request body:** `{ "questionId": "<ObjectId string>" }`
- **201 Created** (newly saved):
  ```json
  {
    "success": true,
    "message": "Question saved",
    "data": { "_id": "...", "user": "...", "question": "...", "createdAt": "...", "updatedAt": "..." }
  }
  ```
- **200 OK** (already saved): same `data` shape, `message: "Question already saved"`.
- **400** — `questionId` missing or not a valid ObjectId: `message: "A valid questionId is required"`.
- **404** — question does not exist: `message: "Question not found"`.
- **401** — missing/invalid/expired token (from `authenticate`).

### `DELETE /api/bookmarks/:questionId` — unsave a question
- **Auth:** required.
- **200 OK:**
  ```json
  { "success": true, "message": "Question unsaved", "data": { "questionId": "..." } }
  ```
  Idempotent: returns `200` whether or not a bookmark existed.
- **400** — `:questionId` not a valid ObjectId.
- **401** — missing/invalid token.

### `GET /api/bookmarks` — list current user's saved questions
- **Auth:** required.
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Saved questions fetched successfully",
    "data": [
      {
        "_id": "...", "title": "...", "description": "...",
        "tags": [ { "_id": "...", "name": "..." } ],
        "author": { "_id": "...", "name": "..." },
        "voteCount": 0, "views": 0, "answerCount": 2,
        "createdAt": "...", "updatedAt": "...",
        "savedAt": "..."
      }
    ]
  }
  ```
  - Sorted by the bookmark's `createdAt` descending.
  - `savedAt` mirrors the bookmark `createdAt` so the UI can show when it was saved (optional for the UI to use).
  - Dangling bookmarks (question since deleted) are filtered out defensively even though deletion cascades (see Data model).
- Empty list → `200` with `data: []`.

### `GET /api/bookmarks/ids` — saved-state hydration
- **Auth:** required.
- **200 OK:** `{ "success": true, "message": "Saved question ids fetched successfully", "data": ["<questionId>", ...] }`
- Purpose: lets the frontend mark which cards are saved without authenticating the public question-list endpoints. Lightweight (ids only).

> Note on status-code strictness: criteria 5 and 4 specify `400`/`404` for malformed/non-existent ids. This is intentionally stricter than some existing read endpoints (e.g. `getQuestionByIdService` lets a bad id fall through to a `500`). Bookmark services validate ids explicitly with `mongoose.Types.ObjectId.isValid` and throw `createAppError(..., 400)` before any DB call.

## Data model changes

### New model: `src/models/Bookmark.js`

```js
const bookmarkSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
}, { timestamps: true });

// One bookmark per (user, question); also the guard against duplicate saves and races.
bookmarkSchema.index({ user: 1, question: 1 }, { unique: true });
// Supports the "list my saved questions, newest first" query.
bookmarkSchema.index({ user: 1, createdAt: -1 });
```

- `timestamps: true` provides `createdAt`, which is the save time used for ordering and the `savedAt` field in the list response.
- The unique compound index is the canonical dedupe mechanism. The save service still checks for an existing bookmark first (to return `200` vs `201` deterministically), but the index protects against the two-tabs / double-click race; an `E11000` duplicate-key error from a racing insert is treated as "already saved" (`200`), not a `500`.

### Change to `src/services/questionService.js` — `deleteQuestionService`

Extend the existing cascade (which already runs `Answer.deleteMany({ questionId: id })`) to also remove bookmarks:

```js
await Bookmark.deleteMany({ question: id });
```

This keeps the constraint in criterion 12 and prevents dangling bookmarks. No change to `User` or `Question` schemas.

### Models registered

`Bookmark` must be imported in `src/app.js` alongside the other models so the model is registered before routes handle requests (matches the existing pattern of importing all models in `app.js`).

## UI changes

### New Redux slice: `src/reducers/bookmarkSlice.js`

State:
```js
{
  savedIds: [],          // string[] of saved questionIds — drives card/detail icon state
  savedQuestions: [],    // full question objects for the profile section
  loadingIds: false,
  loadingList: false,
  error: null,
}
```

Async thunks (call the service layer, never axios directly; read the token from `getState().user.userInfo.token`, matching `questionSlice`):
- `fetchSavedIds()` → `GET /bookmarks/ids`; populates `savedIds`.
- `fetchSavedQuestions()` → `GET /bookmarks`; populates `savedQuestions`.
- `toggleBookmark({ questionId })` → if `questionId` is in `savedIds`, call unsave; else call save. Update `savedIds` and, when present, `savedQuestions` (remove the card on unsave) in the fulfilled reducer. On reject, restore prior state and set `error`.

Sync reducer:
- `clearBookmarks()` → resets slice to initial state.

Register `bookmark` reducer in `src/store.js`.

### Hydration / teardown wiring
- When `userInfo` becomes truthy (login or app load with a stored token), dispatch `fetchSavedIds()`. Implemented as an effect in a top-level component that already has access to `userInfo` (`BaseLayout` or `App`), keyed on `userInfo`.
- `logoutUser` (in `userSlice`) additionally dispatches `clearBookmarks()` so saved-state does not leak across accounts.

### New service: `src/services/bookmarkService.js`
Thin wrappers over `axiosInstance`, returning `res.data.data`, passing `Authorization: Bearer ${token}` explicitly (consistent with `questionService`):
- `getSavedIds(token)`
- `getSavedQuestions(token)`
- `saveQuestion(questionId, token)`
- `unsaveQuestion(questionId, token)`

### New endpoint config: `src/config/config.js`
Add:
```js
export const BOOKMARK_API = {
  LIST: "/bookmarks",
  IDS: "/bookmarks/ids",
  SAVE: "/bookmarks",
  UNSAVE: (questionId) => `/bookmarks/${questionId}`,
};
```

### New shared component: `src/components/Shared/BookmarkButton.jsx`
- Props: `{ questionId }`.
- Reads `state.bookmark.savedIds` and `state.user.userInfo`.
- Renders nothing when not authenticated (criterion 14).
- Shows `FaBookmark` (filled) when saved, `FaRegBookmark` (outline) otherwise (`react-icons/fa`, already a dependency).
- On click: `dispatch(toggleBookmark({ questionId }))`; on rejected toggle, show the existing `alert(...)` pattern used by `QuestionCard`'s vote handler.

### Components modified
- `src/components/Question/QuestionCard.jsx` — render `<BookmarkButton questionId={question._id} />` in the card (e.g. in the stats column near the vote/answer counts).
- `src/components/Question/QuestionContent.jsx` — render `<BookmarkButton questionId={question._id} />` on the detail view (this is the component `QuestionDetail` renders).
- `src/pages/Profile/Profile.jsx` — add a "Saved Questions" section (shown when not editing, alongside the existing stats). On mount (when authenticated) dispatch `fetchSavedQuestions()`; map `savedQuestions` to `<QuestionCard />`. Show a friendly empty state ("You haven't saved any questions yet.") when the list is empty and a `Spinner` while `loadingList`.

### Routes
No new React Router routes. Bookmarks are surfaced inline (cards + detail + profile section). Navbar unchanged.

## Edge cases & error handling

- **Double-save / two tabs:** unique index + pre-check; a racing duplicate insert (`E11000`) is caught and treated as `200 "Question already saved"`.
- **Unsave something not saved:** idempotent `200`.
- **Save/unsave with malformed ObjectId:** `400` before any DB call.
- **Save a non-existent question:** `404 "Question not found"` (service verifies the question exists before inserting).
- **Bookmarking own question:** allowed.
- **Question deleted after being saved:** bookmarks cascade-delete on question deletion; `GET /api/bookmarks` also filters out any null-populated entries defensively.
- **No saved questions:** `GET /api/bookmarks` and `/ids` return `200` with `[]` (not `404`) — a deliberate deviation from `getAllQuestionsService`, which throws `404` on empty, because an empty personal list is normal.
- **Expired/invalid/missing token:** `401` from `authenticate`.
- **Logged-out user in the UI:** bookmark controls are not rendered; there is no client path to call the save endpoints unauthenticated.
- **Stale saved-state on account switch:** cleared via `clearBookmarks()` on logout.
- **Rate limiting:** the existing global limiter (100 req / 15 min per IP) applies to these routes unchanged.

## Out of scope

- Bookmarking answers (only questions are bookmarkable).
- Folders, collections, labels, or notes on bookmarks.
- Public or shareable saved lists; showing a public "saved N times" count on questions.
- Pagination / infinite scroll of the saved list (acceptable for expected volumes now; revisit if lists grow large).
- Notifications or activity feeds derived from bookmarks.
- Reordering saved questions manually.
- Fixing the pre-existing `USER_API.STATS` gap (stats endpoint referenced by the Profile page but absent from routes) — unrelated to this feature.

## Test plan

### Backend (Vitest + Supertest + mongodb-memory-server; `tests/setup.js` provides the in-memory DB)

Auth tokens are obtained the same way as existing integration tests — create a user and sign a JWT with `process.env.JWT_SECRET` (dotenv is loaded in tests), or go through the register/login flow.

**Unit — `tests/unit/services/bookmarkService.test.js`**
- `save` creates a bookmark and returns it (201-path / `created: true`).
- `save` on an existing (user, question) returns the existing bookmark without creating a duplicate (`created: false`); collection count stays at 1.
- `save` throws `404` when the question does not exist.
- `save` throws `400` for a malformed `questionId`.
- `unsave` removes the bookmark; `unsave` again is a no-op that does not throw.
- `list` returns the user's bookmarks sorted by `createdAt` desc, each populated with `author.name`, `tags`, and `answerCount`; excludes other users' bookmarks.
- `list` returns `[]` when none exist.
- `list` omits bookmarks whose question was deleted.
- `ids` returns the array of saved question id strings for the user only.

**Integration — `tests/integration/bookmarks.test.js`** (full `/api/bookmarks` via Supertest)
- `401` for each endpoint without a token.
- `POST` valid → `201`; immediate re-`POST` → `200` "already saved"; DB has exactly one bookmark.
- `POST` non-existent question → `404`; malformed id → `400`.
- `GET /api/bookmarks` returns saved questions newest-first with populated `author`/`tags`/`answerCount`; `200 []` when none.
- `GET /api/bookmarks/ids` returns the id array.
- `DELETE /api/bookmarks/:questionId` → `200`; repeat → `200` (idempotent); subsequent `GET` no longer lists it.
- User A's bookmarks are not visible to User B.
- Deleting a question (`DELETE /api/questions/:id`) removes its bookmarks: a follow-up `GET /api/bookmarks` for a user who had saved it returns a list without that question.

### Frontend (Vitest + jsdom + Testing Library + MSW; add handlers to `tests/mocks/handlers.js`)

**Unit — `tests/unit/reducers/bookmarkSlice.test.jsx`**
- Initial state shape.
- `fetchSavedIds` / `fetchSavedQuestions` fulfilled populate `savedIds` / `savedQuestions`.
- `toggleBookmark` adds an id when not saved and removes it (and its card from `savedQuestions`) when already saved.
- `clearBookmarks` resets state.

**Component**
- `tests/unit/components/BookmarkButton.test.jsx` — renders outline when id not in `savedIds`, filled when it is; click dispatches `toggleBookmark`; renders nothing when `userInfo` is null.
- `QuestionCard.test.jsx` — extend to assert the bookmark control renders for an authenticated user.
- `tests/unit/pages/profile.test.jsx` — extend: with a mocked `GET /bookmarks` returning two questions, the "Saved Questions" section renders two `QuestionCard`s; with an empty response, the empty-state message renders.

**Integration — `tests/integration/bookmarkFlow.test.jsx`** (MSW-backed)
- Authenticated user saves a question from a card → icon flips to filled and the id is in `savedIds`.
- Navigating to the profile shows the saved question; unsaving it from the profile removes the card.
