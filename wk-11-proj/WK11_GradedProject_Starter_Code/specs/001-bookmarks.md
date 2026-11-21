# 001: Bookmarks

Status: Implemented
Paths are relative to the project root, the `WK11_GradedProject_Starter_Code/` folder (`BE` = `devanswers-backend/`, `FE` = `devanswers-frontend/`).

## Problem / motivation

Users find questions they want to return to, but DevAnswers has no way to save them. Users must re-search or remember the question. This feature lets a logged-in user save (bookmark) questions and revisit them from a Saved Questions section on their profile.

## User stories

1. As a logged-in user, I can bookmark a question from the home feed (including the tag-filtered view) or from the question page, so I can find it later.
2. As a logged-in user, I can unbookmark a question from the feed, the question page, or my profile.
3. As a logged-in user, I can see all my saved questions in one place on my profile, newest saved first, and open any of them.
4. As a logged-in user, I see which questions are already saved as soon as the app loads, with no extra clicks.
5. As a user with nothing saved, I see a friendly empty state on my profile.
6. As an anonymous visitor, I am told I must log in to bookmark.
7. As any user, my saved set is private to me and never affects another user's.

## Existing code to reuse (what is already there and what is missing)

**Already there, reuse as is**
- `authenticate` middleware (`BE/src/middleware/authHandler.js`) sets `req.user = { id, isAdmin }`. Use it on every bookmark route.
- `createAppError` (`BE/src/utils/createAppError.js`) and `errorHandler` produce `{ success: false, message }`. Services throw, controllers have no try/catch (Express 5).
- The `{ success, message, data }` envelope and thin-controller pattern (`BE/src/controllers/questionController.js`).
- `getAllQuestionsService` (`BE/src/services/questionService.js:6`) shows the question list shape: `author` populated as `{ _id, name }`, `tags` populated, and `answerCount` attached via `Answer.countDocuments`. The saved list returns the same shape.
- `deleteQuestionService` already cascades to answers. Extend it for bookmarks.
- FE: `QuestionCard` and `QuestionList` render question lists (the only list-item components), `VoteButtons.jsx` is the pattern for an auth-guarded icon button inside a card with a `Link`, and `userSlice` provides `userInfo` and `logout`. Services take the token as an argument and thunks read it from `getState().user.userInfo`.
- FE test infra: MSW handlers (`FE/tests/mocks/handlers.js`) and mock data with owner and non-owner users (`user-1` Alice, `user-2` Bob).

**Missing, to be built**
- BE: a `Bookmark` model, service, controller and routes, mounted in `BE/src/routes/index.js`. Nothing for bookmarks exists today.
- BE: removal of bookmarks when a question is deleted; `Bookmark` added to `tests/setup.js` cleanup and the `populate-db.js` wipe.
- FE: `BOOKMARK_API` config, `bookmarkService`, `bookmarkSlice` (registered in `FE/src/store.js`), a `BookmarkButton`, the Saved Questions section in `Profile.jsx`, and app-load fetching in `App.jsx`.
- No existing public GET route knows who the caller is (`req.user` is only set by `authenticate`), so saved state is not embedded in question responses. The client fetches the user's saved ids separately.

## Acceptance criteria

Backend
- AC-B1: `POST /api/bookmarks` with a valid `questionId` and a valid token creates a bookmark for that user and returns 201.
- AC-B2: Saving an already saved question returns 200, creates no duplicate, and the saved set is unchanged.
- AC-B3: `DELETE /api/bookmarks/:questionId` removes the user's bookmark and returns 200. Deleting a bookmark that does not exist also returns 200 (idempotent).
- AC-B4: `GET /api/bookmarks/ids` returns the question ids the caller saved, newest saved first, and `[]` when none.
- AC-B5: `GET /api/bookmarks` returns the caller's saved questions, newest saved first, each with populated `author` (`_id`, `name`), populated `tags`, and `answerCount`. It returns `[]` (status 200, not 404) when none.
- AC-B6: All four routes return 401 without a valid token.
- AC-B7: Saves are per-user: user A's bookmarks never appear in user B's responses, and user B's delete does not affect user A's bookmark.
- AC-B8: Saving a non-existent question returns 404. A malformed `questionId` returns 400.
- AC-B9: Deleting a question removes all bookmarks that reference it, so it no longer appears in anyone's saved list or ids.
- AC-B10: At most one bookmark exists per (user, question), enforced by a unique index.

