# 001 — Bookmarks — Implementation Plan

Plan for [`001-bookmarks.md`](./001-bookmarks.md). Work is sequenced bottom-up: backend data → service → controller → route → backend tests, then frontend slice → service → component → wire-up → frontend tests. No code is written here.

## Conventions to honor (recap)

- **Backend layering:** `routes → controllers → services → models`. Controllers stay thin (parse `req`, call service, send `{ success, message, data }`); **no try/catch** in controllers — services `throw createAppError(message, statusCode)` and Express 5 forwards to `errorHandler`.
- **Auth:** reuse `authenticate` (default export of `src/middleware/authHandler.js`); it sets `req.user = { id, isAdmin }`.
- **Frontend:** Redux Toolkit thunks call the **service layer** (never axios directly); services use the shared `axiosInstance`, read paths from `src/config/config.js`, return `res.data.data`, and pass `Authorization: Bearer ${token}` explicitly. Token comes from `getState().user.userInfo.token`.

---

## Phase 1 — Data model

### Task 1.1 — Create the `Bookmark` model
- **Create:** `devanswers-backend/src/models/Bookmark.js`
- **Schema:** `{ user: ObjectId→User (required), question: ObjectId→Question (required) }`, `{ timestamps: true }`.
- **Indexes:** unique compound `{ user: 1, question: 1 }` (dedupe + race guard); secondary `{ user: 1, createdAt: -1 }` (newest-first listing).
- **Export:** `mongoose.model("Bookmark", bookmarkSchema)` as default — mirrors `Question.js`/`Answer.js`.

### Task 1.2 — Register the model in the app
- **Edit:** `devanswers-backend/src/app.js`
- Add `import Bookmark from "./models/Bookmark.js";` alongside the existing model imports so the model is registered before requests are served.

---

## Phase 2 — Service layer

### Task 2.1 — Create the bookmark service
- **Create:** `devanswers-backend/src/services/bookmarkService.js`
- **Imports:** `Bookmark`, `Question`, `Answer` models; `createAppError`; `mongoose` (for `Types.ObjectId.isValid`).
- **Key functions:**
  - `saveBookmarkService(userId, questionId)` — validate `questionId` with `mongoose.Types.ObjectId.isValid` → else `createAppError("A valid questionId is required", 400)`; verify `Question.findById` exists → else `404 "Question not found"`; `Bookmark.findOne({ user, question })` → if found return `{ bookmark, created: false }`; else create and return `{ bookmark, created: true }`. Wrap the create in a guard so a duplicate-key (`E11000`) race re-fetches and returns `{ created: false }` rather than throwing 500.
  - `unsaveBookmarkService(userId, questionId)` — validate id (400); `Bookmark.deleteOne({ user, question })`; return `{ questionId }` regardless of match count (idempotent).
  - `getSavedQuestionsService(userId)` — `Bookmark.find({ user }).sort({ createdAt: -1 }).populate({ path: "question", populate: [{ path: "author", select: "name" }, { path: "tags" }] })`; drop entries whose `question` is `null` (dangling); for each, add `answerCount` via `Answer.countDocuments({ questionId })` and `savedAt = bookmark.createdAt`; return the array of question objects.
  - `getSavedQuestionIdsService(userId)` — `Bookmark.find({ user }).select("question").sort({ createdAt: -1 })`; map to `question` id strings.
- **Notes:** returns `[]` for empty (no 404). The `created` flag lets the controller choose 201 vs 200.

### Task 2.2 — Cascade-delete bookmarks on question deletion
- **Edit:** `devanswers-backend/src/services/questionService.js`
- Import `Bookmark`; in `deleteQuestionService`, after `Answer.deleteMany({ questionId: id })`, add `await Bookmark.deleteMany({ question: id })`. (Satisfies acceptance criterion 12.)

---

## Phase 3 — Controller

### Task 3.1 — Create the bookmark controller
- **Create:** `devanswers-backend/src/controllers/bookmarkController.js`
- **Imports:** the four service functions.
- **Key functions (all `async (req, res)`):**
  - `saveBookmark` — `userId = req.user.id`, `questionId = req.body.questionId`; call service; `res.status(created ? 201 : 200).json({ success: true, message: created ? "Question saved" : "Question already saved", data: bookmark })`.
  - `unsaveBookmark` — `req.user.id` + `req.params.questionId`; `200` `{ message: "Question unsaved", data: { questionId } }`.
  - `getSavedQuestions` — `200` `{ message: "Saved questions fetched successfully", data }`.
  - `getSavedQuestionIds` — `200` `{ message: "Saved question ids fetched successfully", data }`.

