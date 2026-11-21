# AGENTS.md — Week 4 ThreadHive Solution

## Project purpose and scope

These instructions focus on `threadhive-backend-soln/`, the Week 4 Express backend solution for ThreadHive. Users register and log in, create communities and discussion threads, add comments, and vote. The main areas are service error handling, JWT authentication, security, unit/integration testing, and documentation.

This file is at the solution project root, `wk-4-ms/threadhive-backend-soln/`, and applies to this package and its descendants. The enclosing `UT-Course-2026/` directory is the Git root. Paths below are relative to this solution directory unless explicitly stated otherwise. Keep changes within the user's task. Check Git status before editing or staging; do not include unrelated course work.

## Documentation and assignment requirements

The following course documents are optional local context in the parent workspace; they are not included with this solution folder on GitHub. Read them when available. Use the solution source and tests for implemented behavior, and request missing assignment requirements when they affect the task.

| Source | When to read it and what it governs |
| --- | --- |
| `../WK4_MLS_Problem_Statement.pdf` | Assignment sequence, manual versus AI-assisted work, review steps, Postman verification, custom testing agent, and README deliverables. |
| `../WK4_MLS_Design_Doc.pdf` | Intended architecture, API routes, data relationships, JWT flow, and equal access for authenticated users. |
| `../WORKSPACE_REVIEW.md` | Historical orientation and source findings. Recheck its dated dependency, startup, and test claims. |
| `../vs-skill-tests/README.md` | Index of prior instruction/agent drafts and diagnostic trials, with explicit evidence limits. These are historical artifacts, not application tests or active agent configuration. |

Use the problem statement to understand the solution's learning context: manual service error handling precedes AI-assisted authentication, security, tests, and documentation. When helping with an assignment submission, respect its AI-use boundary and the user's requested assistance. For solution walkthroughs, explain the existing code directly. Respect a request to explain, plan, or audit before implementation; a course prompt quoted in a document is not a new instruction to execute it.

Treat current code as evidence of implemented behavior and the assignment/design as evidence of intended behavior. Report conflicts rather than silently choosing whichever makes a test pass. Existing implementation defects are not conventions to preserve. Use synthetic examples and do not reproduce private PDF watermarks or local configuration values.

## Solution package and supporting material

- This package is the reference implementation, with authentication and a Vitest suite. Reference status does not establish correctness or production readiness.
- `../vs-skill-tests/` contains prior drafts, reports, and a synthetic GitHub-check packet. Preserve their historical meaning; do not treat synthetic failures as current remote CI results or install their drafts automatically.
- The solution owns its `package.json`, `package-lock.json`, source, and configuration. Keep dependency resolution within this package. `node_modules/` is installed dependency output; lockfile changes should be generated through npm when needed.
- The solution has no frontend, application build output, migration system, deployment configuration, CI workflow, or application README. Do not invent these facilities.

## Architecture and code conventions

The stack is JavaScript ES modules, Express 5, Mongoose/MongoDB, `bcryptjs`, `jsonwebtoken`, `dotenv`, Helmet, CORS, and `express-rate-limit`. Tests use Vitest, Supertest, and `mongodb-memory-server`. Preserve existing `import`/`export` patterns and relative `.js` extensions. Follow nearby code style; do not reformat an entire backend for a focused edit.

The startup sequence is:

`npm start → node main.js → connectToDB() → startServer() → app.listen()`

`main.js` loads environment configuration and starts the database connection before the listener. `server.js` uses `PORT`, defaulting to `3000`. Shutdown helpers exist, but `main.js` does not wire `stopApp()` to process signals; do not claim graceful shutdown is configured.

| Location within the solution | Responsibility and change guidance |
| --- | --- |
| `src/app.js` | Build the Express app, order global middleware, mount routers, and register the shared error handler last. Export the app for integration testing. |
| `src/routes/` | Match method/path and attach authentication before protected controllers. Routers are default exports. |
| `src/controllers/` | Read HTTP inputs and authenticated identity, validate required request fields where appropriate, call services, and send responses. |
| `src/services/` | Implement database operations and business rules; return data or throw errors. Keep Express response handling out of this layer. |
| `src/models/` | Define Mongoose schemas, references, indexes, defaults, and timestamps. Check schema consequences before changing stored fields. |
| `src/middleware/`, `src/utils/` | Authentication, shared error responses, and `createAppError`. |
| `db.js`, `server.js`, `main.js` | Database lifecycle and process startup. Do not import `main.js` into tests: it starts the application. |

