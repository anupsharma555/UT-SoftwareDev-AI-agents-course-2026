# 002 — Edit Posts — Implementation Plan

Plan for [`002-edit-posts.md`](./002-edit-posts.md). Sequenced bottom-up: model → service → controller → route → backend tests, then Redux slice → frontend service → component → wire-up → frontend tests. No code is written here.

## Starting point (what already exists)

Unlike a greenfield feature, the backend HTTP surface is already in place — the work concentrates in the **two schemas** and **two services**, then the **frontend**:

- ✅ `PUT /api/questions/:id` route + `updateQuestion` controller exist.
- ✅ `PUT /api/answers/:answerId` route + `updateAnswer` controller exist.
- ✅ `updateQuestionService` / `updateAnswerService` exist with owner-or-admin checks and `404` handling.
- ✅ `config.js` defines `QUESTION_API.UPDATE(id)` and `ANSWER_API.UPDATE(answerId)`.
- ✅ `question` reducer is already registered in `store.js`.

So the controller/route phases below are **verification gates** (assert no change needed), not edits. Everything else is new behavior.

## Conventions to honor (recap)

- **Backend:** controllers stay thin and do **no** try/catch — services `throw createAppError(message, statusCode)` and Express 5 forwards to `errorHandler`. Auth via `authenticate` (sets `req.user = { id, isAdmin }`). Authorization is owner-or-admin (unchanged).
- **Frontend:** Redux thunks call the service layer (never axios directly); services use `axiosInstance` + `config.js` paths, pass `Authorization: Bearer ${token}` explicitly, and return `res.data.data`. Token from `getState().user.userInfo.token`. UI ownership compares `userInfo.userId` to `author._id` (no `isAdmin` in the client token).
- **Validation messages must match the spec verbatim** — backend tests assert on them.

---

## Phase 1 — Data model

### Task 1.1 — Add edit marker to `Question`
- **Edit:** `devanswers-backend/src/models/Question.js`
- Add to the schema: `isEdited: { type: Boolean, default: false }` and `editedAt: { type: Date, default: null }`.

### Task 1.2 — Add edit marker to `Answer`
- **Edit:** `devanswers-backend/src/models/Answer.js`
- Add the same two fields.

> No migration: existing docs default to `isEdited: false`.

---

## Phase 2 — Service layer (the core backend change)

### Task 2.1 — Update `updateQuestionService`
- **Edit:** `devanswers-backend/src/services/questionService.js`
- Add `import mongoose from "mongoose";` (needed for `Types.ObjectId.isValid`).
- In `updateQuestionService(id, title, description, tags, loggedInUser)`:
  1. **Id guard:** `if (!mongoose.Types.ObjectId.isValid(id)) throw createAppError("Invalid question id", 400)`.
  2. **Content validation:** if `title?.trim()` or `description?.trim()` is empty → `createAppError("Title and description are required", 400)` (before any DB write).
  3. Keep the existing `findById` + owner/admin check (`403` / `404`).
  4. **Tag parsing hardening:** split `tags` on commas, `trim`, and `.filter(Boolean)` so blank tokens don't create empty-named tags; resolve/create tag ids as today.
  5. **Set marker + populate:** `findByIdAndUpdate(id, { title, description, tags: tagIds, isEdited: true, editedAt: new Date() }, { new: true }).populate({ path: "author", select: "name" }).populate("tags")` and return it (today it returns a non-populated doc).

### Task 2.2 — Update `updateAnswerService`
- **Edit:** `devanswers-backend/src/services/answerService.js`
- Add `import mongoose from "mongoose";`.
- In `updateAnswerService(answerId, answerText, loggedInUser)`:
  1. **Id guard:** invalid `answerId` → `createAppError("Invalid answer id", 400)`.
  2. **Content validation:** empty/whitespace `answerText` → `createAppError("Answer text is required", 400)`.
  3. Keep `findById` + owner/admin check (`403` / `404`).
  4. Set `answer.answerText`, `answer.isEdited = true`, `answer.editedAt = new Date()`, `save()`.
  5. Return the populated answer (already `Answer.findById(answerId).populate("author", "name")`).

