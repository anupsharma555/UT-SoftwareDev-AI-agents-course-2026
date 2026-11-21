# Implementation Plan — Spec 001: Bookmarks (Saved Threads)

Plan for `specs/001-bookmarks.md`. Work is sequenced **bottom-up**: model → service → controller → route → backend tests → Redux slice → frontend service → component → wire-up → frontend tests. No code is written here — this is the build order, the exact files, and the key functions per task.

**Conventions to hold throughout** (from `CLAUDE.md` / spec): throw `createAppError(msg, status)` (no try/catch in controllers — Express 5 forwards rejections); every response is `{ success, message, data }`; the actor is `req.user.userId` (never the body); backend tests run serially against in-memory Mongo; frontend uses MSW. Run all commands from inside the relevant project dir.

---

## Phase 1 — Backend

### Task 1 — Bookmark model
- **Create** `threadhive-backend/src/models/Bookmark.js`
  - `BookmarkSchema`: `user` (ObjectId→User, required), `thread` (ObjectId→Thread, required), `{ timestamps: true }`.
  - Unique compound index: `BookmarkSchema.index({ user: 1, thread: 1 }, { unique: true })` — DB-level idempotency.
  - `export default mongoose.model("Bookmark", BookmarkSchema)`.
- **Edit** `threadhive-backend/src/app.js`
  - Add `import "./models/Bookmark.js";` beside the existing model side-effect imports (registers the model on app boot).

### Task 2 — Bookmark service
- **Create** `threadhive-backend/src/services/bookmarkService.js`
  - Imports: `Bookmark`, `Thread`, `createAppError`, `mongoose` (for `isValidObjectId`).
  - `createBookmark(userId, threadId)` — guard `isValidObjectId` → `400 "Invalid thread id"`; `Thread.findById` → `404 "Thread not found"` if absent; `Bookmark.create(...)`; **catch `E11000`** (code `11000`) → look up and return the existing bookmark. Returns `{ bookmark, created: boolean }` so the controller can choose `201` vs `200`.
  - `removeBookmark(userId, threadId)` — guard `isValidObjectId` → `400`; `Bookmark.findOneAndDelete({ user: userId, thread: threadId })`; idempotent (no throw when nothing matched).
  - `getBookmarksByUser(userId)` — `Bookmark.find({ user: userId }).sort({ createdAt: -1 }).populate({ path: "thread", populate: [{ path: "author", select: "name" }, { path: "subreddit", select: "name description" }] })`; map to `.thread`; **filter out null threads** (deleted-thread safety).

### Task 3 — Bookmark controller
- **Create** `threadhive-backend/src/controllers/bookmarkController.js`
  - `addBookmark(req, res)` — `createBookmark(req.user.userId, req.params.id)`; respond `201` + `"Thread bookmarked successfully"` when `created`, else `200` + `"Thread already bookmarked"`; `data` = bookmark.
  - `deleteBookmark(req, res)` — `removeBookmark(req.user.userId, req.params.id)`; `200` + `"Bookmark removed successfully"`; `data: { threadId: req.params.id }`.
  - `getBookmarks(req, res)` — `getBookmarksByUser(req.user.userId)`; `200` + `"Bookmarks fetched successfully"`; `data` = threads array.

### Task 4 — Bookmark route + mount
- **Create** `threadhive-backend/src/routes/bookmarks.js`
  - `router.post("/threads/:id/bookmark", authHandler, addBookmark)`
  - `router.delete("/threads/:id/bookmark", authHandler, deleteBookmark)`
  - `router.get("/bookmarks", authHandler, getBookmarks)`
