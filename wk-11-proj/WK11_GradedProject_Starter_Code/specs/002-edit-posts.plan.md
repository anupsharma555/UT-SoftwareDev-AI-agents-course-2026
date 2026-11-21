# Plan: 002 Edit Posts

Spec: `specs/002-edit-posts.md`. Paths relative to this folder (`BE` = `devanswers-backend/`, `FE` = `devanswers-frontend/`). Update and validation endpoints already exist, so the backend work is tightening them.

## Order of work (bottom-up)

### Backend
1. **Models**: add `editedAt: { type: Date, default: null }` to `BE/src/models/Question.js` and `BE/src/models/Answer.js`.
2. **Question service** `BE/src/services/questionService.js` `updateQuestionService`:
   - Validate (400): trimmed non-blank `title` and `description`; `tags` must be a string with at least one non-empty tag after splitting on commas, trimming and de-duplicating; malformed id (400).
   - Author-only: drop `&& !loggedInUser.isAdmin` (403 "Not authorized to update this question").
   - Resolve tags to ids only after authorization and validation pass.
   - Compare new title, description and tag-id set with the stored values; set `editedAt: new Date()` in the `findByIdAndUpdate` payload only when something changed.
   - Return the question populated (`author` `{ _id, name }`, `tags`).
   - Keep the signature `(id, title, description, tags, loggedInUser)`.
3. **Answer service** `BE/src/services/answerService.js` `updateAnswerService`:
   - Validate trimmed non-blank `answerText` (400), malformed id (400).
   - Author-only: drop the admin clause.
   - Set `answer.editedAt = new Date()` only if the trimmed text changed, then `save()`; keep exactly one lookup plus the populated lookup.
   - Keep the signature `(answerId, answerText, loggedInUser)`.
4. **Controllers and routes**: no changes (signatures and envelopes stay).
5. **Backend tests**:
   - Update `BE/tests/unit/services/questionService.test.js` (populate mock for the update result, new validation, author-only, `editedAt`) and `answerService.test.js`.
   - Update `BE/tests/integration/questions.test.js` and `answers.test.js`: change the two "admin can update any" tests to expect 403 and unchanged content; add 400 cases, unchanged-save, `editedAt` set/null, vote does not change `editedAt`, no stray `Tag` on rejected edits.

### Frontend
6. **Services**: add `updateQuestion(id, data, token)` to `FE/src/services/questionService.js` and `updateAnswer(answerId, answerText, token)` to `FE/src/services/answerService.js`, using the existing `QUESTION_API.UPDATE` and `ANSWER_API.UPDATE`.
7. **Slice** `FE/src/reducers/questionSlice.js`: thunks `updateQuestion` and `updateAnswer` (no `loading` changes). `updateQuestion.fulfilled` merges title, description, tags and `editedAt` into `currentQuestion` (keep `answers`) and the matching `questions` entry. `updateAnswer.fulfilled` replaces the answer by `_id` in `currentQuestion.answers`.
8. **Component** `FE/src/components/Shared/EditedBadge.jsx` (new): renders "(edited)" with a date tooltip from `FE/src/utils/timeFormat.js`; renders nothing when `editedAt` is falsy.
9. **Wire-up**:
   - `FE/src/components/Question/QuestionContent.jsx`: owner check, pencil control, pre-filled inline form (title, description, comma-separated tag names), Save/Cancel, client-side blank validation, error display, `EditedBadge`.
   - `FE/src/components/Answer/AnswerList.jsx`: per-answer `editingId`, pencil for the author, inline textarea form, validation, error display, `EditedBadge`.
10. **Frontend tests**:
    - `FE/tests/mocks/handlers.js` and `mockData.js`: PUT handlers (success, 400, 403) and `editedAt` on some items.
    - Update: `QuestionContent`, `AnswerList`, `questionDetail`, `QuestionCard` (regression: no pencil/label), `questionSlice` tests.
    - New: `tests/unit/components/EditedBadge.test.jsx`, `tests/integration/editFlow.test.jsx`.

## Verification
- `cd devanswers-backend && npm test`; `cd devanswers-frontend && npm test && npm run lint`.
- Manual per the spec (author edits, no pencil elsewhere, 403 for others, blank blocked, edited label).

## Checklist
- [x] editedAt on Question and Answer
- [x] updateQuestionService (validation, author-only, editedAt, populated)
- [x] updateAnswerService (validation, author-only, editedAt)
- [x] backend unit tests updated and added
- [x] backend integration tests updated (admin tests now 403) and added
- [x] FE update services
- [x] updateQuestion and updateAnswer thunks and reducers
- [x] EditedBadge
- [x] QuestionContent edit UI
- [x] AnswerList edit UI
- [x] frontend tests and MSW handlers
- [x] full test suites pass