---

## Phase 4 — Route

### Task 4.1 — Create the bookmarks router
- **Create:** `devanswers-backend/src/routes/bookmarks.js`
- Import `express`, the controller functions, and `authenticate`. All routes protected.
- **Declarations (order matters — static `/ids` before param routes):**
  - `GET /ids` → `authenticate, getSavedQuestionIds`
  - `GET /` → `authenticate, getSavedQuestions`
  - `POST /` → `authenticate, saveBookmark`
  - `DELETE /:questionId` → `authenticate, unsaveBookmark`

### Task 4.2 — Mount the router
- **Edit:** `devanswers-backend/src/routes/index.js`
- `import bookmarksRouter from "./bookmarks.js";` and `router.use("/bookmarks", bookmarksRouter);`.

---

## Phase 5 — Backend tests

### Task 5.1 — Service unit tests
- **Create:** `devanswers-backend/tests/unit/services/bookmarkService.test.js`
- Import `../setup.js`; create `User`/`Question`/`Answer`/`Bookmark` directly via models; `beforeEach` clears `Bookmark`/`Question`/`Answer`.
- Cover: save creates (`created: true`); duplicate save returns existing (`created: false`, count stays 1); save → 404 for non-existent question; save → 400 for malformed id; unsave removes then is a no-op; `getSavedQuestionsService` sorts desc, populates `author.name`/`tags`, adds `answerCount`, excludes other users and dangling questions; empty → `[]`; `getSavedQuestionIdsService` returns id strings for the user only.

### Task 5.2 — Integration tests
- **Create:** `devanswers-backend/tests/integration/bookmarks.test.js`
- Reuse the `createUserAndLogin()` register→login helper pattern from `tests/integration/vote.test.js` to get `jwtToken`; create a second user to assert isolation. `beforeEach` clears `Bookmark`/`Question`/`Answer`/`Tag`.
- Cover (maps to acceptance criteria): `401` without token (each endpoint); `POST` valid → `201`; re-`POST` → `200` "already saved" with exactly one row; `POST` non-existent → `404`; malformed id → `400`; `GET /api/bookmarks` newest-first with populated `author`/`tags`/`answerCount` and `200 []` when empty; `GET /api/bookmarks/ids` → id array; `DELETE` → `200` then idempotent `200`, and absence from subsequent `GET`; User A's saves invisible to User B; deleting a question via `DELETE /api/questions/:id` removes it from a saver's list (cascade).

---

## Phase 6 — Redux slice

### Task 6.1 — Create the bookmark slice
- **Create:** `devanswers-frontend/src/reducers/bookmarkSlice.js`
- **State:** `{ savedIds: [], savedQuestions: [], loadingIds: false, loadingList: false, error: null }`.
- **Thunks** (import the frontend bookmark service from Task 7.1; read token via `getState().user.userInfo?.token`):
  - `fetchSavedIds` → populates `savedIds`.
  - `fetchSavedQuestions` → populates `savedQuestions` (sets `loadingList`).
  - `toggleBookmark({ questionId })` → branch on `savedIds.includes(questionId)`: call `unsaveQuestion` or `saveQuestion`; in `fulfilled`, add/remove the id in `savedIds` and remove the matching card from `savedQuestions` on unsave; `rejected` sets `error`.
- **Sync reducer:** `clearBookmarks` → reset to initial state.
- **Optional selector:** `selectIsSaved(questionId)` for component convenience.

### Task 6.2 — Register the reducer
- **Edit:** `devanswers-frontend/src/store.js`
- Import `bookmarkReducer`; add `bookmark: bookmarkReducer` to the store.

> Cross-dependency note: this slice imports service functions created in Phase 7. No runtime breakage occurs until wired, but create Phase 7 before running the app/tests. No import cycle exists (`bookmarkSlice` imports only the service; `userSlice` will import `clearBookmarks` in Phase 9 — one-directional).

---

## Phase 7 — Frontend service + config