Frontend
- AC-F1: Every question in the home feed and tag-filtered view shows a bookmark icon (outline when unsaved, filled when saved).
- AC-F2: The question page shows the same bookmark icon for the question.
- AC-F3: Clicking the icon as a logged-in user toggles it immediately, without a page reload, and persists after a reload.
- AC-F4: If the server rejects the toggle, the icon reverts to its previous state and the user sees an error message.
- AC-F5: Clicking the icon does not navigate to the question (the card `Link` is not followed).
- AC-F6: An anonymous visitor who clicks the icon sees the alert "You must be logged in to bookmark a question." and no request is sent.
- AC-F7: After login, or on app load with a valid stored session, saved questions render the filled icon with no interaction.
- AC-F8: On logout, saved state is cleared; a different user who logs in on the same browser sees only their own saves.
- AC-F9: The profile page has a "Saved Questions" section listing the user's saved questions with the existing `QuestionList` UI, newest saved first, each with a working link to the question and a bookmark icon to unsave.
- AC-F10: Unsaving from the profile removes that question from the Saved list immediately.
- AC-F11: When nothing is saved, the profile section shows "No saved questions yet" (not the generic QuestionList empty text).
- AC-F12: Bookmarks cannot be added from answers; no bookmark control appears on answers.

## API contract

All routes are mounted under `/api/bookmarks`, are protected by `authenticate` (`Authorization: Bearer <token>`), and use the envelope `{ success, message, data }`. Errors use `{ success: false, message }` (plus `stack` in development).

