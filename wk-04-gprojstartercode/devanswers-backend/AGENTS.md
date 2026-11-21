# DevAnswers Backend - AI Agent Instructions

This directory is the DevAnswers backend project root, a Question & Answer app built with Express.js and MongoDB. Run the commands below here.

Use the current source to identify implemented behavior. The question and answer services, controllers, and routes are implemented and mounted in `src/routes/index.js`. Question Service unit tests and Questions API integration tests are present; passing isolated tests do not by themselves prove live server behavior.

## Quick Start

```bash
# Setup (there is currently no .env.example)
npm install             # Install dependencies when needed; can change package-lock.json
# Create a local, Git-ignored .env with MONGODB_URI and JWT settings

# Development
npm run dev           # Start with nodemon after required modules are implemented
npm start             # Start the app without nodemon after required modules are implemented
npm test              # Run the Vitest unit and integration suites
npm run populate      # Deletes existing application records, then inserts sample data
```

## Architecture

**Request path**: Routes → Controllers → Services → Models → MongoDB

The code uses JavaScript ES modules. Preserve `import`/`export` and relative `.js` extensions, follow nearby formatting, and avoid reformatting unrelated files. This package has no frontend, build pipeline, migration system, or deployment configuration.

```
src/
├── routes/          # Express routers, apply middleware
├── controllers/     # Request/response handlers (thin layer)
├── services/        # Business logic, database operations
├── models/          # Mongoose schemas (User, Question, Answer, Tag)
└── middleware/      # Authentication, error handling
```

### Component responsibilities

- Controllers: Extract req data, call services, format responses
- Services: Database and business logic; use `createAppError(message, statusCode)` for expected failures
- Models: Schema definitions only, no business logic
- `main.js` loads `.env` and connects through `db.js`; `server.js` starts the app built in `src/app.js`. `src/app.js` mounts `src/routes/index.js` at `/api`, where the auth, question, answer, and tag routers are mounted.
- Import `src/app.js` into HTTP tests, not `main.js`: importing `main.js` starts the database connection and listener.
- `src/scripts/seed-data.js` contains samples. `src/scripts/populate-db.js` clears the `users`, `questions`, `answers`, and `tags` collections in the database named by `MONGODB_URI` before inserting them. Confirm the target database before ever running `npm run populate`; do not use it as a routine check.
- Implement the required question behavior in `questionService.js`: list results include `answerCount`, detail increments `views` and includes answers, and deletion also removes related answers.

## API Patterns

**Base path**: `/api`

**Standard response format**:

```javascript
{ success: true, message: "...", data: {...} }  // Success
{ success: false, message: "..." }              // Error
```

**API routes**:

| Method and path | Access and operation |
| --- | --- |
| `POST /api/auth/register`; `POST /api/auth/login` | Public registration and login |
| `GET /api/questions`; `GET /api/questions/:id` | Public question list and detail; detail increments views |
| `GET /api/questions/:questionId/answers` | Public answer list for a question |
| `POST /api/questions`; `POST /api/questions/:questionId/answers` | Authenticated question and answer creation |
| `PUT /api/questions/:id`; `DELETE /api/questions/:id` | Author or admin updates and deletion |
| `POST /api/questions/:id/upvote`; `POST /api/questions/:id/downvote` | Authenticated question voting |
| `PUT /api/answers/:answerId`; `DELETE /api/answers/:answerId` | Author or admin updates and deletion |
| `POST /api/answers/:answerId/upvote`; `POST /api/answers/:answerId/downvote` | Authenticated answer voting |
| `GET /api/tags`; `GET /api/tags/:tagId/questions` | Public tag listing and tagged questions |

**Protection pattern**:

- Public: All GET endpoints, plus `POST /api/auth/register` and `POST /api/auth/login`
- Protected: Content-changing question and answer POST/PUT/DELETE endpoints (require `authenticate` middleware)
- Use `req.user.id` as the author of new questions and answers; never trust an author ID supplied in the request body.

## Authentication & Authorization

**JWT-based**: Bearer token in `Authorization` header

```javascript
// Middleware sets req.user
req.user = { id: "userId", isAdmin: boolean };
```

**Authorization checks in services**:

```javascript
// Allow owner or admin
if (resource.author.toString() !== user.id.toString() && !user.isAdmin) {
  throw createAppError("Not authorized", 403);
}
```

**Password handling**: bcryptjs with 10 salt rounds

Public registration ignores any client-supplied `isAdmin` value; the User schema defaults new accounts to non-admin. Admin accounts in seed data are created separately.

## Database Models

