# Spec 002 — Thread Search

**Status:** Draft
**Epic:** Content Discovery & Engagement (`docs/epic-discover-engage.md`, feature #3)

## Problem / motivation

ThreadHive has no way to find a thread by what it's about. The only navigation paths are the chronological/most-upvoted home feed (client-paginated) and browsing a single subreddit. As content grows, users can't relocate a thread they remember or discover existing discussions on a topic before posting a duplicate.

This feature adds a **header search bar** that performs a **case-insensitive substring search over thread titles and content** and shows matches on a dedicated `/search` results page (reusing the existing thread list UI). It is read-only and changes no existing data.

## User stories

1. As a logged-in user, I can type a query in the header search bar and press Enter (or click the search button) to see threads whose **title or content** contains my query.
2. As a logged-in user, matching is **case-insensitive** and **partial** — typing `ook` finds a thread titled "Bookmarks".
3. As a logged-in user, I land on a `/search?q=…` page whose URL I can **share or reload** to re-run the same search.
4. As a logged-in user, I can **click a result** to open that thread (`/thread/:id`), exactly as from the feed.
5. As a logged-in user, when nothing matches I see a clear **"no results"** message rather than an empty/broken page.

## Acceptance criteria

Each criterion is independently testable.

1. **Title match:** `GET /api/search/threads?q=<word>` returns threads whose `title` contains `<word>` (case-insensitive), `200`.
2. **Content match:** the same endpoint returns threads whose `content` contains the query even when the title does not.
3. **Case-insensitive:** `q=FOO` and `q=foo` return the same matches.
4. **Substring/partial:** `q=ook` matches a thread titled "Bookmarks".
5. **Regex-safe:** a query containing regex metacharacters (e.g. `c++`, `(test)`, `.*`) is matched **literally** — it does not error and does not behave as a wildcard.
6. **No matches:** a query that matches nothing returns `200` with `data: []`.
7. **Blank/missing query:** an empty/whitespace `q`, or no `q` param at all, returns `200` with `data: []` (not an error, not "all threads").
8. **Auth required:** the endpoint returns `401` without a valid Bearer token.
9. **Populated results:** each returned thread is populated with `author` (name) and `subreddit` (name) so the result card renders like a feed card.
10. **Ordering:** results are returned newest-first (`createdAt` descending).
11. **Result cap:** the endpoint returns at most 50 threads for any single query.
12. **Header → page:** submitting the header search bar navigates to `/search?q=<encoded query>` and renders the matching results.
13. **Empty state (UI):** the results page shows a "no results for '<q>'" message when the list is empty, and a loading state while fetching.
14. **Protected route:** visiting `/search` while unauthenticated redirects to login (same as other protected pages).

## API contract

New **read-only `search` module**, mounted at `/api/search`. Requires `authHandler` (JWT Bearer), consistent with every other content endpoint. Response uses the project envelope `{ success, message, data }`.

### `GET /api/search/threads?q=<query>`

- **Auth:** required.
- **Query params:** `q` (string). Trimmed server-side. Empty/whitespace/missing → empty result set.
- **Matching:** case-insensitive substring over `title` **or** `content`. The query is **regex-escaped** before use (all metacharacters treated literally), then run as `{ $regex: <escaped>, $options: "i" }` on both fields via `$or`. Results sorted `createdAt: -1`, limited to 50, populated with `author` (`name`) and `subreddit` (`name`).
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Search results fetched successfully",
    "data": [
      {
        "_id": "...", "title": "...", "content": "...",
        "author": { "_id": "...", "name": "..." },
        "subreddit": { "_id": "...", "name": "..." },
        "voteCount": 0, "createdAt": "...", "updatedAt": "..."
      }
    ]
  }
  ```
- **200 OK** with `data: []` for blank/missing `q` or zero matches.
- **401** missing/invalid token.

There are **no** new write endpoints and no changes to existing endpoints.

## Data model changes

**None.** The regex approach requires no index and no schema fields — `Thread.js`, and all other models, are untouched.

> Performance note (not a schema change, not in this scope): an unanchored `$regex` cannot use an index, so this is a collection scan bounded by the `.limit(50)` cap. Acceptable at current scale; see *Out of scope* for the indexed/`$text` upgrade path.

## UI changes

### New files (backend)
- `threadhive-backend/src/services/searchService.js` — `searchThreads(query)`: trim; return `[]` immediately for blank; **escape regex metacharacters** (e.g. `query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`); build the `$or` regex query; `.sort({ createdAt: -1 }).limit(50).populate("author", "name").populate("subreddit", "name")`. Optionally clamp query length (e.g. 100 chars) to bound cost.
- `threadhive-backend/src/controllers/searchController.js` — `searchThreads(req, res)`: read `req.query.q`, call the service, send the envelope with `200`.
- `threadhive-backend/src/routes/search.js` — `router.get("/threads", authHandler, searchThreads)`.

### Modified files (backend)
- `threadhive-backend/src/app.js` — `import searchRoutes from "./routes/search.js";` and `app.use("/api/search", searchRoutes);`.

### New files (frontend)
- `threadhive-frontend/src/services/searchService.js` — `searchThreads(query)` → `axiosInstance.get(SEARCH_API.THREADS, { params: { q: query }, headers: getAuthHeaders() })` → `res.data.data`.
- `threadhive-frontend/src/reducers/searchSlice.js` — slice `search`, state `{ results: [], query: "", loading: false, error: null }`, thunk `searchThreadsThunk(query)` (wraps failure with `handleApiError`); reducers set loading/results/error and store the active `query`.
- `threadhive-frontend/src/pages/Search/SearchResults.jsx` — reads `q` via `useSearchParams`; dispatches `searchThreadsThunk(q)` on mount and whenever `q` changes; renders results through the existing `ThreadList`/`ThreadCard`; shows a heading (`Results for "<q>"`), a loading state, an empty state, and an error state.

### Modified files (frontend)
- `threadhive-frontend/src/config/apiConfig.js` — add `SEARCH_API = { THREADS: "/search/threads" }`.
- `threadhive-frontend/src/store/store.js` — register the `search` reducer.
- `threadhive-frontend/src/components/Header/Header.jsx` — add a controlled search input + form, rendered when `token` exists; on submit, `navigate(\`/search?q=${encodeURIComponent(query.trim())}\`)` (no-op on blank).
- `threadhive-frontend/src/App.jsx` — add `<Route path="/search" element={<PrivateRoute><SearchResults /></PrivateRoute>} />`.

### Routes
- New protected route `/search` (reads `?q=`). No other routing changes.

## Edge cases & error handling

- **Regex injection / ReDoS:** the raw query is escaped before being placed in a `RegExp`, so metacharacters (`.* + ? ( ) [ ] \\` etc.) are matched literally and cannot form a malicious or wildcard pattern. *(This is the central correctness/safety requirement of the regex approach.)*
- **Blank, whitespace-only, or missing `q`:** service short-circuits to `[]` (`200`) — never returns the entire collection.
- **Zero matches:** `200` with `data: []`; the UI renders the empty state.
- **Very long query:** clamp to a max length (e.g. 100 chars) before building the regex to bound scan cost.
- **Unbounded result size:** capped at 50 via `.limit(50)`.
- **Unauthenticated:** `authHandler` returns `401` before the controller runs; the `/search` page is behind `PrivateRoute`.
- **Special characters in URL:** the header encodes the query with `encodeURIComponent`; the results page decodes via `useSearchParams`.
- **Rate limiting:** the global limiter in `app.js` (100 req / 15 min / IP) already applies; submit-based search keeps request volume low.

## Out of scope

- **Relevance ranking / fuzzy matching / typo tolerance** — regex substring has no scoring; results are chronological.
- **MongoDB `$text` index upgrade** — switching to an indexed full-text engine (and the `Thread` text index it needs) is a future performance enhancement; noted because epic feature #5 (AI Related) would also use that index.
- **Searching other entities** — comments, subreddit names/descriptions, and users are **not** searched (title + content only, per decision).
- **Live/as-you-type dropdown & autocomplete** — search runs on submit to a results page.
- **Server-side pagination of results** — the API returns up to 50; the page may client-paginate later, but pagination is not built now.
- **Live vote-count sync on the results page** — voting from a result still calls the API, but the result list (its own `search` slice) is not guaranteed to live-update the count (it isn't part of the `threads` slice). Acceptable; not addressed here.
- **Search history / saved searches / analytics.**

## Test plan

Backend: Vitest + supertest against in-memory Mongo (`import '../setup.js'`). Frontend: Vitest + Testing Library with MSW.

### Backend — integration (`tests/integration/search.test.js`)
Reuse the `createUserAndLogin()` helper pattern; seed a subreddit and several threads with known titles/content (e.g. "Bookmarks guide", "JavaScript tips", a thread whose body—not title—contains a keyword, and one titled "c++ pointers").

1. `q` = a word in a title → `200`, returns that thread.
2. `q` = a word only in another thread's **content** → returns that thread.
3. Case-insensitivity: `q=BOOKMARKS` and `q=bookmarks` return the same set.
4. Substring: `q=ook` returns "Bookmarks guide".
5. Regex-safe: `q=c++` returns "c++ pointers" and does **not** error.
6. No matches: `q=zzzznomatch` → `200`, `data: []`.
7. Blank `q` (`?q=`  ) and missing `q` → `200`, `data: []`.
8. No token → `401`.
9. Results are populated with `author` + `subreddit`.
10. Ordering: with two matches, newest `createdAt` is first.
11. (Optional) Seed >50 matching threads → response length is 50.

### Backend — unit
- `tests/unit/services/searchService.test.js` — mock `Thread`: blank query short-circuits to `[]` without querying; metacharacters are escaped (assert the constructed query/regex is literal); query applies `$or` on title+content, `sort` desc, `limit(50)`, and the two `populate`s.
- `tests/unit/controllers/searchController.test.js` — mock the service; assert it reads `req.query.q` and returns the `{ success, message, data }` envelope with `200`.

### Frontend
- Add an MSW handler in `tests/mocks/handlers.js` for `GET ${BASE_URL}/search/threads` that filters `mockThreads` by the `q` param (case-insensitive substring on title/content); reuse existing thread fixtures.
- `tests/unit/reducers/searchSlice.test.js` — `searchThreadsThunk.pending` sets `loading`; `.fulfilled` sets `results` + `query`; `.rejected` sets `error`.
- `tests/unit/components/Header.test.jsx` (extend) — typing a query and submitting calls navigate with `/search?q=<encoded>`; blank submit does nothing; the bar renders only when authenticated.
- `tests/unit/pages/SearchResults.test.jsx` (new) — given a `?q=` and seeded/MSW results, renders matching cards; renders the empty state for no matches; renders the loading state while pending; reads the query from the URL.
