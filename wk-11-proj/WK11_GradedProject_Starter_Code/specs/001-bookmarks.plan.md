# Plan: 001 Bookmarks

Spec: `specs/001-bookmarks.md`. Paths relative to this folder (`BE` = `devanswers-backend/`, `FE` = `devanswers-frontend/`). Tests are written before or alongside the code they cover.

## Order of work (bottom-up)

### Backend
1. **Model** `BE/src/models/Bookmark.js` (new): `{ user: ObjectId ref User, question: ObjectId ref Question }` (both required), `timestamps: true`, unique compound index on `{ user: 1, question: 1 }`.
2. **Service** `BE/src/services/bookmarkService.js` (new). Functions:
   - `addBookmarkService(userId, questionId)`: validate id with `mongoose.isValidObjectId` (400), `Question.exists` (404 "Question not found"), upsert so repeats do not duplicate; return `{ created }` so the controller picks 201 vs 200.
   - `removeBookmarkService(userId, questionId)`: validate id (400); `deleteOne`; idempotent.
   - `getBookmarkedIdsService(userId)`: bookmarks sorted by `createdAt` desc, map to id strings.
   - `getBookmarkedQuestionsService(userId)`: bookmarks sorted newest first, populate question (with author `name`, tags), skip orphans, attach `answerCount` like `getAllQuestionsService`; return `[]` when none.
3. **Controller** `BE/src/controllers/bookmarkController.js` (new): `addBookmark`, `removeBookmark`, `getBookmarkIds`, `getBookmarks`. Thin, envelope `{ success, message, data }`, `req.user.id`.
4. **Route** `BE/src/routes/bookmarks.js` (new): `GET /`, `GET /ids`, `POST /`, `DELETE /:questionId`, all behind `authenticate`. Mount in `BE/src/routes/index.js` at `/bookmarks`.
5. **Cascade** `BE/src/services/questionService.js` `deleteQuestionService`: also `Bookmark.deleteMany({ question: id })`.
6. **Test and seed plumbing**: add `Bookmark` to cleanup in `BE/tests/setup.js` and to the wipe in `BE/src/scripts/populate-db.js`; import it in `BE/src/app.js` with the other models.
7. **Backend tests**:
   - `BE/tests/unit/services/bookmarkService.test.js`, `BE/tests/unit/controllers/bookmarkController.test.js` (mocked models).
   - `BE/tests/integration/bookmarks.test.js` (supertest): 401s, save/list/unsave, duplicate save, per-user isolation, 404/400, cascade on question delete, empty list.
   - Add a cascade case to the delete-question tests.

### Frontend
8. **Config** `FE/src/config/config.js`: add `BOOKMARK_API` (`GET_ALL`, `GET_IDS`, `ADD`, `REMOVE(questionId)`).
9. **Service** `FE/src/services/bookmarkService.js` (new): fetch ids, fetch questions, add, remove. Token argument, return `res.data.data`.
10. **Slice** `FE/src/reducers/bookmarkSlice.js` (new): state `{ ids, questions, loading, error }`; thunks `fetchBookmarkIds`, `fetchBookmarkedQuestions`, `toggleBookmark`; optimistic update with rollback via `pending`/`rejected`; unsave removes from `questions`; reset on `logout` (import `logout` from `userSlice`). Register as `bookmark` in `FE/src/store.js`.
11. **Component** `FE/src/components/Shared/BookmarkButton.jsx` (new): reads `userInfo` and `state.bookmark?.ids ?? []`; outline vs filled icon; anonymous alert "You must be logged in to bookmark a question."; `preventDefault`/`stopPropagation`; failure alert.
12. **Wire-up**:
    - `FE/src/components/Question/QuestionCard.jsx`: add `BookmarkButton` in the stats column.
    - `FE/src/components/Question/QuestionContent.jsx`: add `BookmarkButton`.
    - `FE/src/pages/Profile/Profile.jsx`: Saved Questions card; fetch on mount; custom empty state "No saved questions yet"; else `QuestionList`. Use `?.` access so stores without the slice do not crash.
    - `FE/src/App.jsx`: `useEffect` dispatching `fetchBookmarkIds` when `userInfo?.token` is set.
13. **Frontend tests**:
    - `FE/tests/mocks/handlers.js` and `mockData.js`: bookmark handlers and data.
    - New: `tests/unit/reducers/bookmarkSlice.test.jsx`, `tests/unit/components/BookmarkButton.test.jsx`, `tests/integration/bookmarkFlow.test.jsx`.
    - Update: `QuestionCard`, `QuestionContent`, `profile` tests.

## Verification
- `cd devanswers-backend && npm test`; `cd devanswers-frontend && npm test && npm run lint`.
- Manual per the spec (feed, question page, reload, profile list/empty/unsave, second user, anonymous alert).

## Checklist
- [x] Bookmark model
- [x] bookmarkService
- [x] bookmarkController
- [x] bookmarks routes and mount
- [x] deleteQuestionService cascade
- [x] tests/setup.js, populate-db.js, app.js updates
- [x] backend unit and integration tests
- [x] BOOKMARK_API config
- [x] bookmarkService (FE)
- [x] bookmarkSlice and store registration
- [x] BookmarkButton
- [x] QuestionCard, QuestionContent, Profile, App wiring
- [x] frontend tests and MSW handlers
- [x] full test suites pass