### Task 7.1 — Add endpoint config
- **Edit:** `devanswers-frontend/src/config/config.js`
- Add `BOOKMARK_API = { LIST: "/bookmarks", IDS: "/bookmarks/ids", SAVE: "/bookmarks", UNSAVE: (questionId) => `/bookmarks/${questionId}` }`.

### Task 7.2 — Create the frontend bookmark service
- **Create:** `devanswers-frontend/src/services/bookmarkService.js`
- Import `axiosInstance` and `BOOKMARK_API`. Functions (each returns `res.data.data`, auth header set explicitly):
  - `getSavedIds(token)` → `GET BOOKMARK_API.IDS`
  - `getSavedQuestions(token)` → `GET BOOKMARK_API.LIST`
  - `saveQuestion(questionId, token)` → `POST BOOKMARK_API.SAVE` with `{ questionId }`
  - `unsaveQuestion(questionId, token)` → `DELETE BOOKMARK_API.UNSAVE(questionId)`

---

## Phase 8 — Component

### Task 8.1 — Create `BookmarkButton`
- **Create:** `devanswers-frontend/src/components/Shared/BookmarkButton.jsx`
- **Props:** `{ questionId }`.
- Read `savedIds` and `userInfo` via `useSelector`; `useDispatch`.
- Return `null` when `!userInfo` (criterion 14).
- Render a `react-bootstrap` `Button` (variant `link`) showing `FaBookmark` (filled) when `savedIds.includes(questionId)`, else `FaRegBookmark` (outline) — both from `react-icons/fa`.
- `onClick` → `dispatch(toggleBookmark({ questionId }))`; on rejection use the existing `alert(...)` pattern from `QuestionCard`'s vote handler. Include an `aria-label`/`title` ("Save"/"Saved") for accessibility and test targeting.

---

## Phase 9 — Wire-up

### Task 9.1 — Add the control to question cards
- **Edit:** `devanswers-frontend/src/components/Question/QuestionCard.jsx` — import and render `<BookmarkButton questionId={question._id} />` in the stats column near the vote/answer counts.

### Task 9.2 — Add the control to the detail view
- **Edit:** `devanswers-frontend/src/components/Question/QuestionContent.jsx` — render `<BookmarkButton questionId={question._id} />` (header card or beside the voting column).

### Task 9.3 — Saved Questions section on Profile
- **Edit:** `devanswers-frontend/src/pages/Profile/Profile.jsx`
- Add `useDispatch` + `useSelector((s) => s.bookmark)`; in the existing auth `useEffect`, dispatch `fetchSavedQuestions()` when authenticated.
- Add a "Saved Questions" section (shown when not editing): `Spinner` while `loadingList`; map `savedQuestions` to `<QuestionCard />`; empty state "You haven't saved any questions yet." Unsaving a card (via its `BookmarkButton`) removes it from `savedQuestions` through the slice (criterion 15).

### Task 9.4 — Hydrate saved-state on login / app load
- **Edit:** `devanswers-frontend/src/App.jsx`
- Add `useSelector` for `userInfo` + `useDispatch`; `useEffect` that dispatches `fetchSavedIds()` when a token is present, keyed on `userInfo?.token`. (App is rendered inside the Redux `Provider` via `main.jsx`.) Alternative host: `BaseLayout` — App preferred to keep `BaseLayout` presentational.

### Task 9.5 — Clear saved-state on logout
- **Edit:** `devanswers-frontend/src/reducers/userSlice.js`
- In the `logoutUser` thunk, after resetting user state, `dispatch(clearBookmarks())` (import from `bookmarkSlice.js`) so saved-state does not leak across accounts.

---

## Phase 10 — Frontend tests

### Task 10.1 — Extend MSW infra
- **Edit:** `devanswers-frontend/tests/mocks/handlers.js` — add handlers for `GET /bookmarks`, `GET /bookmarks/ids`, `POST /bookmarks`, `DELETE /bookmarks/:questionId` (make POST/DELETE update an in-memory set so the integration flow reflects saves/unsaves).
- **Edit (if needed):** `devanswers-frontend/tests/mocks/mockData.js` — add saved-question fixtures/ids reused across tests.

### Task 10.2 — Slice unit tests
- **Create:** `devanswers-frontend/tests/unit/reducers/bookmarkSlice.test.jsx` — initial state; `fetchSavedIds`/`fetchSavedQuestions` fulfilled populate state; `toggleBookmark` adds when absent and removes (id + card) when present; `clearBookmarks` resets.