## API and response contracts

These routes are implemented in the solution. All paths include the `/api` prefix; trace their router mounts in `src/app.js` when changing them.

| Method and path | Operation |
| --- | --- |
| `POST /api/auth/register` | Register with `name`, `email`, and `password`; public. |
| `POST /api/auth/login` | Log in with `email` and `password`; public. |
| `GET /api/subreddits`; `POST /api/subreddits` | List communities; create with `name` and `description`. |
| `GET /api/subreddits/:id` | Return the community and its threads. |
| `GET /api/threads`; `GET /api/threads/:id` | Return a list of threads or one thread. |
| `POST /api/threads` | Create with `title`, `content`, and `subreddit`. |
| `PUT /api/threads/:id`; `DELETE /api/threads/:id` | Update or delete a thread. |
| `GET /api/comments/thread/:threadId`; `POST /api/comments` | List comments for a thread; create with `thread` and `content`. |
| `POST /api/threads/:id/upvote`; `POST /api/threads/:id/downvote` | Vote on a thread. |
| `POST /api/comments/:id/upvote`; `POST /api/comments/:id/downvote` | Vote on a comment. |

Every route except registration and login requires authentication, including GET routes. For JSON bodies in Postman, use `Content-Type: application/json`; protected calls also need `Authorization: Bearer <token>`. There is no `/api/posts` or Swagger `/api-docs` route in this workspace.

Controllers generally return `{ success: true, message, data }`, with `201` for creation and `200` for reads, updates, votes, login, and deletion. Subreddit detail uses `data: { subreddit, threads }`; login uses `data: { token, user }`. Keep these shapes and method/path contracts consistent with tests when changing behavior.

Use `throw createAppError(message, statusCode)` for intentional HTTP failures. The utility creates an error; the caller throws it. Express 5 forwards rejected async route/middleware handlers to the shared error handler, which sends `{ success: false, message }`. Its fallback is `500`; `stack` is included only for `NODE_ENV=development`. Controllers and the error handler must not both send a response for one request. Unknown routes and the rate limiter can respond outside this shared envelope; do not claim every HTTP failure uses it.

Current solution behavior includes `400` for missing thread/subreddit creation fields, `401` for failed authentication, `404` for missing records and empty thread/subreddit lists, and `409` for duplicate users/subreddits. Empty comment lists return `200` with `[]`. Invalid ObjectIds and Mongoose validation errors are not specially mapped and may become `500`; distinguish this gap from an intended client-error contract.

## Authentication and authorization

Within `src/`, trace `routes/auth.js`, `controllers/authController.js`, `services/authService.js`, `middleware/authHandler.js`, and `models/User.js` together when changing authentication.

- The solution checks duplicate email on registration, hashes passwords using `bcrypt.hash(password, 10)`, saves the hash, and removes the password field from its registration response. There is no model hook that hashes every password write.
- Login compares the supplied password with the stored hash and signs a JWT containing `userId`, using `JWT_SECRET` and a one-day expiry. The response includes the token and a selected user object. Unknown email currently returns `404`; incorrect password returns `401`. Treat changes to those externally visible results as intentional contract changes.
- The authentication middleware extracts the token, verifies it, looks up the user without the password field, assigns `req.user = { userId: user._id }`, and calls `next()`. Missing/invalid/expired tokens and absent users must stop the request before the controller.
- Derive authors, comment users, and voter identity from `req.user.userId`, not from caller-supplied identity fields.
- The design gives all authenticated users equal access. It does not specify admin roles or author-only thread editing/deletion. Do not introduce ownership restrictions as if they already existed. An `isAdmin` field in a test request does not establish a role model.
- Logout is client-side token disposal in the design. Refresh tokens, revocation, password reset, cookies, and server sessions are not implemented.

Verify both successful login/access and rejected access. A token returned by login alone does not prove that protected routes enforce authentication.

