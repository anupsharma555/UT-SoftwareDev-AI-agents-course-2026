# Epic: Content Discovery & Engagement

Five independent, full-stack features that deepen how users **find** content (discovery) and **come back to / interact with** it (engagement), designed to fit ThreadHive's existing architecture.

## Architectural constraints every feature honors

These come from the current codebase (`CLAUDE.md`) and apply to all five proposals — they are not repeated per feature:

- **Backend layering:** `routes/ → controllers/ → services/ → models/`. New resources add one file per layer. Controllers validate `req` and shape the response; services hold all Mongoose logic.
- **Errors:** `throw createAppError(message, statusCode)` — no try/catch in controllers (Express 5 auto-forwards rejections to `errorHandler`).
- **Response envelope:** every success returns `{ success, message, data }`; the frontend unwraps `res.data.data`.
- **Auth:** routes attach `authHandler`; the actor is read from `req.user.userId`, never the body.
- **Frontend data flow:** component → `createAsyncThunk` (slice) → `*Service.js` → `axiosInstance` + endpoint constant in `apiConfig.js`; failures go through `handleApiError`; the JWT is attached via `getAuthHeaders()` (Bearer from localStorage).
- **Tests:** each backend resource gets an integration test (`import '../setup.js'`, in-memory Mongo, supertest) + unit tests for controller/service; AI-touching code mocks `src/utils/aiProvider.js` with `vi.mock`. Frontend adds MSW handlers in `tests/mocks/handlers.js` + component/slice tests.

## Summary

