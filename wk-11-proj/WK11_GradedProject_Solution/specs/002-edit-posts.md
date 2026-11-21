# 002 — Edit Posts (Questions & Answers)

**Status:** Draft
**Feature:** Let an author edit the content of questions and answers they have posted.

## Problem / motivation

Authors make typos, leave out details, or want to clarify a question or answer after posting. Today there is no way to change a post once it is submitted — the only options are deleting and re-posting (which loses votes, answers, and the URL) or living with the mistake. Editing lets authors correct and improve their own content in place, and a visible "edited" marker keeps the change transparent to readers.

## Current state in the codebase (grounding)

The **backend already implements** the edit endpoints and ownership rules; the gap is almost entirely on the frontend plus a small schema/marker addition:

- `PUT /api/questions/:id` → `authenticate` → `updateQuestionService(id, title, description, tags, loggedInUser)` — updates title/description/tags, creates missing tags, enforces owner-or-admin (`403` otherwise, `404` if missing). **Returns the non-populated document** and does **not** set any edited marker.
- `PUT /api/answers/:answerId` → `authenticate` → `updateAnswerService(answerId, answerText, loggedInUser)` — updates `answerText`, enforces owner-or-admin, returns the **populated** answer. No edited marker.
- `src/config/config.js` already defines `QUESTION_API.UPDATE(id)` and `ANSWER_API.UPDATE(answerId)`.
- **Missing on the frontend:** no `updateQuestion`/`updateAnswer` in `services/questionService.js` / `services/answerService.js`, no edit thunks in `questionSlice.js`, and no edit UI in `QuestionContent.jsx` or `AnswerList.jsx`.

## Design decisions (resolved)

1. **Edit UX:** inline edit in place — an "Edit" control swaps the rendered post into an editable form within `QuestionContent` / `AnswerList`, with Save + Cancel. No new React Router route.
2. **Question edit scope:** title + description + tags are all editable (answers edit `answerText`).
3. **Edited marker:** add an explicit `isEdited` boolean (+ `editedAt` date) to the `Question` and `Answer` schemas, set **only** on content edits, and show an "edited" badge. This is required because voting calls `.save()` and bumps `updatedAt`, so `updatedAt` alone cannot distinguish a real edit from a vote.

## User stories

- As the author of a question, I can edit its title, description, and tags and save the changes without leaving the page.
- As the author of an answer, I can edit its text in place and save it.
- As an author, I can cancel an edit and keep the original content.
- As any reader, I can see an "edited" badge on posts that have been changed, so edits are transparent.
- As a logged-in user, I do not see edit controls on posts I did not author.
- As a logged-out visitor, I do not see edit controls at all.

## Acceptance criteria

Each criterion is independently testable.

1. `PUT /api/questions/:id` by the question's author with valid `title`, `description`, and `tags` updates all three, responds `200`, sets `isEdited: true` and a fresh `editedAt`, and returns the question with `author` (name) and `tags` populated.
2. `PUT /api/answers/:answerId` by the answer's author with valid `answerText` updates the text, responds `200`, sets `isEdited: true` and `editedAt`, and returns the populated answer.
3. Editing a question or answer leaves `author` and `createdAt` unchanged.
4. A `PUT` to either endpoint by a logged-in user who is **not** the author (and not an admin) responds `403` and does not modify the post.
5. A `PUT` to either endpoint without an auth token responds `401`.
6. A `PUT` to a non-existent question/answer id responds `404`.
7. A `PUT` with empty or whitespace-only required content (`title` or `description` for questions; `answerText` for answers) responds `400` and does not modify the post.
8. A `PUT` with a malformed ObjectId responds `400`.
9. Editing a question's tags creates any tags that don't yet exist and re-points the question to the resulting tag ids (same behavior as posting).
10. In the UI, an "Edit" control appears on a question/answer only when the current user is its author; it is absent for non-authors and logged-out visitors.
11. Entering edit mode on a question pre-fills the form with the current title, description, and tags (tags rendered as a comma-separated string); on an answer it pre-fills the textarea with the current text.
12. Saving an inline edit updates the displayed content without a full page reload and shows the "edited" badge; Cancel restores the original content and exits edit mode.
13. A post with `isEdited: true` renders an "edited" badge; a post that has only been voted on (never content-edited) does **not** show the badge.

## API contract

Both endpoints exist today; this feature changes their behavior (marker + validation + question-response population). Auth via the existing `authenticate` middleware (`Authorization: Bearer <jwt>`, sets `req.user = { id, isAdmin }`). Responses use the `{ success, message, data }` envelope; errors are thrown as `createAppError(message, statusCode)` and surfaced by `errorHandler`. Authorization: **owner or admin** (unchanged from current services).

