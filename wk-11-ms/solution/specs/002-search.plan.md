# Implementation Plan — Spec 002: Thread Search

Plan for `specs/002-search.md`. Work is sequenced **bottom-up**: ~~model~~ → service → controller → route → backend tests → Redux slice → frontend service → page/component → wire-up → frontend tests.

**No model task:** the chosen case-insensitive **regex** approach needs no index and no schema fields — `Thread.js` and all models are untouched. The sequence therefore starts at the service layer. No code is written here — this is the build order, exact files, and key functions per task.

**Conventions to hold throughout** (from `CLAUDE.md` / spec): throw `createAppError(msg, status)` where errors apply (no try/catch in controllers — Express 5 forwards rejections); every response is `{ success, message, data }`; `authHandler` guards the route; the actor comes from the token, not the body; backend tests run serially against in-memory Mongo; frontend uses MSW. Run all commands from inside the relevant project dir. Search is **read-only** — no write endpoints, no edits to existing endpoints.

---

## Phase 1 — Backend

### Task 1 — Search service
- **Create** `threadhive-backend/src/services/searchService.js`
  - Import `Thread`.
  - `searchThreads(query)`:
    1. Trim `query`; if empty/whitespace → **return `[]`** immediately (no DB call).
    2. Clamp length (e.g. first 100 chars) to bound scan cost.
    3. **Escape regex metacharacters:** `const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")` (literal matching — the central safety requirement).
    4. Query `Thread.find({ $or: [ { title: { $regex: escaped, $options: "i" } }, { content: { $regex: escaped, $options: "i" } } ] })`.
    5. `.sort({ createdAt: -1 }).limit(50).populate("author", "name").populate("subreddit", "name")`.
    6. Return the threads array.

### Task 2 — Search controller
- **Create** `threadhive-backend/src/controllers/searchController.js`
  - `searchThreads(req, res)` — read `req.query.q`; call `searchThreads(q)`; respond `200` + `"Search results fetched successfully"`; `data` = threads. No try/catch.

### Task 3 — Search route + mount
- **Create** `threadhive-backend/src/routes/search.js`
  - `router.get("/threads", authHandler, searchThreads)`.
- **Edit** `threadhive-backend/src/app.js`
  - `import searchRoutes from "./routes/search.js";` and `app.use("/api/search", searchRoutes);`.

### Task 4 — Backend tests
- **Create** `threadhive-backend/tests/integration/search.test.js` — `import '../setup.js'`; reuse the `createUserAndLogin()` helper pattern; `beforeEach` clears `Thread`/`Subreddit` and seeds a subreddit + several threads with known data: e.g. "Bookmarks guide", "JavaScript tips", a thread whose **body** (not title) contains a keyword, and one titled "c++ pointers". Cases (map to spec acceptance criteria):
  1. title-word match → `200`, returns that thread
  2. content-only-word match → returns that thread
  3. case-insensitive: `BOOKMARKS` == `bookmarks`
  4. substring: `ook` → "Bookmarks guide"
  5. regex-safe: `c++` → "c++ pointers", no error
  6. no matches → `200`, `[]`
  7. blank `?q=` and missing `q` → `200`, `[]`
  8. no token → `401`
  9. results populated with `author` + `subreddit`
  10. ordering: newest `createdAt` first
  11. (optional) >50 matches → length 50
- **Create** `threadhive-backend/tests/unit/services/searchService.test.js` — mock `Thread`: blank short-circuits with no query call; metacharacters escaped (assert literal regex); `$or` on title+content; `sort` desc + `limit(50)` + both `populate`s.
- **Create** `threadhive-backend/tests/unit/controllers/searchController.test.js` — mock the service; assert it reads `req.query.q` and returns the `{ success, message, data }` envelope with `200`.
- **Verify:** `cd threadhive-backend && npx vitest run tests/integration/search.test.js` then `npm test`.

---

## Phase 2 — Frontend

### Task 5 — API endpoint constant
- **Edit** `threadhive-frontend/src/config/apiConfig.js`
  - Add `SEARCH_API = { THREADS: "/search/threads" }`.

### Task 6 — Frontend search service
- **Create** `threadhive-frontend/src/services/searchService.js`
  - `getAuthHeaders()` (mirror `threadService.js`).
  - `searchThreads(query)` → `axiosInstance.get(SEARCH_API.THREADS, { params: { q: query }, headers: getAuthHeaders() })` → `res.data.data`.