| # | Feature | Bucket | New backend resource? | Schema change | Complexity |
|---|---------|--------|----------------------|---------------|------------|
| 1 | Bookmarks (Saved Threads) | Engagement | Yes — `bookmark` | New `Bookmark` collection (Thread untouched) | **M** |
| 2 | Follow Communities + Personalized Feed | Discovery + Engagement | Yes — `subscription` | New `Subscription` collection (Subreddit untouched) | **L** |
| 3 | Full-text Thread Search | Discovery | Yes — `search` (read-only) | Text index on `Thread` | **M** |
| 4 | Threaded (nested) Comment Replies | Engagement | No — extends `comment` | `parentComment` field on `Comment` | **M** |
| 5 | AI "Related Threads" / More-like-this | Discovery | No — extends `thread` | Text index on `Thread` (shared with #3) | **M** |

Complexity key: **S** ≈ 1–2 days, **M** ≈ 2–4 days, **L** ≈ 4–7 days, including tests.

Each feature deliberately introduces **mostly new files** so they can be built on parallel branches/worktrees. The unavoidable overlaps are flagged in [File Overlap & Conflicts](#file-overlap--conflicts).

---

## 1. Bookmarks (Saved Threads)

**Value proposition:** Let a logged-in user save any thread and revisit their saved list later from a "Saved" tab on their profile.

**Data-model changes:** New `Bookmark` collection — `{ user: ObjectId→User, thread: ObjectId→Thread }` with `timestamps` and a **compound unique index `{ user, thread }`** (prevents duplicate saves; `createdAt` gives "recently saved" ordering).
- *Chosen over* a `bookmarkedBy: [ObjectId]` array on `Thread` (which would mirror the `upvotedBy`/`downvotedBy` voting pattern) specifically so this feature **does not touch `Thread.js`**, keeping it independent of features #3 and #5.

**Endpoints** (new `models/Bookmark.js`, `services/bookmarkService.js`, `controllers/bookmarkController.js`, `routes/bookmarks.js`; mounted in `app.js`). Toggle routes follow the vote-route convention (mounted at `/api`):
- `POST   /api/threads/:id/bookmark` — save (idempotent; ignores duplicates like `voteHandler` does).
- `DELETE /api/threads/:id/bookmark` — unsave.
- `GET    /api/bookmarks` — current user's saved threads, `.populate('thread')`, newest-saved first.

**Frontend touch points:**
- New `reducers/bookmarkSlice.js` + `services/bookmarkService.js`; register slice in `store/store.js`; add `BOOKMARK_API` to `config/apiConfig.js`.
- Bookmark toggle button on `components/ThreadList/ThreadCard.jsx` (there's already a `bi-bookmark` icon used decoratively for the subreddit badge — use a filled/outline toggle).
- "Saved" section/tab on `pages/User/Profile.jsx`.
- Optional "🔖 Saved" link in `components/Sidebar/Sidebar.jsx`.

**Complexity: M.** One new collection + toggle/list endpoints + slice + two UI touch points.

---

## 2. Follow Communities + Personalized Feed

**Value proposition:** Users subscribe to subreddits and get a "My Feed" showing only threads from communities they follow, plus a "My Communities" shortcut list.

**Data-model changes:** New `Subscription` collection — `{ user: ObjectId→User, subreddit: ObjectId→Subreddit }` with `timestamps` and a **compound unique index `{ user, subreddit }`**. Keeps `Subreddit.js` untouched (independence).

**Endpoints** (new `subscription` resource: model/service/controller/route, mounted in `app.js`):
- `POST   /api/subreddits/:id/subscribe` — follow (idempotent).
- `DELETE /api/subreddits/:id/subscribe` — unfollow.
- `GET    /api/subscriptions` — the user's followed subreddits.
- `GET    /api/feed` — threads where `subreddit ∈ user's subscriptions`, `.populate('author','subreddit')`, sorted `createdAt: -1` (mirrors `fetchAllThreads`). Lives in the subscription service so it doesn't touch the thread module.

**Frontend touch points:**
- New `reducers/subscriptionSlice.js` + `services/subscriptionService.js`; register in `store/store.js`; add `SUBSCRIPTION_API`/`FEED_API` to `config/apiConfig.js`.
- Subscribe/unsubscribe button in `components/RightSidebar/RightSidebar.jsx` (the "Hot Communities" cards) and on the subreddit header inside `pages/User/Home.jsx`.
- "My Communities" + "My Feed" entries in `components/Sidebar/Sidebar.jsx`.
- A feed mode in `pages/User/Home.jsx` (e.g. `?feed=mine`) reusing `ThreadList`.

**Complexity: L.** Two toggle endpoints + a personalized feed query + subscribe UI in two places + feed mode wiring.

---

## 3. Full-text Thread Search

**Value proposition:** A header search bar that finds threads by keyword across titles and content.

**Data-model changes:** Add a **Mongo text index** to `Thread` on `{ title, content }` (`ThreadSchema.index({ title: 'text', content: 'text' })`). No new fields, no new collection.

**Endpoints** (new read-only `search` module — `services/searchService.js`, `controllers/searchController.js`, `routes/search.js`, mounted at `/api/search`). Kept as its own module **on purpose** so it doesn't edit `threadController`/`threadService`/`routes/threads.js`:
- `GET /api/search/threads?q=<query>` — `Thread.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })`, populated with author + subreddit, sorted by text score. Returns `[]` for blank/no-match (not a 404).

**Frontend touch points:**
- New `pages/Search/SearchResults.jsx` (reuses `ThreadList`/`ThreadCard` read-only — no edits to those) + new `reducers/searchSlice.js` + `services/searchService.js`; register slice in `store/store.js`; add `SEARCH_API` to `config/apiConfig.js`.
- Search input added to `components/Header/Header.jsx` (navigates to `/search?q=…`).
- New `/search` route in `App.jsx` (wrapped in `PrivateRoute` to match the protected-pages pattern).

**Complexity: M.** Single query endpoint + index; most effort is the search bar UX and results page.

---

## 4. Threaded (Nested) Comment Replies

**Value proposition:** Users reply directly to a comment, turning flat comment lists into readable conversation threads.

**Data-model changes:** Add `parentComment: { type: ObjectId, ref: 'Comment', default: null }` to `Comment`. Top-level comments keep `null`. No new collection.

**Endpoints** (extends the existing `comment` module — **no new route file**):
- `POST /api/comments` — extend `createComment` to accept an optional `parentComment` from the body and persist it.
- `GET /api/comments/thread/:threadId` — unchanged; already returns all comments for a thread. The client assembles the tree from `parentComment` (keeps the API flat and cheap). *(Optional later: server-side nesting if depth grows.)*

**Frontend touch points:**
- `components/Comment/CommentList.jsx` — build/render the parent→children tree (recursive component with indentation).
- `components/Comment/CommentForm.jsx` — a "Reply" affordance per comment that sets `parentComment`.
- `reducers/commentSlice.js` — thread the optional `parentComment` through the create thunk.

**Complexity: M.** Schema is trivial; the work is recursive rendering, reply-state management, and indentation/UX. **Fully self-contained in the comment module — zero overlap with features 1, 2, 3, 5.**

---

## 5. AI "Related Threads" (More like this)

**Value proposition:** On a thread page, surface a short list of related threads so readers keep discovering relevant content — reusing the app's existing GenAI infrastructure.

**Data-model changes:** Relies on the **same `Thread` text index as #3** (none added if #3 ships first). No new fields/collections.

**Endpoints** (extends the `thread` module):
- `GET /api/threads/:id/related` — finds candidates via the text index (`$text` search seeded from the thread's title/keywords, excluding itself, limited to ~5). Optionally re-ranks/labels via the existing `generateAIContent(prompt)` in `src/utils/aiProvider.js` (keep all provider calls behind that single function — do not add provider SDK calls elsewhere). Adds `getRelatedThreadsService` to `threadService.js`, `getRelatedThreads` to `threadController.js`, and a route in `routes/threads.js`.

**Frontend touch points:**
- New `components/ThreadList/RelatedThreads.jsx` card rendered on `pages/User/ThreadPage.jsx`.
- `services/threadService.js` — add `getRelated(threadId)`; `config/apiConfig.js` — add `THREAD_API.RELATED`. Optionally a `relatedThreads` field on `selectedThreadSlice.js` (or local component state, like the existing summary handling in `ThreadCard`).

**Complexity: M.** S/M if keyword-only; M with the optional AI re-rank. Tests must mock `aiProvider` (as the existing thread integration tests already do).

---

## File Overlap & Conflicts

Two kinds of overlap exist. **True conflicts** mean two features edit the same logic and must be coordinated; **additive registration points** are append-only files (slice registry, endpoint map, route mounts) that several features touch but rarely conflict beyond a merge.

### True conflicts (coordinate / sequence these)

| Files | Features | Why & mitigation |
|-------|----------|------------------|
| `models/Thread.js` — text index | **#3 Search** & **#5 Related** | Both need `ThreadSchema.index({ title, content }, 'text')`. **Add it once** (ideally with #3) and have #5 reuse it. Building #5 alone still requires adding the index. |
| `components/Sidebar/Sidebar.jsx` | **#1 Bookmarks** & **#2 Follow** | Both insert new nav entries ("Saved" vs "My Communities/My Feed") into the same `ListGroup`. Trivial but a literal merge conflict if branched in parallel — land one, rebase the other. |

### Additive registration points (touched by many; low risk)

| File | Touched by | Note |
|------|-----------|------|
| `store/store.js` | #1, #2, #3 (+#5 if it adds a slice) | Each appends one reducer key. Append-only. |
| `config/apiConfig.js` | #1, #2, #3, #5 | Each adds an `*_API` constant block. Append-only. |
| `src/app.js` (backend) | #1, #2, #3 | Each adds one `app.use(...)` route mount. Append-only. |
| `App.jsx` (routes) | #3 | Adds the `/search` route; no other feature edits routing. |

### Conflict-free by design

- **#4 Threaded comments** touches only the comment module (`Comment.js`, `commentService.js`, `commentController.js`, `CommentList.jsx`, `CommentForm.jsx`, `commentSlice.js`) — **no overlap with any other feature**.
- `ThreadCard.jsx` → only #1 · `Profile.jsx` → only #1 · `RightSidebar.jsx` / `Home.jsx` → only #2 · `Header.jsx` → only #3 · `ThreadPage.jsx` → only #5. None of these UI files is shared between features.

## Suggested build order

1. **#4 Threaded comments** — fully isolated; safe to build anytime, in parallel with anything.
2. **#3 Search** — establishes the `Thread` text index that #5 reuses.
3. **#5 Related** — after #3, reuses the index (or adds it if #3 is skipped).
4. **#1 Bookmarks** and **#2 Follow** — independent new resources; if run in parallel, coordinate the single `Sidebar.jsx` edit and rebase the append-only registry files.