### `PUT /api/questions/:id` — edit a question
- **Auth:** required (owner or admin).
- **Request body:** `{ "title": string, "description": string, "tags": string }` — `tags` is a comma-separated string (same format the create form sends).
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Question updated successfully",
    "data": {
      "_id": "...", "title": "...", "description": "...",
      "tags": [ { "_id": "...", "name": "..." } ],
      "author": { "_id": "...", "name": "..." },
      "voteCount": 0, "views": 0,
      "isEdited": true, "editedAt": "2026-06-12T...Z",
      "createdAt": "...", "updatedAt": "..."
    }
  }
  ```
- **400** — missing/whitespace `title` or `description`, or malformed `:id`: `message: "Title and description are required"` / `"Invalid question id"`.
- **403** — `message: "Not authorized to update this question"`.
- **404** — `message: "Question not found"`.
- **401** — missing/invalid token.

> Backend delta vs. today: `updateQuestionService` must additionally (a) set `isEdited`/`editedAt`, (b) validate non-empty `title`/`description` before writing, and (c) **populate `author` (name) and `tags`** on the returned document so the inline UI can re-render immediately.

### `PUT /api/answers/:answerId` — edit an answer
- **Auth:** required (owner or admin).
- **Request body:** `{ "answerText": string }`
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Answer updated successfully",
    "data": {
      "_id": "...", "answerText": "...",
      "author": { "_id": "...", "name": "..." },
      "voteCount": 0, "isEdited": true, "editedAt": "...",
      "questionId": "...", "createdAt": "...", "updatedAt": "..."
    }
  }
  ```
- **400** — empty/whitespace `answerText` or malformed `:answerId`.
- **403** — `message: "Not authorized to update this answer"`.
- **404** — `message: "Answer not found"`.
- **401** — missing/invalid token.

> Backend delta vs. today: `updateAnswerService` already returns a populated answer; it must additionally set `isEdited`/`editedAt` and validate non-empty `answerText`.

## Data model changes

Add the edit marker to both content schemas. No other model changes.

### `src/models/Question.js`
```js
isEdited: { type: Boolean, default: false },
editedAt: { type: Date,    default: null },
```

### `src/models/Answer.js`
```js
isEdited: { type: Boolean, default: false },
editedAt: { type: Date,    default: null },
```

- `timestamps: true` already supplies `createdAt`/`updatedAt`; `updatedAt` is **not** a reliable edit signal because `handleVote` calls `.save()`. `isEdited`/`editedAt` are set **only** by the update services on a content edit.
- Existing documents default to `isEdited: false`, so they render as un-edited until actually edited. No migration required.

## UI changes

All inline; **no new routes** and no Navbar changes. Ownership in the UI is determined by comparing `state.user.userInfo.userId` to the post's `author._id` (the established pattern; `userInfo` does not carry `isAdmin`, so admin edit controls are out of scope — see below).

### Redux: `src/reducers/questionSlice.js`
Add two async thunks, mirroring the existing `voteQuestion`/`voteAnswer`/`postAnswer` shape (token from `getState().user.userInfo.token`):
- `editQuestion({ questionId, title, description, tags })` → calls the question service; on `fulfilled`, replace `currentQuestion` with the returned populated question and update the matching entry in `state.questions` (by `_id`). On `rejected`, set `state.error`.
- `editAnswer({ answerId, answerText })` → calls the answer service; on `fulfilled`, replace the matching answer inside `state.currentQuestion.answers` (by `_id`). On `rejected`, set `state.error`.

### Services
- `src/services/questionService.js` — add `updateQuestion(questionId, { title, description, tags }, token)` → `PUT QUESTION_API.UPDATE(questionId)` with the Bearer header; returns `res.data.data`.
- `src/services/answerService.js` — add `updateAnswer(answerId, answerText, token)` → `PUT ANSWER_API.UPDATE(answerId)` with the Bearer header; returns `res.data.data`.

(`config.js` already defines both endpoints — no change there.)

### Components
- `src/components/Question/QuestionContent.jsx`
  - Read `userInfo`; compute `isOwner = userInfo?.userId === question.author?._id`.
  - Show an "Edit" button (owner only). Toggling enters an **inline edit form** with controlled inputs for title, description (textarea), and tags — tags pre-filled as `question.tags.map(t => t.name).join(', ')`.
  - Save → `dispatch(editQuestion({ questionId: question._id, title, description, tags }))`; disable Save when title or description is blank; on rejection use the existing `alert(...)` pattern. Cancel exits edit mode and restores fields.
  - Render an "edited" badge (e.g. a muted "edited" label, optionally with `formatDate(question.editedAt)`) when `question.isEdited`.
- `src/components/Answer/AnswerList.jsx`
  - Per answer, compute ownership against `userInfo.userId`; show an "Edit" button on owned answers only.
  - Editing swaps that answer's text into an inline textarea (pre-filled). Save → `dispatch(editAnswer({ answerId, answerText }))`; Cancel restores. Disable Save when blank.
  - Render an "edited" badge next to the answer meta when `answer.isEdited`.