### Task 10.3 — Component test
- **Create:** `devanswers-frontend/tests/unit/components/BookmarkButton.test.jsx` — outline vs filled icon based on `savedIds`; click dispatches `toggleBookmark`; renders nothing when `userInfo` is null. (Render with a Redux `Provider`/preloaded store.)

### Task 10.4 — Extend existing tests
- **Edit:** `devanswers-frontend/tests/unit/components/QuestionCard.test.jsx` — assert the bookmark control renders for an authenticated user (preloaded store with `userInfo`).
- **Edit:** `devanswers-frontend/tests/unit/pages/profile.test.jsx` — mocked `GET /bookmarks` with two questions renders two `QuestionCard`s; empty response renders the empty state.

### Task 10.5 — Integration flow
- **Create:** `devanswers-frontend/tests/integration/bookmarkFlow.test.jsx` — authenticated user saves from a card (icon flips to filled, id in `savedIds`); profile shows the saved question; unsaving from the profile removes the card.

---

## Sequencing & risk notes

- **Bottom-up build, top-down verify:** Phases 1–5 are independently runnable (`cd devanswers-backend && npm test`) before any frontend work starts. Phases 6–10 then build on a known-good API.
- **Route ordering:** declare `GET /ids` before param routes in `bookmarks.js` (defensive, though no `GET /:questionId` exists).
- **Test DB cleanup:** `tests/setup.js` only auto-clears `Question`/`Answer`; new bookmark tests must clear `Bookmark` themselves in `beforeEach` (follow `vote.test.js`).
- **Idempotency contracts:** keep save 201-vs-200 and the idempotent DELETE/`E11000` handling in the service, not the controller — that's where the spec's testable behavior lives.
- **No import cycle:** `userSlice → clearBookmarks` (Phase 9.5) is one-directional; `bookmarkSlice` imports only the service.

---

## Task checklist

### Backend
- [ ] 1.1 Create `src/models/Bookmark.js` (schema + unique & listing indexes)
- [ ] 1.2 Import/register `Bookmark` in `src/app.js`
- [ ] 2.1 Create `src/services/bookmarkService.js` (save / unsave / list / ids)
- [ ] 2.2 Add bookmark cascade to `deleteQuestionService` in `src/services/questionService.js`
- [ ] 3.1 Create `src/controllers/bookmarkController.js` (4 handlers, 201/200 logic)
- [ ] 4.1 Create `src/routes/bookmarks.js` (4 authenticated routes)
- [ ] 4.2 Mount `/bookmarks` in `src/routes/index.js`
- [ ] 5.1 Create `tests/unit/services/bookmarkService.test.js`
- [ ] 5.2 Create `tests/integration/bookmarks.test.js`
- [ ] Run `cd devanswers-backend && npm test` — green

### Frontend
- [ ] 7.1 Add `BOOKMARK_API` to `src/config/config.js`
- [ ] 7.2 Create `src/services/bookmarkService.js`
- [ ] 6.1 Create `src/reducers/bookmarkSlice.js` (thunks + `clearBookmarks`)
- [ ] 6.2 Register `bookmark` reducer in `src/store.js`
- [ ] 8.1 Create `src/components/Shared/BookmarkButton.jsx`
- [ ] 9.1 Wire `BookmarkButton` into `QuestionCard.jsx`
- [ ] 9.2 Wire `BookmarkButton` into `QuestionContent.jsx`
- [ ] 9.3 Add "Saved Questions" section to `Profile.jsx`
- [ ] 9.4 Hydrate `fetchSavedIds` on login/app load in `App.jsx`
- [ ] 9.5 Dispatch `clearBookmarks` from `logoutUser` in `userSlice.js`
- [ ] 10.1 Extend `tests/mocks/handlers.js` (+ `mockData.js` if needed)
- [ ] 10.2 Create `tests/unit/reducers/bookmarkSlice.test.jsx`
- [ ] 10.3 Create `tests/unit/components/BookmarkButton.test.jsx`
- [ ] 10.4 Extend `QuestionCard.test.jsx` and `profile.test.jsx`
- [ ] 10.5 Create `tests/integration/bookmarkFlow.test.jsx`
- [ ] Run `cd devanswers-frontend && npm test` and `npm run lint` — green