---

## Phase 3 — Controller (verify only)

### Task 3.1 — Verify `updateQuestion`
- **Check (no edit expected):** `devanswers-backend/src/controllers/questionController.js` — `updateQuestion` passes `title/description/tags` + `req.user` to the service and responds `200 { message: "Question updated successfully", data }`. Confirms criterion 1 wording.

### Task 3.2 — Verify `updateAnswer`
- **Check (no edit expected):** `devanswers-backend/src/controllers/answerController.js` — `updateAnswer` passes `answerText` + `req.user` and responds `200 { message: "Answer updated successfully", data }`.

---

## Phase 4 — Route (verify only)

### Task 4.1 — Verify question route
- **Check:** `devanswers-backend/src/routes/questions.js` has `router.put("/:id", authenticate, updateQuestion)`.

### Task 4.2 — Verify answer route
- **Check:** `devanswers-backend/src/routes/answers.js` has `router.put("/:answerId", authenticate, updateAnswer)`.

---

## Phase 5 — Backend tests

### Task 5.1 — Question service unit tests
- **Edit:** `devanswers-backend/tests/unit/services/questionService.test.js`
- Add: owner edit updates title/description/tags, sets `isEdited: true` + `editedAt`, returns populated `author`/`tags`; `403` non-owner; allowed for `isAdmin: true`; `404` missing; `400` empty title/description; `400` malformed id; empty tag tokens dropped; `author`/`createdAt` unchanged.

### Task 5.2 — Answer service unit tests
- **Edit:** `devanswers-backend/tests/unit/services/answerService.test.js`
- Add: owner edit updates `answerText`, sets `isEdited`/`editedAt`, returns populated answer; `403` non-owner; `404` missing; `400` empty `answerText` / malformed id.

### Task 5.3 — Question integration tests
- **Edit:** `devanswers-backend/tests/integration/questions.test.js`
- Add `PUT /api/questions/:id`: `200` owner (assert `isEdited`, populated `tags`/`author`, changed fields); `401` no token; `403` other user; `404` missing; `400` empty body. Use the `createUserAndLogin()` register→login helper pattern from `tests/integration/vote.test.js`; clear `Bookmark`-independent collections in `beforeEach` as the file already does.