| Method and path | Body | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/bookmarks` | `{ "questionId": "<ObjectId>" }` | 201 when newly saved, 200 when already saved. `data: { "questionId": "...", "bookmarked": true }` | 400 missing/invalid `questionId`; 401 no/invalid token; 404 "Question not found" |
| `DELETE /api/bookmarks/:questionId` | none | 200. `data: { "questionId": "...", "bookmarked": false }` | 400 invalid `questionId`; 401 |
| `GET /api/bookmarks/ids` | none | 200. `data: ["<questionId>", ...]` newest saved first, `[]` if none | 401 |
| `GET /api/bookmarks` | none | 200. `data: [ { ...question, author: { _id, name }, tags: [...], answerCount }, ... ]` newest saved first, `[]` if none | 401 |

Messages (suggested): "Question bookmarked successfully", "Bookmark removed successfully", "Bookmarks fetched successfully".
Auth errors come from the existing middleware: 401 "No token provided, authorization denied." and 401 "Token is not valid.".

## Data model changes

New model `Bookmark` (`BE/src/models/Bookmark.js`), collection `bookmarks`:

| Field | Type | Notes |
| --- | --- | --- |
| `user` | `ObjectId`, ref `User` | required |
| `question` | `ObjectId`, ref `Question` | required |
| `createdAt`, `updatedAt` | `Date` | from `timestamps: true`; `createdAt` drives "newest saved first" |

Indexes: unique compound index on `{ user: 1, question: 1 }`.
No changes to the `User` or `Question` schemas.

Other data-layer touch points: `deleteQuestionService` also deletes `Bookmark` documents for the question; `BE/tests/setup.js` cleans `Bookmark`; `BE/src/scripts/populate-db.js` wipes `Bookmark`.

## UI changes

**Endpoint config** (`FE/src/config/config.js`): add `BOOKMARK_API` with `GET_ALL: "/bookmarks"`, `GET_IDS: "/bookmarks/ids"`, `ADD: "/bookmarks"`, `REMOVE: (questionId) => "/bookmarks/" + questionId`.

**Service** (`FE/src/services/bookmarkService.js`): functions to fetch ids, fetch saved questions, add, and remove. Each takes `token` and returns `res.data.data`.

**Redux** (`FE/src/reducers/bookmarkSlice.js`, registered as `bookmark` in `FE/src/store.js`):
- State: `ids` (array of question id strings), `questions` (saved question objects), `loading`, `error`.
- Thunks: fetch ids, fetch saved questions, toggle bookmark. Toggle updates `ids` optimistically and rolls back if the request is rejected. Unsaving also removes the question from `questions`. Errors use `rejectWithValue(error.response?.data?.message || ...)`.
- Resets to the initial state on the user `logout` action.
- Selectors must default safely (`state.bookmark?.ids ?? []`) because existing test stores do not include this slice.

**Components**
- New `FE/src/components/Shared/BookmarkButton.jsx`: props include the question id. Reads `userInfo` and the saved ids, shows outline or filled icon, calls `preventDefault` and `stopPropagation`, alerts when anonymous (AC-F6), dispatches the toggle thunk, and alerts on failure (AC-F4).
- `QuestionCard.jsx`: render `BookmarkButton` in the stats column (covers the feed and the tag-filtered view because both use `QuestionList`).
- `QuestionContent.jsx`: render `BookmarkButton` for the question.
- `Profile.jsx`: add a Saved Questions card after the existing body card. It fetches saved questions on mount. If the list is empty it shows "No saved questions yet"; otherwise it renders `QuestionList` with the saved questions. It must not depend on `state.question` or the stats request.
- `App.jsx`: an effect that fetches saved ids when `userInfo?.token` is present (on load and after login).

**Routes**: no new frontend routes. The section lives on `/profile`.

## Edge cases and error handling

- **Anonymous:** the icon is visible but triggers the alert; no network call; saved state is empty.
- **Expired or invalid token:** the toggle request returns 401, the icon rolls back, and the error is shown. The ids fetch fails quietly (no saved icons).
- **Double click or rapid toggling:** the final server state matches the final icon; save and unsave are idempotent so repeats are safe.
- **Question deleted while saved:** its bookmarks are removed with it. If an orphan bookmark ever exists, `GET /api/bookmarks` skips it rather than failing.
- **Own questions:** users may bookmark their own questions.
- **Invalid ids:** a malformed `questionId` returns 400, not 500.
- **Empty states:** no saved questions returns `[]` with 200 (not 404, unlike `getAllQuestionsService`), and the profile shows the empty message.
- **Saved question that is later edited:** the saved list shows the current content (it is fetched live).
- **Multiple users in one browser:** logout clears the slice, so the next login never sees the previous user's saves.
- **Existing behavior:** votes, the AI features and the question-list sort and search are unchanged. The profile stats failure (`/auth/stats`) is pre-existing and not touched.

## Out of scope

- Bookmarking answers.
- Folders, tags, notes, sharing, or exporting saved questions.
- Embedding a per-user `bookmarked` flag in public question responses (would need optional-auth middleware).
- Bookmark counts shown on questions.
- Pagination of the saved list beyond what `QuestionList` already provides.
- Fixing the profile stats request.

## Test plan

Backend unit (Vitest, mocked models, mirrors `tests/unit/services`)
- `bookmarkService`: add creates and returns created vs existing; 404 when the question is missing; remove is idempotent; list ids and list questions sort newest first, return `[]` when empty, and skip orphans; per-user filtering by `user`.
- `bookmarkController`: calls services with `(userId, ...)`, returns the envelope and correct status codes (201 vs 200).
- `questionService.deleteQuestionService`: also deletes the question's bookmarks.

Backend integration (supertest against `src/app.js`, like `tests/integration/vote.test.js`)
- 401 on all four routes without a token.
- Save, list ids, list full questions (shape includes `author.name`, `tags`, `answerCount`), unsave.
- Duplicate save returns 200 with one stored document; unsave of a missing bookmark returns 200.
- Two users: isolation of lists and deletes.
- 404 for an unknown question, 400 for a malformed id.
- Deleting a question removes its bookmarks from other users' lists too.
- Empty list returns 200 and `[]`.

Frontend unit (Vitest, Testing Library; stores built with the real `bookmark` slice)
- `bookmarkSlice`: optimistic toggle, rollback on rejection, unsave removes from `questions`, reset on logout, safe defaults.
- `BookmarkButton`: outline vs filled, anonymous alert and no request, toggle dispatch, stops propagation, failure alert.
- `QuestionCard` and `QuestionContent`: render the bookmark control; existing tests keep passing with stores that lack the `bookmark` slice.
- `Profile`: Saved Questions section renders saved items, shows "No saved questions yet" when empty, and unsaving removes the item.

Frontend integration (store plus MSW, like `tests/integration/answerFlow.test.jsx`)
- Add MSW handlers for the four bookmark routes and bookmark data in `mockData.js`.
- Fetch ids, toggle on and off, saved list fetch, and a rejected toggle rolls back.

Manual verification (running app: backend on 3001, frontend on 5173)
- Log in; bookmark from the feed and the question page; reload and confirm icons stay filled; check Profile list order, unsave, and empty state; log out and in as another user and confirm a separate set; anonymous click shows the alert.
