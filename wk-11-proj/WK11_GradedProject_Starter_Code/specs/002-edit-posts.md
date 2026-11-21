# 002: Edit Posts

Status: Implemented
Paths are relative to the project root, the `WK11_GradedProject_Starter_Code/` folder (`BE` = `devanswers-backend/`, `FE` = `devanswers-frontend/`).

## Problem / motivation

Authors cannot fix typos, clarify a question, or improve an answer after posting. The backend already exposes update endpoints, but there is no way to use them from the UI. Their authorization is too loose for this project (admins can edit anyone's post), they accept blank content, and nothing records that a post was changed. This feature lets the author edit their own questions and answers on the question page and shows an accurate "edited" indicator.

## User stories

1. As the author of a question, I can edit its title, description and tags from the question page.
2. As the author of an answer, I can edit its text from the question page.
3. As an author, my edit form is pre-filled with the current content, and I can cancel to discard my changes.
4. As an author, I cannot save blank content.
5. As any user, I only see an edit control on posts I wrote, and the server rejects edits from anyone else.
6. As a reader, I see an "edited" indicator on posts that were changed, and not on posts that never were.

## Existing code to reuse (what is already there and what is missing)

**Already there, reuse as is**
- `PUT /api/questions/:id` and `PUT /api/answers/:answerId`, both behind `authenticate` (`BE/src/routes/questions.js`, `answers.js`), with `updateQuestion` / `updateAnswer` controllers and `updateQuestionService` / `updateAnswerService`. They already return 404 for a missing post and 403 for a non-author.
- Question tag handling: the update service resolves a comma-separated `tags` string into `Tag` ids, creating tags that do not exist.
- `createAppError` and the `{ success, message, data }` envelope.
- FE: `QUESTION_API.UPDATE(id)` and `ANSWER_API.UPDATE(answerId)` already exist in `FE/src/config/config.js`. The ownership check pattern is `author._id === userInfo.userId` (`VoteButtons.jsx`). `FE/src/utils/timeFormat.js` is available for the date tooltip.
- `GET /api/questions/:id` already returns the question with its answers embedded, so new schema fields reach the UI without route changes.
- FE mock data already has owner and non-owner cases (`user-1` Alice authors question-1, question-3 and answer-2; `user-2` Bob authors question-2 and answer-1).

**Missing, to be built**
- BE: author-only enforcement (the services currently also allow admins via `!loggedInUser.isAdmin`).
- BE: input validation (blank title, description or answer text; invalid or empty tags). Today a missing `tags` throws a `TypeError` (500), and `findByIdAndUpdate` skips Mongoose validators, so blank values save.
- BE: the `editedAt` field and logic to set it only when content actually changed.
- BE: the question update response is not populated (author and tags come back as raw ids and there are no answers), so the UI could not update the page from it. The response must return the populated shape.
- FE: update service functions, `updateQuestion` / `updateAnswer` thunks, the edit UI, the edited badge, and MSW handlers.

## Acceptance criteria

Backend
- AC-B1: The author can update their own question with a valid `title`, `description` and `tags`. The response is 200 and contains the new values.
- AC-B2: The author can update their own answer with valid `answerText`. The response is 200 and contains the new text.
- AC-B3: A user who is not the author gets 403 on both endpoints, including users with `isAdmin: true`. The post is unchanged.
- AC-B4: 401 without a valid token, 404 for an unknown post id, 400 for a malformed id.
- AC-B5: A blank or whitespace-only `title`, `description` or `answerText` returns 400 and the post is unchanged.
- AC-B6: `tags` that are missing, not a string, or contain no non-empty tag after trimming return 400 and the post is unchanged. The update never returns 500 for bad input.
- AC-B7: Empty segments in `tags` (for example `"a,,b"`) are ignored and duplicates are removed. No `Tag` with an empty name is ever created.
- AC-B8: After a successful edit that changed content, `editedAt` is set to the time of the edit and returned. A post that has never been edited has `editedAt: null`.
- AC-B9: If the submitted values equal the stored values (after trimming; tags compared as a set), the response is 200, the content is unchanged, and `editedAt` is not set or changed.
- AC-B10: Votes, views and reads never change `editedAt`.
- AC-B11: The question update response returns the question with `author` populated as `{ _id, name }` and `tags` populated, matching the shape of `GET /api/questions/:id` (without answers).
- AC-B12: Rejected edits (400, 403, 404) never create `Tag` documents or change `editedAt`.

Frontend
- AC-F1: The edit control (pencil icon) for a question appears only on the question page, and only when `question.author._id === userInfo.userId`.
- AC-F2: The edit control for an answer appears only on the question page, only next to answers the logged-in user authored.
- AC-F3: No edit control appears on the home feed, the tag-filtered view, the profile, or any other list view, and none appears for anonymous users or non-authors.
- AC-F4: Activating the control shows an inline form pre-filled with the current values (question: title, description, tags as a comma-separated string of tag names; answer: text).
- AC-F5: Cancel closes the form and discards all changes.
- AC-F6: Save is blocked, with a visible message, when the title, description or answer text is blank or whitespace-only, or when no tag is entered for a question. No request is sent.
- AC-F7: A successful save closes the form and the updated content shows immediately on the page, without a reload, and persists after a reload.
- AC-F8: A question edit keeps the answers, vote counts and author already on the page.
- AC-F9: A failed save keeps the form open with the user's input and shows the server message (for example 403 or 400). It does not show the full-page loading spinner.
- AC-F10: A post with `editedAt` set shows an "(edited)" label, with a tooltip containing the edit date and time. A post with `editedAt` null shows no label.
- AC-F11: The edited label appears only on the question page (question and answers), never on list cards.
- AC-F12: Editing one answer does not affect the display or edit state of other answers.

## API contract

Existing routes, tightened. Both are protected by `authenticate` and use the envelope `{ success, message, data }`.

**`PUT /api/questions/:id`**
- Request body: `{ "title": string, "description": string, "tags": string }` where `tags` is comma-separated (for example `"react, redux"`). All three are required.
- 200: `message: "Question updated successfully"`, `data` is the updated question: `{ _id, title, description, tags: [{ _id, name }], author: { _id, name }, upvotes, downvotes, voteCount, views, editedAt, createdAt, updatedAt }`.
- 400: `"Title is required"`, `"Description is required"`, `"At least one tag is required"`, or a malformed id message.
- 401: no or invalid token (existing middleware messages).
- 403: `"Not authorized to update this question"` (anyone who is not the author, including admins).
- 404: `"Question not found"`.

**`PUT /api/answers/:answerId`**
- Request body: `{ "answerText": string }` (required).
- 200: `message: "Answer updated successfully"` (existing message kept), `data` is the answer with `author: { _id, name }` and `editedAt`.
- 400: `"Answer text is required"` or a malformed id message.
- 401: as above.
- 403: `"Not authorized to update this answer"`.
- 404: `"Answer not found"`.

Unchanged: the controller call signatures (`updateQuestionService(id, title, description, tags, req.user)` and `updateAnswerService(answerId, answerText, req.user)`). No new routes.

Read routes (`GET /api/questions`, `GET /api/questions/:id`, `GET /api/tags/:tagId/questions`) return `editedAt` as part of the documents with no code change.

## Data model changes

`Question` (`BE/src/models/Question.js`) and `Answer` (`BE/src/models/Answer.js`), each gets one new field:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `editedAt` | `Date` | `null` | Set only by the update services when content changed |

No other schema changes. `updatedAt` is deliberately not used as the edited signal, because votes and views also modify it. Existing documents have no `editedAt` and are treated as never edited.

## UI changes

**Endpoint config**: no change (`QUESTION_API.UPDATE` and `ANSWER_API.UPDATE` exist).

**Services**
- `FE/src/services/questionService.js`: add an update-question function taking `(id, { title, description, tags }, token)`.
- `FE/src/services/answerService.js`: add an update-answer function taking `(answerId, answerText, token)`.
- Both send `Authorization: Bearer <token>` and return `res.data.data`.

**Redux** (`FE/src/reducers/questionSlice.js`)
- Thunks `updateQuestion` and `updateAnswer`, following the existing `rejectWithValue(error.response?.data?.message || ...)` pattern.
- `updateQuestion.fulfilled`: merge the returned fields (title, description, tags, editedAt) into `currentQuestion`, keeping its `answers`, and update the matching entry in `questions`.
- `updateAnswer.fulfilled`: replace the matching answer in `currentQuestion.answers` by `_id`.
- Neither thunk sets `state.loading`, because `QuestionDetail` shows a full-page spinner whenever it is true. Failures are surfaced to the form through the rejected action (the caller unwraps it).

**Components**
- `FE/src/components/Question/QuestionContent.jsx`: read `userInfo`; show a pencil control in the title row for the author. Editing swaps the title, description and tags for a pre-filled form (title, description, comma-separated tags) with Save and Cancel and inline validation messages. Show the edited label when `editedAt` is set.
- `FE/src/components/Answer/AnswerList.jsx`: per-answer edit state (editing id, or an extracted answer item component). A pencil control in the answer meta row for the author; an inline textarea form with Save and Cancel; the edited label when `editedAt` is set.
- A small shared edited label (for example `FE/src/components/Shared/EditedBadge.jsx`) rendering "(edited)" with a date tooltip from `FE/src/utils/timeFormat.js`, rendered nothing when `editedAt` is falsy.
- `QuestionCard.jsx` and all list views: no change (no pencil, no label).

**Routes**: none.

## Edge cases and error handling

- **Authorization:** enforced on the server by comparing `post.author` with `req.user.id` (as strings). The UI check is only a convenience. Admins have no edit rights over other users' posts. Deleting is unchanged and out of scope.
- **Anonymous users:** no edit controls; direct API calls return 401.
- **Expired or invalid token while saving:** the API returns 401, the form stays open with the message, and the input is preserved.
- **Blank and whitespace input:** rejected on the client and the server. Title and description and answer text are stored trimmed.
- **Tags:** comma-separated, trimmed, empty segments dropped, duplicates removed, at least one required. New tag names create `Tag` documents only on a valid, authorized edit.
- **Unchanged save:** returns 200, does not set `editedAt` (AC-B9). The form closes without showing the edited label.
- **Concurrent edits:** last write wins. No versioning.
- **Post deleted while editing:** the save returns 404 and the form shows the message.
- **Votes while editing:** voting does not interrupt the edit form or change `editedAt`.
- **Older posts without `editedAt`:** treated as never edited, with no migration.
- **Existing flows:** votes, answers, the AI features and the question list are unchanged. The pre-existing profile stats failure is not touched.

## Out of scope

- Deleting questions or answers.
- Edit history, revision diffs, or reverting.
- Admin or moderator editing of other users' posts.
- Editing from any list view or the profile page.
- Notifying other users of edits.
- Optimistic concurrency or conflict detection.

## Test plan

Backend unit (Vitest, mocked models)
- `updateQuestionService`: author succeeds and `editedAt` is set when content changed; a non-author (including an admin) gets 403; 404 for a missing question; 400 for blank title, blank description, non-string tags, and empty tags; empty segments and duplicate tags are normalized; unchanged content does not set `editedAt` and creates no tags; the returned question is populated.
- `updateAnswerService`: author succeeds and sets `editedAt`; a non-author (including an admin) gets 403; 404; 400 for blank text; unchanged text does not set `editedAt`.
- Controllers: keep the existing assertions on service call arguments and response envelopes.
- Existing unit tests to adjust: the question update test mocks `findByIdAndUpdate` with `mockResolvedValue`, so the new populate step needs its mock updated; the answer update test expects one lookup plus one populated lookup, so keep that call count.

Backend integration (supertest against `src/app.js`)
- Author edits a question and an answer (200, new values, `editedAt` set); a never-edited post has `editedAt: null`.
- Another user gets 403 on both; an admin user gets 403 on both. Change the existing tests "should allow an admin to update any question" (`tests/integration/questions.test.js`) and "should allow an admin to update any answer" (`tests/integration/answers.test.js`) to expect 403 and unchanged content.
- 401, 404, and 400 cases (blank fields, missing and empty tags, malformed id), with the DB unchanged after each rejection and no stray `Tag` created.
- Unchanged save leaves `editedAt` null; voting an edited post leaves `editedAt` unchanged.
- `GET /api/questions/:id` returns `editedAt` for the question and its answers.

Frontend unit (Vitest, Testing Library)
- `QuestionContent`: pencil shown only to the author and hidden for non-authors and anonymous users; form pre-filled; Cancel discards; blank title, description or tags blocked with no request; successful save updates the text; edited label shown only when `editedAt` is set.
- `AnswerList`: pencil only on the author's answers; per-answer form pre-filled; Cancel; blank blocked; editing one answer leaves others alone; edited label.
- `EditedBadge`: renders nothing without `editedAt`; shows label and tooltip date with it.
- `QuestionCard` and list views: no pencil and no edited label (regression).
- `questionSlice`: `updateQuestion` and `updateAnswer` fulfilled reducers patch `currentQuestion` (keeping answers) and the list entry, do not toggle `loading`, and rejected actions carry the server message.

Frontend integration (store plus MSW, like `tests/integration/answerFlow.test.jsx`)
- Add MSW handlers for `PUT /questions/:id` and `PUT /answers/:answerId` (success, 400, 403) and add `editedAt` values to some entries in `mockData.js`, keeping owner and non-owner cases.
- Dispatch update thunks and assert state changes; a 403 leaves state unchanged and carries the message.

Manual verification (backend on 3001, frontend on 5173)
- As the author, edit a question (title, description, tags) and an answer; confirm updates appear without reload, persist after reload, and the "(edited)" label with a date tooltip appears.
- Confirm a never-edited post has no label, and an unchanged save adds none.
- Confirm no pencil on the home feed, the profile, other users' posts, or when logged out.
- Using a second account or a direct API call, confirm editing someone else's post returns 403.
- Try blank title, description, answer text and empty tags, and confirm they are blocked.