### Task 5.4 — Answer integration tests + vote regression
- **Edit:** `devanswers-backend/tests/integration/answers.test.js`
- Add `PUT /api/answers/:answerId` matrix mirroring 5.3.
- **Regression:** after a vote via the vote endpoint, the question/answer still has `isEdited: false` (confirms the marker isn't tied to `updatedAt`).
- **Gate:** `cd devanswers-backend && npm test` — green.

---

## Phase 6 — Redux slice

### Task 6.1 — Add edit thunks + reducers
- **Edit:** `devanswers-frontend/src/reducers/questionSlice.js`
- Import the new service functions (Phase 7). Add async thunks, mirroring `voteQuestion`/`voteAnswer`/`postAnswer` (token from `getState().user.userInfo.token`):
  - `editQuestion({ questionId, title, description, tags })` → `updateQuestion(...)`; `fulfilled` replaces `state.currentQuestion` with the returned populated question **and** updates the matching entry in `state.questions` (by `_id`); `rejected` sets `state.error`.
  - `editAnswer({ answerId, answerText })` → `updateAnswer(...)`; `fulfilled` finds the answer in `state.currentQuestion.answers` (by `_id`) and replaces it; `rejected` sets `state.error`.

---

## Phase 7 — Frontend services

### Task 7.1 — `updateQuestion` service
- **Edit:** `devanswers-frontend/src/services/questionService.js`
- Add `updateQuestion(questionId, { title, description, tags }, token)` → `axiosInstance.put(QUESTION_API.UPDATE(questionId), { title, description, tags }, { headers: { Authorization: \`Bearer ${token}\` } })`; return `res.data.data`.

### Task 7.2 — `updateAnswer` service
- **Edit:** `devanswers-frontend/src/services/answerService.js`
- Add `updateAnswer(answerId, answerText, token)` → `axiosInstance.put(ANSWER_API.UPDATE(answerId), { answerText }, { headers: { Authorization: \`Bearer ${token}\` } })`; return `res.data.data`.

> `config.js` already defines both `UPDATE` endpoints — verify, no change.

---

## Phase 8 — Components (inline edit affordances)

### Task 8.1 — Question inline edit
- **Edit:** `devanswers-frontend/src/components/Question/QuestionContent.jsx`
- Read `userInfo` (`useSelector`); compute `isOwner = userInfo?.userId === question.author?._id`.
- Add local edit state (`isEditing`, controlled `title`/`description`/`tags`). On entering edit, pre-fill tags as `question.tags.map(t => t.name).join(", ")`.
- Render an **Edit** button (owner only); in edit mode show inputs for title, description (textarea), tags + **Save**/**Cancel**. Disable Save when title or description is blank.
- Save → `dispatch(editQuestion({ questionId: question._id, title, description, tags }))`; on rejection `alert(...)`. Cancel restores fields and exits.
- Render an **"edited"** badge (optionally with `formatDate(question.editedAt)`) when `question.isEdited`.

### Task 8.2 — Answer inline edit
- **Edit:** `devanswers-frontend/src/components/Answer/AnswerList.jsx`
- Track which answer is being edited (e.g. `editingId` + draft text). Per answer, compute ownership vs `userInfo.userId`; show **Edit** on owned answers only.
- Edit mode swaps that answer's text into a pre-filled textarea + **Save**/**Cancel**; Save → `dispatch(editAnswer({ answerId, answerText }))`; disable when blank.
- Render an **"edited"** badge in the answer meta when `answer.isEdited`.

---

## Phase 9 — Wire-up (verification)

Inline editing lives inside the display components, so there is little separate wiring:

### Task 9.1 — Confirm data flow
- `QuestionDetail.jsx` already passes `currentQuestion` to `QuestionContent` and `currentQuestion.answers` to `AnswerList` — no change.
- `store.js` already registers the `question` reducer — no change.
- Confirm `isEdited`/`editedAt` are present on the data the detail view renders: they come through automatically from `getQuestionByIdService` (returns `question.toObject()` incl. new fields and embedded answers) and from the edit thunks' fulfilled payloads.

---

## Phase 10 — Frontend tests

### Task 10.1 — MSW handlers
- **Edit:** `devanswers-frontend/tests/mocks/handlers.js`
- Add `http.put("/questions/:id")` returning the updated question with `isEdited: true` and populated `author`/`tags`; add `http.put("/answers/:answerId")` returning the updated answer with `isEdited: true`.

### Task 10.2 — Slice tests
- **Edit:** `devanswers-frontend/tests/unit/reducers/questionSlice.test.jsx`
- `editQuestion` fulfilled replaces `currentQuestion` and the matching `questions[]` entry; `editAnswer` fulfilled replaces the matching answer in `currentQuestion.answers`; rejected paths set `error`.

### Task 10.3 — Question component test
- **Edit (or add cases):** `devanswers-frontend/tests/unit/components/QuestionContent.test.jsx`
- Edit button shown for author, absent for non-author / logged-out; entering edit pre-fills title/description/tags (tags as comma string); Save dispatches `editQuestion`; Cancel restores; "edited" badge renders when `isEdited`.

### Task 10.4 — Answer component test
- **Edit:** `devanswers-frontend/tests/unit/components/AnswerList.test.jsx`
- Per-answer Edit gated by ownership; inline textarea pre-filled; Save dispatches `editAnswer`; "edited" badge when `isEdited`.

### Task 10.5 — Integration flow
- **Create:** `devanswers-frontend/tests/integration/editFlow.test.jsx`
- Author edits a question's description inline → updated text + "edited" badge without navigation; author edits an answer inline → updated text + badge; a logged-in non-author sees no Edit controls.
- **Gate:** `cd devanswers-frontend && npm test` and `npm run lint` — green.

---

## Sequencing & risk notes

- **Backend-first, runnable early:** Phases 1–5 are fully testable (`cd devanswers-backend && npm test`) before any frontend work.
- **`mongoose` import:** both services need `import mongoose` added for the `ObjectId.isValid` guards.
- **Non-populated → populated question response:** the key backend behavior change is populating `author`/`tags` on the question update response so the inline UI re-renders without a refetch — easy to forget.
- **Marker vs `updatedAt`:** set `isEdited`/`editedAt` only in the update services; do **not** touch `handleVote`. The vote-regression test guards this.
- **Slice cross-dependency:** `questionSlice` (Phase 6) imports services created in Phase 7 — create both before running the app/tests. No import cycle.
- **Tags round-trip:** prefill the form from `tags.map(t => t.name).join(", ")`; the service re-parses the comma string on save.
- **Admin UI gap (per spec):** UI gates Edit on ownership only because `userInfo` carries no `isAdmin`; admin edit buttons are out of scope.
- **Message strings:** keep `"Title and description are required"`, `"Answer text is required"`, `"Invalid question id"`, `"Invalid answer id"` exact — tests assert them.

---

## Task checklist

### Backend
- [ ] 1.1 Add `isEdited` + `editedAt` to `src/models/Question.js`
- [ ] 1.2 Add `isEdited` + `editedAt` to `src/models/Answer.js`
- [ ] 2.1 Update `updateQuestionService` (id guard, content validation, tag filter, set marker, populate response) in `src/services/questionService.js`
- [ ] 2.2 Update `updateAnswerService` (id guard, content validation, set marker) in `src/services/answerService.js`
- [ ] 3.1 Verify `updateQuestion` controller (no change)
- [ ] 3.2 Verify `updateAnswer` controller (no change)
- [ ] 4.1 Verify `PUT /:id` route (no change)
- [ ] 4.2 Verify `PUT /:answerId` route (no change)
- [ ] 5.1 Extend `tests/unit/services/questionService.test.js`
- [ ] 5.2 Extend `tests/unit/services/answerService.test.js`
- [ ] 5.3 Extend `tests/integration/questions.test.js`
- [ ] 5.4 Extend `tests/integration/answers.test.js` (+ vote regression)
- [ ] Run `cd devanswers-backend && npm test` — green

### Frontend
- [ ] 7.1 Add `updateQuestion` to `src/services/questionService.js`
- [ ] 7.2 Add `updateAnswer` to `src/services/answerService.js`
- [ ] 6.1 Add `editQuestion` + `editAnswer` thunks/reducers to `src/reducers/questionSlice.js`
- [ ] 8.1 Inline edit + owner gate + edited badge in `src/components/Question/QuestionContent.jsx`
- [ ] 8.2 Per-answer inline edit + owner gate + edited badge in `src/components/Answer/AnswerList.jsx`
- [ ] 9.1 Verify data flow (`QuestionDetail`, `store.js`, `isEdited` propagation) — no change expected
- [ ] 10.1 Add `PUT` handlers to `tests/mocks/handlers.js`
- [ ] 10.2 Extend `tests/unit/reducers/questionSlice.test.jsx`
- [ ] 10.3 Extend `tests/unit/components/QuestionContent.test.jsx`
- [ ] 10.4 Extend `tests/unit/components/AnswerList.test.jsx`
- [ ] 10.5 Create `tests/integration/editFlow.test.jsx`
- [ ] Run `cd devanswers-frontend && npm test` and `npm run lint` — green
