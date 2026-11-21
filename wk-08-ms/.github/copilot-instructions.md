# WK8 ThreadHive workspace instructions

This workspace contains two parallel implementations: `WK8_MLS_Starter_Code` and
`WK8_MLS_Solution`. Treat them as separate projects. Make changes in the tree the user
specifies; do not copy changes between them unless asked. The starter is an assignment
checkpoint and may intentionally have incomplete features compared with the solution.

## Build, test, and lint

Run commands from the relevant package directory. Install its locked dependencies with
`npm install` if needed.

### Starter frontend

```bash
cd WK8_MLS_Starter_Code/threadhive-frontend
npm run dev
npm run build
npm run lint
```

This package does not currently define a test script.

### Solution frontend

```bash
cd WK8_MLS_Solution/threadhive-frontend
npm run dev
npm run build
npm run lint
npm test -- --run
npm test -- --run tests/integration/threadFlow.test.jsx
```

Use the final command as the pattern for one frontend test file; the script otherwise
starts Vitest interactively. Frontend tests use Vitest, Testing Library, jsdom, and MSW.

### Either backend

```bash
cd WK8_MLS_Starter_Code/threadhive-backend
# or WK8_MLS_Solution/threadhive-backend
npm run dev
npm test
npm test -- tests/integration/auth.test.js
```

Use the final command as the pattern for one backend test file. Backend tests use Vitest,
Supertest, and MongoMemoryServer. `npm run populate` clears and reseeds the configured
database; run it only when replacing its existing data is intended. Backends have no
lint script.

## Architecture

- Each frontend starts in `src/main.jsx`, which mounts `App` inside the Redux `Provider`
  configured with `src/store/store.js`. `App.jsx` owns shared layout and routing; protected
  pages are gated by `PrivateRoute`.
- Frontend feature state lives in Redux Toolkit slices under `src/reducers/`. Async thunks
  call feature services under `src/services/`; services use the shared Axios instance and
  endpoint constants. Services unwrap the API response's `data` field before returning
  values to thunks.
- `currentThreadSlice` also handles fulfilled thread-vote thunks from `threadListSlice`,
  keeping the detail view synchronized with votes made elsewhere.
- The backend entry point loads environment configuration, connects to MongoDB, and starts
  the HTTP server. `src/app.js` installs middleware and mounts API routers; routes call
  controllers, controllers delegate business operations to services, and services access
  Mongoose models. The API is mounted under `/api`; it does not serve the React UI.
- Starter and solution frontends have different configured API base URLs (currently
  ports 5001 and 5000 respectively). Both backend servers default to port 3000 unless
  `PORT` is set. Check the selected frontend's `src/api/axiosInstance.js` and backend
  `server.js` together when changing or starting ports.

## Codebase conventions

- Manage shared frontend state through Redux Toolkit. The store is configured in
  `src/store/store.js`; feature slices belong in `src/reducers/`. Components read state
  with `useSelector` and dispatch actions with `useDispatch`; do not import the store into
  components.
- Use `createAsyncThunk` for API requests, with each thunk calling a function in
  `src/services/`. Handle pending, fulfilled, and rejected lifecycle actions in
  `extraReducers` with the builder pattern, updating loading/status, payload, and error
  state consistently with that feature's existing shape.
- Keep `localStorage` access out of UI components. Use the existing Redux thunk/action
  patterns for authentication and theme persistence; action names differ between features
  and the starter/solution trees.
- Use the existing `handleApiError` utility in thunk catch blocks where the feature
  follows that convention, keeping rejected payloads consistent with the UI's error
  handling.
- Keep browser persistence side effects for auth/theme in their existing Redux thunks or
  slice patterns rather than adding them to UI components. Components should read state
  with `useSelector` and dispatch actions with `useDispatch`.
- Preserve the backend's response envelope (`success`, `message`, and `data`). Frontend
  services currently return `response.data.data`, so avoid unwrapping that payload a
  second time.
- The starter frontend currently leaves the comments reducer registration commented out
  in its store; connect the comment slice when completing that assignment flow. The
  solution frontend is the reference for the completed comment flow and its tests.
- Backend tests use the in-memory MongoDB setup; do not point test setup at the
  development database.

## Assignment references

For assignment-specific requirements and page composition, consult
`WK8_MLS_Problem_Statement.pdf`, `WK8_MLS_Component_Tree.pdf`, and
`Modern Redux Toolkit.pdf` in this workspace. The starter's `threadhive-frontend/resources/prompts.md`
contains the assignment's Copilot task prompts.