- **Edit** `threadhive-backend/src/app.js`
  - `import bookmarkRoutes from "./routes/bookmarks.js";` and `app.use("/api", bookmarkRoutes);` (same mount style as `voteRoutes`; paths don't collide with the `/api/threads` router).

### Task 5 — Backend tests
- **Create** `threadhive-backend/tests/integration/bookmark.test.js` — `import '../setup.js'`; reuse the `createUserAndLogin()` helper pattern from `vote.test.js`; `beforeEach` clears `Bookmark`/`Thread`/`Subreddit` and seeds a subreddit + thread. Cases (map to spec acceptance criteria):
  1. save → `201`, `data.thread === thread._id`
  2. list after save → length 1, populated `author` + `subreddit`
  3. duplicate save → `200` "already bookmarked", list still length 1
  4. unsave → `200`, list `[]`
  5. unsave again → `200` (idempotent)
  6. save non-existent (valid-format) id → `404 "Thread not found"`
  7. malformed id → `400 "Invalid thread id"`
  8. no token on each endpoint → `401`
  9. second user's list → `[]` (scoping)
  10. two saves → newest-saved first (order)
  11. delete thread after saving → list `[]`, no error
- **Create** `threadhive-backend/tests/unit/services/bookmarkService.test.js` — mock `Bookmark`/`Thread` (mirror existing unit service tests): create + `E11000` idempotency, `404`/`400` guards, `removeBookmark` idempotent, `getBookmarksByUser` sort desc + null-thread filtering.
- **Create** `threadhive-backend/tests/unit/controllers/bookmarkController.test.js` — mock the service; assert status codes, envelope shape, and that `req.user.userId` is used.
- **Verify:** `cd threadhive-backend && npx vitest run tests/integration/bookmark.test.js` then `npm test`.

---

## Phase 2 — Frontend

### Task 6 — API endpoint constants
- **Edit** `threadhive-frontend/src/config/apiConfig.js`
  - Add `BOOKMARK_API = { SAVE: (id) => `/threads/${id}/bookmark`, UNSAVE: (id) => `/threads/${id}/bookmark`, LIST: "/bookmarks" }`.

### Task 7 — Frontend bookmark service
- **Create** `threadhive-frontend/src/services/bookmarkService.js`
  - `getAuthHeaders()` (mirror `threadService.js`).
  - `saveBookmark(threadId)` → `axiosInstance.post(BOOKMARK_API.SAVE(id), null, { headers })`.
  - `removeBookmark(threadId)` → `axiosInstance.delete(BOOKMARK_API.UNSAVE(id), { headers })`.
  - `fetchBookmarks()` → `axiosInstance.get(BOOKMARK_API.LIST, { headers })` → `res.data.data`.

### Task 8 — Redux slice
- **Create** `threadhive-frontend/src/reducers/bookmarkSlice.js`
  - State: `{ saved: [], savedIds: [], loading: false, error: null }`.
  - Thunks (wrap failures with `handleApiError`): `fetchBookmarksThunk`, `saveBookmarkThunk(threadId)`, `removeBookmarkThunk(threadId)`.
  - `extraReducers`: `fetchBookmarksThunk.fulfilled` → set `saved` (threads) and derive `savedIds`; `saveBookmarkThunk.fulfilled` → push `threadId` into `savedIds`; `removeBookmarkThunk.fulfilled` → drop `threadId` from `savedIds` and from `saved`; pending/rejected set `loading`/`error`.

### Task 9 — Store wire-up
- **Edit** `threadhive-frontend/src/store/store.js`
  - Import `bookmarkReducer`; add `bookmarks: bookmarkReducer` to the `reducer` map.

### Task 10 — ThreadCard bookmark button
- **Edit** `threadhive-frontend/src/components/ThreadList/ThreadCard.jsx`
  - Add `useSelector` import; read `savedIds` from `state.bookmarks`; `isSaved = savedIds.includes(thread._id)`.
  - Add a toggle button (`bi-bookmark` ↔ `bi-bookmark-fill`) dispatching `saveBookmarkThunk(thread._id)` / `removeBookmarkThunk(thread._id)`.
  - (Reused by feed and `ThreadPage` — no separate `ThreadPage` edit needed.)

### Task 11 — Profile "Saved" tab
- **Create (optional)** `threadhive-frontend/src/components/Bookmark/SavedThreadsList.jsx` — compact rows (title + `r/subreddit` + author) each `Link`ing to `/thread/:id`; loading + empty states.
- **Edit** `threadhive-frontend/src/pages/User/Profile.jsx`
  - Add a tab control ("Profile" / "Saved") via React Bootstrap `Tabs`/`Tab` (or simple buttons).
  - Add `useEffect` to dispatch `fetchBookmarksThunk` on mount; render `state.bookmarks.saved` via `SavedThreadsList` (or inline).

### Task 12 — Feed indicator wire-up
- **Edit** `threadhive-frontend/src/pages/User/Home.jsx`
  - Dispatch `fetchBookmarksThunk` once on load so feed bookmark icons reflect saved state. *(Only file shared with epic feature #2 — additive dispatch.)*

### Task 13 — Frontend tests
- **Edit** `threadhive-frontend/tests/mocks/handlers.js` — add `POST`/`DELETE` `${BASE_URL}/threads/:id/bookmark` and `GET ${BASE_URL}/bookmarks`.
- **Edit** `threadhive-frontend/tests/mocks/mockData.js` — saved-thread fixtures.
- **Create** `threadhive-frontend/tests/unit/reducers/bookmarkSlice.test.js` — fetch fills `saved`/`savedIds`; save adds id; remove drops id + thread; rejected sets `error`.
- **Edit** `threadhive-frontend/tests/unit/components/ThreadCard.test.jsx` — renders button; click on unsaved dispatches save; `savedIds` membership → filled icon.
- **Edit** `threadhive-frontend/tests/unit/pages/Profile.test.jsx` — "Saved" tab renders rows from seeded state with `/thread/:id` links; empty state; mount dispatches fetch.
- **Verify:** `cd threadhive-frontend && npx vitest run` (slice/component/page tests), then `npm run lint`.

---

## Final verification
- Backend: `cd threadhive-backend && npm test` (full suite green).
- Frontend: `cd threadhive-frontend && npm test -- run && npm run lint`.
- Manual smoke (per spec AC 11–12): save from feed → icon fills; open Profile → "Saved" tab lists it with a working link; unsave → it disappears.

---

## Task checklist

### Backend
- [ ] **T1** Create `models/Bookmark.js` (schema + unique `{user,thread}` index); register import in `app.js`
- [ ] **T2** Create `services/bookmarkService.js` (`createBookmark`, `removeBookmark`, `getBookmarksByUser`)
- [ ] **T3** Create `controllers/bookmarkController.js` (`addBookmark`, `deleteBookmark`, `getBookmarks`)
- [ ] **T4** Create `routes/bookmarks.js` (POST/DELETE `/threads/:id/bookmark`, GET `/bookmarks`); mount at `/api` in `app.js`
- [ ] **T5** Backend tests: integration + service unit + controller unit; green via `npm test`

### Frontend
- [ ] **T6** Add `BOOKMARK_API` to `config/apiConfig.js`
- [ ] **T7** Create `services/bookmarkService.js` (`saveBookmark`, `removeBookmark`, `fetchBookmarks`)
- [ ] **T8** Create `reducers/bookmarkSlice.js` (3 thunks + reducers; `saved`/`savedIds`)
- [ ] **T9** Register `bookmarks` reducer in `store/store.js`
- [ ] **T10** Add bookmark toggle button to `ThreadList/ThreadCard.jsx`
- [ ] **T11** Add "Saved" tab to `pages/User/Profile.jsx` (+ optional `SavedThreadsList` component)
- [ ] **T12** Dispatch `fetchBookmarksThunk` in `pages/User/Home.jsx` for feed indicators
- [ ] **T13** Frontend tests: MSW handlers + fixtures, slice test, ThreadCard test, Profile test; lint clean

### Sign-off
- [ ] **T14** Full backend + frontend suites green; lint clean; manual smoke of AC 11–12