## Security requirements and known review targets

For security work, cover the assignment's six areas: authentication/session behavior, authorization, input validation/injection, API/transport security, data protection, and dependencies/configuration. Explain each evidenced finding and its location before proposing changes. Generic examples in lesson prompts are not confirmed vulnerabilities.

`src/app.js` currently enables Helmet, a global limit of 100 requests per 15 minutes per IP, default `cors()`, and JSON/URL-encoded body limits of 10 MB. These are existing controls, not a complete production security configuration. Check their actual options when changing security behavior; do not claim an origin allowlist, TLS configuration, or login-specific limiter exists.

Recheck these source-supported gaps before reusing the reference solution:

- **Password exposure:** thread reads and subreddit-detail thread queries populate full author documents; the User schema does not exclude `password`. Registration's filtering does not protect these read paths. When fixing this, explicitly restrict returned user fields and verify the serialized HTTP response excludes passwords and hashes.
- **Unrestricted updates:** the thread controller passes all of `req.body` to `findByIdAndUpdate`. Schema validation does not establish which fields a client may edit. Define allowed update fields when this fix is in scope; test attempts to alter identity, votes, or other internal fields.
- **Validation and error disclosure:** authentication inputs are not comprehensively validated; comment creation does not verify the referenced thread exists. Inspect types, malformed identifiers, required values, and duplicate-key races. The error handler forwards `err.message` even outside development, so suppressing stacks alone does not prevent internal-detail exposure.
- **Bearer parsing:** the middleware removes the text `Bearer ` but does not strictly require that prefix. A test using an invalid raw string does not prove that a valid token without the scheme is rejected.
- **Seed passwords:** `seed-data.js` contains plaintext sample passwords, and `populate_db.js` inserts them directly. They do not pass through registration hashing and are unsuitable as working login fixtures. Use registration or explicitly hashed synthetic users in tests.
- **Dependencies and environment:** inspect manifests, lockfiles, and current audit evidence before recommending dependency fixes. Do not infer installed versions, security status, or production readiness from a manifest alone, and do not apply broad automatic upgrades to fix an unrelated issue.

Keep real credentials, tokens, connection strings, password data, and private identifiers out of generated docs, logs, tests, commits, and reports. Use local environment variables and synthetic test values.

## Data relationships and voting behavior

`User` has required name/email/password and a unique email index. `Subreddit` has a unique required name and required author; its controller requires a description even though the schema does not. `Thread` requires title/content/author/subreddit and stores voter arrays plus `upvotes`, `downvotes`, and `voteCount`. `Comment` requires content and stores single thread/user references, voter arrays, and `voteCount`; thread/user are not marked required in its schema.

The design's comment field table labels thread/user as arrays, but the actual schemas use single ObjectIds. Call out this discrepancy before a schema change. References do not currently enforce parent existence or cascading deletion; deleting a thread does not delete its comments.

Voting uses `src/services/voteService.js` for both models. Repeating a vote preserves the choice; switching moves the user between voter arrays. Compare IDs by value, preserve other voters, and keep the score equal to upvoters minus downvoters. Thread vote responses return selected counters; comment votes return a populated comment. Comments do not declare persisted `upvotes`/`downvotes` fields even though the shared helper assigns them.

For vote changes, test both models, repetition, switching among multiple voters, save failures, and persistence after a fresh database read. Mocked document mutation does not establish persistence or concurrent-update safety.

## Setup and commands

From `wk-4-ms/`, run `cd threadhive-backend-soln` before the commands below. The solution uses npm; no Node engine or package-manager version is pinned. Inspect its lockfile and installed tools before installation. Run its own package scripts and keep dependency changes within this package.

Configure `MONGODB_URI`, `PORT`, `JWT_SECRET`, and `NODE_ENV` in a local `.env` without overwriting existing values. Both `.env` and the local `.env.example` are excluded from this publication. Startup uses `MONGODB_URI` and needs a reachable database; token signing and verification require `JWT_SECRET`. `PORT` defaults to 3000. Verify that the database is disposable before any population/reset action.