**Mongoose schemas** with key relationships:

- **User**: name, email, password (hashed), isAdmin, profileImage
- **Question**: title, description, tags[], author (ref), upvotes[], downvotes[], voteCount, views
- **Answer**: questionId (ref), answerText, author (ref), upvotes[], downvotes[], voteCount
- **Tag**: name (unique index)

User, Question, and Answer schemas use Mongoose timestamps. The current Tag schema has `createdAt` but no `updatedAt`; verify its timestamp behavior before changing the schema.

**Voting pattern**: User ID arrays (`upvotes[]`, `downvotes[]`) + computed `voteCount`

## Error Handling

**Expected application errors flow through the global error handler middleware**:

```javascript
// Services throw errors with status codes
throw createAppError("Resource not found", 404);
throw createAppError("Not authorized", 403);

// Express 5 forwards uncaught async errors to this middleware
```

**Common status codes**:

- 400: Explicit bad-request errors where the service assigns this status
- 401: Not authenticated
- 403: Not authorized (authenticated but no permission)
- 404: Resource not found
- 409: Conflict (e.g., duplicate email)

Implement successful responses as `{ success: true, message, data }` when the endpoint returns data. Creating a question or answer returns 201; deleting an answer omits `data`. Missing questions, answers, and empty question/answer lists use 404. The current vote helper throws a plain error for a missing document, so do not assume every failure already has an application status code.

The global handler falls back to 500 and includes a stack only in development. Invalid ObjectIds and some Mongoose validation errors are not mapped to 400. Unknown routes and the rate limiter can respond outside the shared JSON envelope. Do not imply every HTTP failure has the same response shape.

## Testing

**Framework**: Vitest runs the unit and integration test suites. The custom testing agent is in `.github/agents/backend-testing-agent.agent.md`.

**Integration tests** (`tests/integration/`):

- Use MongoDB Memory Server (in-memory database)
- Full HTTP requests via supertest
- Setup in `tests/setup.js` (global beforeAll/afterAll)
- They do not connect to the Atlas URI in `.env` or prove that a separately running server works. MongoDB Memory Server must be able to start a local process and bind a local port.
- Import `tests/setup.js` in each new integration file; Vitest does not load it globally in the current config.

**Unit tests** (`tests/unit/`):

- Mock services and models with `vi.mock()`
- Test controllers/services/middleware in isolation
- Clear mocks in beforeEach

For question service and Questions API work, add success and error behavior with at least three cases per endpoint and service function. Check coverage rather than counting test files. For sort tests, use distinct `createdAt` values; Mongoose treats this field as immutable, so set synthetic dates through the test collection when needed.

## Key Conventions

**Naming**:

- Services: `{action}{Resource}Service` → `createQuestionService({ title, description, tags, author })`
- Controllers: `{action}{Resource}` → `async createQuestion(req, res)`

**Voting logic** (`voteService.js`):

- Shared `handleVote(model, resourceId, userId, voteType)` for questions/answers
- Prevents duplicate votes, allows vote switching
- Current implementation loads a document, changes the arrays and count, then saves; it is not an atomic database update.

**Tag handling**:

- Auto-create tags from comma-separated input strings
- Deduplication via `findOne` before insert
- Return ObjectIds for question.tags array

**Population**:

- Author: selected `name` plus Mongoose's default `_id` (exclude password and email)
- Tags: Full tag objects on questions
- Answers: Embedded in question detail responses

**Security**:

- Helmet for security headers
- Rate limiting: 100 requests per 15 minutes per IP
- CORS enabled
- 10MB body size limit

## Environment Variables

Configuration read from a local `.env`:

- `MONGODB_URI`: MongoDB connection string; required at startup
- `JWT_SECRET`: Secret for signing and verifying tokens; use a strong random value
- `JWT_EXPIRATION`: Token lifetime passed to `jsonwebtoken`; set it so login tokens expire as intended
- `PORT`: Server port; defaults to 3000 in `server.js`
- `NODE_ENV`: `development` includes an error stack in responses

Keep `.env` local and ignored by `.gitignore`. Never copy its values or private identifiers into tests, documentation, agent files, commits, or chat output. There is no current `build` or `lint` script in `package.json`.

## Verification

Trace an affected behavior from route through controller, service, and model. Once tests exist, run focused unit or integration tests, then `npm test` when the change warrants it. An in-memory test result does not verify Atlas or the user's separately running server. Do not start, seed, or alter the user's live database or running server just to verify instructions. Report failing checks and unresolved gaps rather than claiming completion from source inspection alone.
