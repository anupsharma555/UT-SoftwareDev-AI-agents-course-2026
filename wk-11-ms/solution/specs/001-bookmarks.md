# Spec 001 — Bookmarks (Saved Threads)

**Status:** Draft
**Epic:** Content Discovery & Engagement (`docs/epic-discover-engage.md`, feature #1)

## Problem / motivation

ThreadHive users currently have no way to keep a thread for later — once a thread scrolls past in the feed, the only way back is search-by-memory or luck. This hurts return engagement: users who find something interesting but can't act on it now have no reliable path back to it.

**Bookmarks** let a logged-in user save any thread with one click and find all their saved threads later under a "Saved" tab on their profile. It is a per-user, private affordance (no public "saved by N" count) and is independent of voting.

## User stories

1. As a logged-in user, I can **save** a thread from the feed or a thread page so I can return to it later.
2. As a logged-in user, I can **unsave** a thread I previously saved.
3. As a logged-in user, I can **see all my saved threads** in one place (the Profile "Saved" tab), newest-saved first, and click through to any of them.
4. As a logged-in user, I can **tell at a glance** whether a thread in the feed is already saved (the bookmark control reflects saved state).
5. As a user, my saved threads are **private to me** — no other user can see or affect them.

## Acceptance criteria

Each criterion is independently testable.

1. **Save:** `POST /api/threads/:id/bookmark` by an authenticated user creates a bookmark and returns `201`; the thread then appears in that user's `GET /api/bookmarks`.
2. **Idempotent save:** Saving an already-saved thread does **not** create a duplicate and returns `200` (not `500`); the saved list length is unchanged.
3. **Unsave:** `DELETE /api/threads/:id/bookmark` removes the bookmark and returns `200`; the thread no longer appears in `GET /api/bookmarks`.
4. **Idempotent unsave:** Unsaving a thread that is not bookmarked returns `200` (no error).
5. **Auth required:** All three endpoints return `401` when called without a valid Bearer token.
6. **Scoping:** `GET /api/bookmarks` returns only the requesting user's bookmarks; a second user who saved nothing gets `[]` even if other users have bookmarks.
7. **Missing thread:** Saving a thread id that does not exist (valid ObjectId format) returns `404` with message `"Thread not found"`.
8. **Invalid id:** A malformed thread id returns `400` with message `"Invalid thread id"` (not `500`).
9. **List shape & order:** `GET /api/bookmarks` returns the saved threads populated with `author` and `subreddit`, ordered by **bookmark creation time, newest first**.
10. **Deleted-thread safety:** If a bookmarked thread is later deleted, it is omitted from `GET /api/bookmarks` and the endpoint does not error.
11. **Feed indicator:** In the feed, the bookmark control on a saved thread renders in the "saved" (filled) state; toggling it updates the UI immediately.
12. **Profile tab:** The Profile page shows a "Saved" tab listing saved threads as compact rows, each linking to `/thread/:id`; an empty list shows an empty-state message.

## API contract

All endpoints require `authHandler` (JWT Bearer). All responses use the project envelope `{ success, message, data }`. Save/unsave routes follow the **vote-route mounting convention**: a dedicated `bookmarkRoutes` router declares the thread-scoped paths plus the collection path and is mounted at `/api` (alongside `voteRoutes`).

### `POST /api/threads/:id/bookmark` — save a thread

- **Auth:** required.
- **Body:** none (actor is `req.user.userId`).
- **201 Created** (new bookmark):
  ```json
  {
    "success": true,
    "message": "Thread bookmarked successfully",
    "data": { "_id": "...", "user": "...", "thread": "...", "createdAt": "...", "updatedAt": "..." }
  }
  ```
- **200 OK** (already bookmarked, idempotent): same `data` shape, `message: "Thread already bookmarked"`.
- **400** invalid id: `{ "success": false, "message": "Invalid thread id" }`
- **404** thread not found: `{ "success": false, "message": "Thread not found" }`
- **401** missing/invalid token.

### `DELETE /api/threads/:id/bookmark` — unsave a thread

- **Auth:** required.
- **Body:** none.
- **200 OK** (removed or already absent — idempotent):
  ```json
  { "success": true, "message": "Bookmark removed successfully", "data": { "threadId": "..." } }
  ```
- **400** invalid id, **401** missing/invalid token.

### `GET /api/bookmarks` — current user's saved threads

- **Auth:** required.
- **200 OK:** `data` is an array of **threads** (populated with `author` → `name` and `subreddit` → `name, description`), ordered by bookmark `createdAt` descending:
  ```json
  {
    "success": true,
    "message": "Bookmarks fetched successfully",
    "data": [
      {
        "_id": "...", "title": "...", "content": "...",
        "author": { "_id": "...", "name": "..." },
        "subreddit": { "_id": "...", "name": "...", "description": "..." },
        "voteCount": 0, "createdAt": "...", "updatedAt": "..."
      }
    ]
  }
  ```
- **200 OK** with `data: []` when the user has no bookmarks (empty list is **not** an error).
- **401** missing/invalid token.

## Data model changes

**New collection only — `Thread.js`, `User.js`, and the voting fields are untouched.**

New file `src/models/Bookmark.js`:

```js
// Mongoose schema delta (illustrative — implementation in the build step)
const BookmarkSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
  },
  { timestamps: true }
);

// One bookmark per (user, thread); the unique index enforces idempotent saves at the DB level.
BookmarkSchema.index({ user: 1, thread: 1 }, { unique: true });
```

- `timestamps` provides `createdAt`, used to order the saved list ("recently saved first").
- The unique compound index is the source of truth for de-duplication; the service treats a duplicate-key error (`E11000`) as an idempotent no-op (→ `200`).
- Register the model with the app the same way the others are (`import "./models/Bookmark.js"` in `src/app.js`, or transitively via the service import).

## UI changes

### New files (frontend)

- `src/services/bookmarkService.js` — `saveBookmark(threadId)`, `removeBookmark(threadId)`, `fetchBookmarks()`. Uses `axiosInstance`, `getAuthHeaders()` (Bearer), and the new endpoint constants. Returns `res.data.data`.
- `src/reducers/bookmarkSlice.js` — slice `bookmarks` with state `{ saved: [], savedIds: [], loading: false, error: null }` and `createAsyncThunk`s:
  - `fetchBookmarksThunk` → `fetchBookmarks()` → fills `saved` (threads) and derives `savedIds`.
  - `saveBookmarkThunk(threadId)` → on `fulfilled` adds `threadId` to `savedIds`.
  - `removeBookmarkThunk(threadId)` → on `fulfilled` removes `threadId` from `savedIds` and drops it from `saved`.
  - All thunks wrap failures with `handleApiError`.

### Modified files (frontend)

- `src/store/store.js` — register the `bookmarks` reducer.
- `src/config/apiConfig.js` — add:
  ```js
  export const BOOKMARK_API = {
    SAVE:   (id) => `/threads/${id}/bookmark`,
    UNSAVE: (id) => `/threads/${id}/bookmark`,
    LIST:   "/bookmarks",
  };
  ```
- `src/components/ThreadList/ThreadCard.jsx` — add a bookmark toggle button (e.g. `bi-bookmark` ↔ `bi-bookmark-fill`). Reads `savedIds` from the `bookmarks` slice to render saved/unsaved state; dispatches `saveBookmarkThunk` / `removeBookmarkThunk`. (Reused by both the feed and the single-thread view, so no separate change is needed on `ThreadPage`.)
- `src/pages/User/Profile.jsx` — add a **"Saved" tab/section** alongside the existing profile info. On mount (when authenticated) dispatch `fetchBookmarksThunk`; render `state.bookmarks.saved` as **compact rows** (thread title + `r/subreddit` + author), each a link to `/thread/:id`. Show a loading state and an empty-state message when there are none.
- `src/pages/User/Home.jsx` — dispatch `fetchBookmarksThunk` once when the feed loads so feed bookmark indicators reflect saved state. *(Minor additive dispatch; this is the only file this feature shares with epic feature #2 — see overlap notes in the epic doc.)*

### Routes

No new route. The saved view is a tab within the existing `/profile` page (which is already wrapped in `PrivateRoute`).

### New files (backend)

- `src/models/Bookmark.js` (above).
- `src/services/bookmarkService.js` — `createBookmark(userId, threadId)`, `removeBookmark(userId, threadId)`, `getBookmarksByUser(userId)`. All Mongoose logic lives here; throws via `createAppError`.
- `src/controllers/bookmarkController.js` — `addBookmark`, `deleteBookmark`, `getBookmarks`; read actor from `req.user.userId`, send the standard envelope, no try/catch.
- `src/routes/bookmarks.js` — declares `POST /threads/:id/bookmark`, `DELETE /threads/:id/bookmark`, `GET /bookmarks`, each with `authHandler`; mounted in `src/app.js` via `app.use("/api", bookmarkRoutes)`.

## Edge cases & error handling

- **Duplicate save (race or repeat):** the unique index throws `E11000`; the service catches it and returns the existing bookmark with `200` (idempotent). Never surfaces as `500`.
- **Unsave when not saved:** `DELETE` is idempotent — returns `200` whether or not a row existed.
- **Invalid ObjectId:** the service guards with `mongoose.isValidObjectId(id)` and throws `createAppError("Invalid thread id", 400)` before querying, so malformed ids yield `400` rather than an unhandled `CastError → 500`. *(This is a deliberate hardening over the current vote endpoints, which do not guard.)*
- **Missing thread on save:** `createBookmark` verifies the thread exists (`Thread.findById`) and throws `createAppError("Thread not found", 404)` if not.
- **Bookmarked thread later deleted:** `getBookmarksByUser` populates `thread` and filters out bookmarks whose `thread` populated to `null`, so the list never returns dangling entries or errors. *(Optional follow-up, out of scope: cascade-delete bookmarks when a thread is deleted.)*
- **Cross-user access:** every query is scoped by `req.user.userId`; there is no endpoint that accepts a user id from the client.
- **Unauthenticated:** `authHandler` returns `401` ("No token provided…" / "Token is not valid.") before any controller runs.
- **Rate limiting:** the global limiter in `app.js` (100 req / 15 min / IP) already applies; no per-endpoint limit is added.

## Out of scope

- Bookmark **folders, collections, or tags**.
- Bookmarking **comments** (threads only).
- A **public count** of how many users bookmarked a thread.
- **Server-side pagination** of the saved list (the Profile tab may paginate client-side like `Home`, but the API returns the full list for now).
- **Notifications** or activity feeds related to bookmarks.
- **Cascade deletion** of bookmarks when a thread is removed (handled defensively by filtering on read).
- Persisting profile fields (`bio`/`location`/`website`) to the backend — unrelated; Profile remains otherwise localStorage-driven.

## Test plan

Follows the repo's conventions: backend Vitest + supertest against an in-memory Mongo (`import '../setup.js'`); frontend Vitest + Testing Library with MSW.

### Backend — integration (`tests/integration/bookmark.test.js`)

Reuse the vote test's `createUserAndLogin()` helper pattern; `beforeEach` clears `Bookmark`, `Thread`, `Subreddit` and creates a subreddit + thread.

1. `POST /api/threads/:id/bookmark` (auth) → `201`, `success: true`, `data.thread === thread._id`.
2. `GET /api/bookmarks` after save → array of length 1 containing the thread, populated with `author` + `subreddit`.
3. Second `POST` of the same thread → `200`, `message: "Thread already bookmarked"`; `GET` still length 1 (no duplicate).
4. `DELETE /api/threads/:id/bookmark` → `200`; subsequent `GET` → `[]`.
5. Second `DELETE` (already unsaved) → `200` (idempotent).
6. `POST` with a non-existent (valid-format) id → `404`, `message: "Thread not found"`.
7. `POST`/`DELETE` with a malformed id → `400`, `message: "Invalid thread id"`.
8. All three endpoints **without** a token → `401`.
9. **Scoping:** register a second user; their `GET /api/bookmarks` → `[]` even though user one has a bookmark.
10. **Order:** save two threads in sequence → `GET` returns them newest-saved first.
11. **Deleted-thread safety:** save a thread, delete the thread directly, `GET` → `[]` (no error).

### Backend — unit

- `tests/unit/services/bookmarkService.test.js` — mock `Bookmark`/`Thread` models (mirroring existing unit service tests): `createBookmark` creates and is idempotent on `E11000`; `createBookmark` throws `404` when thread missing and `400` on invalid id; `removeBookmark` is idempotent; `getBookmarksByUser` sorts by `createdAt` desc and filters null-populated threads.
- `tests/unit/controllers/bookmarkController.test.js` — mock the service; assert each controller returns the correct status code and `{ success, message, data }` envelope and reads `req.user.userId`.

### Frontend

- Add MSW handlers in `tests/mocks/handlers.js` for `POST`/`DELETE` `${BASE_URL}/threads/:id/bookmark` and `GET ${BASE_URL}/bookmarks`, plus saved-thread fixtures in `tests/mocks/mockData.js`.
- `tests/unit/reducers/bookmarkSlice.test.js` — `fetchBookmarksThunk.fulfilled` fills `saved` and `savedIds`; `saveBookmarkThunk.fulfilled` adds an id; `removeBookmarkThunk.fulfilled` removes the id and drops the thread from `saved`; rejected paths set `error`.
- `tests/unit/components/ThreadCard.test.jsx` (extend) — renders the bookmark button; clicking an unsaved thread dispatches save; a thread whose id is in `savedIds` renders the filled/saved icon.
- `tests/unit/pages/Profile.test.jsx` (extend) — the "Saved" tab renders compact rows from a seeded `bookmarks.saved` state with links to `/thread/:id`; empty state renders the empty message; mounting dispatches the fetch thunk.