| Command from `threadhive-backend-soln/` | Purpose and preconditions |
| --- | --- |
| `npm install` | Install that package's declared dependencies when setup is requested; inspect resulting lockfile changes. |
| `npm start` | Connect to MongoDB and start `main.js`; requires complete imports and local configuration. |
| `npm run dev` | Start the same application through Nodemon. |
| `npm test` | Run the solution's full Vitest suite once; requires a test JWT secret and the integration database prerequisites. |
| `npm test -- tests/unit/utils/createAppError.test.js` | Focused solution unit test; does not use the integration database setup. |
| `JWT_SECRET='synthetic-test-secret' npm test -- tests/unit` | Solution unit suite with a synthetic JWT secret for auth-service tests. |
| `JWT_SECRET='synthetic-test-secret' npm test -- tests/integration` | Solution HTTP/database tests; starts a temporary MongoDB process and may need a MongoDB binary download. |
| `npm run format` | Runs `prettier --write .` and rewrites matching package files; avoid for a narrow unrelated edit. |
| `npm run populate` | Deletes all Users, Subreddits, Threads, and Comments in `MONGODB_URI`, then inserts samples. Run only with authorization to reset that identified disposable database. |

These commands describe inspected scripts and test filters, not a claim they all pass. There are no build, lint, or coverage scripts. Do not invent deployment steps or treat `npm start` as a production-readiness check. The solution lockfile's root metadata differs from its manifest; inspect installation results instead of assuming they are aligned.

## Test strategy and completion evidence

The solution has unit tests under `tests/unit/{controllers,services,middleware,utils}/` and integration tests under `tests/integration/`. Use named Vitest imports and descriptive behavior-focused cases. Controllers mock services; services mock model operations; middleware/utilities use request/response doubles. Preserve and restore environment values and mocks between tests.

Integration files explicitly import `tests/setup.js`, which creates a `MongoMemoryServer`, connects Mongoose to its URI, cleans test collections, disconnects, and stops the server. It is not configured as an automatic global setup file. New integration files must deliberately arrange that lifecycle. Keep tests on their owned temporary database; never fall back to the application database when the binary is unavailable. Import `src/app.js`, not `main.js` or the process-starting database wrapper. The config disables file parallelism and uses 60-second test/hook timeouts.

Assert status, response fields, failure behavior, and relevant stored effects. Check password absence, rejected writes, missing/invalid/expired tokens, duplicate input, malformed IDs, and real persistence when the changed behavior requires them. Account for the rate limiter when extending HTTP suites; do not disable production middleware merely to obtain passing tests.

Known test limitations must be handled honestly:

- `tests/unit/services/threadService.test.js` expects `[]` for an empty list and uses `[]` in its sorting case, while the service throws `404`. Resolve the intended contract before changing either implementation or assertions.
- The error-handler unit test accepts a negative status through a mock response; that does not prove Express can send that status.
- Existing vote API tests mostly inspect responses. If available locally, `../vs-skill-tests/06-test-gaps/REPORT.md` and `../vs-skill-tests/08-properties/REPORT.md` describe additional persistence and voting checks. Neither report records an executed property test or proves database persistence.

For each completed change, review its diff, run the smallest relevant trustworthy checks, and expand to the relevant suite when the impact warrants it. For requested Postman verification, register a synthetic user, log in, use the returned token on a protected endpoint, and exercise a relevant failure. Report source inspection, syntax checks, unit tests, integration tests, and live HTTP outcomes separately. An unrun suite, a historical report, or a successful command launch does not establish working behavior.

## Documentation and customization work

When asked to write the application README, document the solution's actual features, setup, environment variable names, architecture, endpoint contracts, testing, and remaining gaps. Its manifest declares ISC; preserve that metadata. Do not invent a license file, screenshots, deployed URL, frontend, or coverage percentage.

When asked to create a custom testing or README agent, ground its instructions in the solution and verify its available tools against the intended host. A read/search/edit tool list does not demonstrate command execution. Do not promise passing tests or measured coverage from generated files alone. Keep historical drafts in `../vs-skill-tests/` distinct from deliberately activated host configuration.

Keep this file current when project contracts or commands change. Record one-time diagnostics and outstanding findings in the requested report or backlog rather than turning every historical observation into a permanent rule.