### Task 7 — Redux slice
- **Create** `threadhive-frontend/src/reducers/searchSlice.js`
  - State: `{ results: [], query: "", loading: false, error: null }`.
  - Thunk `searchThreadsThunk(query)` → `searchThreads(query)`; wrap failure with `handleApiError`.
  - `extraReducers`: pending → `loading: true`, store `query`; fulfilled → `results`, `loading: false`; rejected → `error`, `loading: false`.

### Task 8 — Store wire-up
- **Edit** `threadhive-frontend/src/store/store.js`
  - Import `searchReducer`; add `search: searchReducer` to the `reducer` map.

### Task 9 — SearchResults page
- **Create** `threadhive-frontend/src/pages/Search/SearchResults.jsx`
  - Read `q` via `useSearchParams`; `useEffect` dispatches `searchThreadsThunk(q)` on mount and whenever `q` changes.
  - Render `state.search.results` through the existing `ThreadList`/`ThreadCard` (read-only reuse — no edits to those).
  - Heading `Results for "<q>"`; loading state; empty state ("No results for '<q>'"); error state.
  - (Optional) `SearchResults.css`.

### Task 10 — Header search bar
- **Edit** `threadhive-frontend/src/components/Header/Header.jsx`
  - Add a controlled input + `<form>`, rendered when `token` exists (alongside the existing token-gated controls); local `useState` for the query.
  - On submit: `navigate(\`/search?q=${encodeURIComponent(query.trim())}\`)`; no-op when the trimmed query is blank. (`useNavigate` is already imported.)

### Task 11 — App route
- **Edit** `threadhive-frontend/src/App.jsx`
  - Import `SearchResults`; add `<Route path="/search" element={<PrivateRoute><SearchResults /></PrivateRoute>} />`.

### Task 12 — Frontend tests
- **Edit** `threadhive-frontend/tests/mocks/handlers.js` — add `GET ${BASE_URL}/search/threads` that filters `mockThreads` by the `q` param (case-insensitive substring on title/content); reuse existing fixtures.
- **Create** `threadhive-frontend/tests/unit/reducers/searchSlice.test.js` — pending sets `loading`; fulfilled sets `results` + `query`; rejected sets `error`.
- **Edit** `threadhive-frontend/tests/unit/components/Header.test.jsx` — submitting a query navigates to `/search?q=<encoded>`; blank submit does nothing; the bar renders only when authenticated.
- **Create** `threadhive-frontend/tests/unit/pages/SearchResults.test.jsx` — given `?q=` + seeded/MSW results, renders matching cards; empty state for no matches; loading state while pending; reads `q` from the URL.
- **Verify:** `cd threadhive-frontend && npx vitest run` then `npm run lint`.

---

## Final verification
- Backend: `cd threadhive-backend && npm test` (full suite green).
- Frontend: `cd threadhive-frontend && npm test -- run && npm run lint`.
- Manual smoke (per spec AC 12–13): type a query in the header → land on `/search?q=…` with matching cards; a no-match query shows the empty state; reloading the URL re-runs the search.

---

## Task checklist

### Backend (no model change — regex approach)
- [ ] **T1** Create `services/searchService.js` (`searchThreads`: trim/blank-guard, length clamp, **regex escape**, `$or` regex, sort desc, limit 50, populate author+subreddit)
- [ ] **T2** Create `controllers/searchController.js` (`searchThreads` reads `req.query.q`, returns envelope)
- [ ] **T3** Create `routes/search.js` (GET `/threads` + `authHandler`); mount at `/api/search` in `app.js`
- [ ] **T4** Backend tests: integration + service unit + controller unit; green via `npm test`

### Frontend
- [ ] **T5** Add `SEARCH_API` to `config/apiConfig.js`
- [ ] **T6** Create `services/searchService.js` (`searchThreads(query)`)
- [ ] **T7** Create `reducers/searchSlice.js` (`searchThreadsThunk` + reducers; `results`/`query`/`loading`/`error`)
- [ ] **T8** Register `search` reducer in `store/store.js`
- [ ] **T9** Create `pages/Search/SearchResults.jsx` (reads `?q=`, dispatches thunk, reuses `ThreadList`, loading/empty/error states)
- [ ] **T10** Add header search bar to `components/Header/Header.jsx` (submit → `/search?q=…`)
- [ ] **T11** Add protected `/search` route to `App.jsx`
- [ ] **T12** Frontend tests: MSW handler, slice test, Header test, SearchResults test; lint clean

### Sign-off
- [ ] **T13** Full backend + frontend suites green; lint clean; manual smoke of AC 12–13
