# Week 7 ThreadHive Workspace

## Scope and coursework boundary

- This folder contains two independent app pairs: `starter_code/threadhive-frontend` with `starter_code/threadhive-backend`, and the corresponding projects under `solution/`.
- Treat `starter_code/` as the normal coursework target. Treat `solution/` as a read-only comparison reference unless the user explicitly asks to change it. Do not copy the solution wholesale into the starter; keep the exercise sequence and intentional gaps intact.
- The course PDFs are intentionally excluded from this repository. When a task depends on assignment requirements, use the copy supplied by the user or course and do not add PDF files to this repository.
- `starter_code/threadhive-frontend/resources/prompts.md` contains the Copilot prompts for sections 2.2–2.5; it is supporting workflow material, not a substitute for the assignment requirements.

## Frontend structure

- `src/main.jsx` mounts the React app. `src/App.jsx` owns the router, providers, and route protection.
- `src/pages/` contains the auth and user screens. `src/components/` contains shared interface pieces such as the header, thread list, comments, voting, and create-thread form.
- Keep network calls in `src/services/`; use `src/api/apiClient.js` and `src/config/apiConfig.js` for requests and endpoint paths. The backend returns `{ success, message, data }`; service methods should return the relevant `data` payload.
- Auth state belongs in `src/context/AuthContext.jsx`. Profile bio, location, and website are local-only values; the backend has no profile fields or update endpoint.
- The starter and solution frontend API URLs differ. Keep each frontend's API URL aligned with the `PORT` used by its paired backend; the starter currently targets 5001 and the solution targets 5000.

## Backend structure and data safety

- `main.js` loads `.env`, connects to MongoDB, and starts `server.js`. `src/app.js` installs middleware and mounts routes. Keep request handling in `src/routes/` and `src/controllers/`, business and database operations in `src/services/`, and schemas in `src/models/`.
- Keep `.env` files, credentials, and live database URIs out of Git. The parent repository ignores `.env` and `node_modules/` at any depth. Use placeholders only in committed examples.
- `npm run populate` deletes all documents from the User, Subreddit, Thread, and Comment collections before inserting seed records. Confirm `MONGODB_URI` points to a disposable database before running it.
- Backend tests use Vitest and an in-memory MongoDB setup. Do not mistake these tests for verification against the configured database.

## Commands and verification

Run commands from the selected app's own directory; frontend and backend dependencies are separate.

- Frontend: `npm install`, `npm run dev`, `npm run lint`, and `npm run build` are defined in each frontend `package.json`.
- Backend: `npm install`, `npm run dev`, and `npm test` are defined in each backend `package.json`. `npm run populate` is destructive as described above. `npm run format` rewrites backend files, so use it only when the user requests formatting and review its full output.
- Distinguish source inspection, lint/build, unit/integration tests, and live API/database behavior. Report which checks actually ran; do not infer a passing runtime from successful installation or source inspection.