- Optional (implementer's discretion): extract a small shared inline-edit affordance, but per-component local state is acceptable and matches the codebase style.

### Routes
None. Editing happens inline on the existing question detail view (`/question/:id`).

## Edge cases & error handling

- **Non-owner / non-admin edit:** `403`, post unchanged (server-enforced even though the UI hides the control).
- **Logged-out user:** no edit control rendered; no client path to the endpoints.
- **Empty / whitespace content:** `400`; the UI also disables Save while required fields are blank.
- **Malformed ObjectId:** `400` (add `mongoose.Types.ObjectId.isValid` guards — stricter than the current services, consistent with project direction).
- **Non-existent post:** `404`.
- **Empty tags string / stray commas:** tokens are trimmed and empty tokens dropped so no blank-named tag is created (hardening of the existing split logic, which currently would create an empty tag).
- **Removed tags become orphaned:** editing tags can leave `Tag` docs no longer referenced by any question; orphan-tag cleanup is **out of scope** (matches current behavior).
- **`updatedAt` vs `editedAt`:** `editedAt` is the canonical "last edited" timestamp; `updatedAt` continues to bump on votes and is not used for the badge.
- **Author/createdAt immutability:** edits never change `author` or `createdAt`.
- **Concurrent edits (lost update):** last write wins; no optimistic-concurrency control.
- **Rate limiting:** the existing global limiter (100 req / 15 min per IP) applies unchanged.

## Out of scope

- Edit history, revision diffs, or "view previous versions".
- Edit reasons/comments or moderation review of edits.
- An **admin edit UI**: the backend authorizes admins, but `userInfo` does not carry `isAdmin`, so admins get no edit button. Surfacing admin edit controls would require adding `isAdmin` to the login payload/`userInfo` — deferred.
- Rich text / Markdown rendering or a WYSIWYG editor.
- Orphan-tag cleanup when tags are removed.
- Editing immutable fields (author, votes, createdAt) or transferring ownership.
- Optimistic-concurrency / conflict resolution for simultaneous editors.
- Editing other post types (only questions and answers exist).

## Test plan

### Backend (Vitest + Supertest + mongodb-memory-server; `tests/setup.js` provides the in-memory DB; auth tokens via the `createUserAndLogin()` register→login helper used in `tests/integration/vote.test.js`)

**Unit — `tests/unit/services/questionService.test.js` (extend)**
- `updateQuestionService` by owner updates title/description/tags, sets `isEdited: true` + `editedAt`, and returns a doc with populated `author`/`tags`.
- Throws `403` for a non-owner, non-admin; allows an admin (`isAdmin: true`).
- Throws `404` for a missing id; `400` for empty `title`/`description`; `400` for a malformed id.
- Creating new tags on edit works; empty tag tokens are dropped (no blank tag created).
- `author` and `createdAt` are unchanged after edit.

**Unit — `tests/unit/services/answerService.test.js` (extend)**
- `updateAnswerService` by owner updates `answerText`, sets `isEdited`/`editedAt`, returns populated answer.
- `403` non-owner, `404` missing, `400` empty `answerText` / malformed id.

**Integration — `tests/integration/questions.test.js` & `tests/integration/answers.test.js` (extend)**
- `PUT /api/questions/:id`: `200` owner happy path (assert `isEdited`, populated `tags`/`author`, changed fields); `401` no token; `403` other user; `404` missing; `400` empty body.
- `PUT /api/answers/:answerId`: same matrix for `answerText`.
- Regression: a question that was only **voted** on (via the vote endpoint) still has `isEdited: false`.

### Frontend (Vitest + jsdom + Testing Library + MSW; add handlers to `tests/mocks/handlers.js`)

**MSW handlers**
- Add `PUT /questions/:id` and `PUT /answers/:answerId` returning the updated entity with `isEdited: true` (+ populated `author`/`tags` for questions).

**Unit — `tests/unit/reducers/questionSlice.test.jsx` (extend)**
- `editQuestion` fulfilled replaces `currentQuestion` and the matching `questions[]` entry with the updated payload.
- `editAnswer` fulfilled replaces the matching answer in `currentQuestion.answers`.
- Rejected paths set `error`.

**Component**
- `tests/unit/components/QuestionContent.test.jsx` (new or extend): Edit button shows for the author and is absent for a non-author / logged-out user; entering edit mode pre-fills title/description/tags (tags as comma string); Save dispatches `editQuestion`; Cancel restores; "edited" badge renders when `isEdited`.
- `tests/unit/components/AnswerList.test.jsx` (extend): per-answer Edit button gated by ownership; inline textarea pre-filled; Save dispatches `editAnswer`; "edited" badge when `isEdited`.

**Integration — `tests/integration/editFlow.test.jsx` (new, MSW-backed)**
- Authenticated author opens a question they own, edits the description inline, saves → updated text and "edited" badge appear without navigation.
- The same author edits one of their answers inline → updated text + badge.
- A logged-in non-author viewing the same question sees no Edit controls.
