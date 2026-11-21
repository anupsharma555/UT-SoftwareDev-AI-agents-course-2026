# ThreadHive Backend

ThreadHive is a REST API for a discussion platform. Authenticated users can create communities, publish discussion threads, add comments, and vote on threads and comments. This directory contains the Week 4 reference backend implementation, including JWT authentication, MongoDB persistence, security middleware, and automated tests.

## Features

- User registration and login with bcrypt password hashing
- One-day JWT authentication for protected API routes
- Community creation and listing
- Thread creation, retrieval, updating, and deletion
- Comment creation and retrieval by thread
- Upvotes and downvotes for threads and comments
- Shared success and application-error response envelopes for application routes
- Helmet security headers, CORS, request rate limiting, and request-body limits
- Unit tests for controllers, services, middleware, and utilities
- Integration tests using Supertest and an in-memory MongoDB server

## Tech Stack

- Node.js with JavaScript ES modules
- Express 5
- MongoDB with Mongoose 8
- JSON Web Tokens via `jsonwebtoken`
- Password hashing via `bcryptjs`
- Vitest, Supertest, and `mongodb-memory-server`
- Nodemon for development
- Prettier for formatting

## Architecture

The application follows a layered Express structure:

1. `src/routes/` maps HTTP methods and paths to protected or public controllers.
2. `src/middleware/` handles authentication and shared error responses.
3. `src/controllers/` validates request-level data, reads the authenticated user, and formats HTTP responses.
4. `src/services/` contains business rules and Mongoose operations.
5. `src/models/` defines MongoDB document schemas and relationships.

At startup, `main.js` loads `.env`, connects to MongoDB, and starts the HTTP server. The Express app itself is exported from `src/app.js` so tests can exercise the API without starting a real listener.

Global middleware includes Helmet, a rate limit of 100 requests per 15-minute window per IP, CORS, JSON parsing, and URL-encoded body parsing. Request bodies are limited to 10 MB.

## Project Structure

```text
threadhive-backend-soln/
├── db.js                         # MongoDB connection lifecycle
├── main.js                       # Application entry point
├── server.js                     # HTTP server start/stop helpers
├── package.json                  # Scripts and dependencies
├── vitest.config.js              # Vitest configuration
├── src/
│   ├── app.js                    # Express app and route mounts
│   ├── controllers/              # HTTP handlers
│   ├── middleware/               # JWT and error middleware
│   ├── models/                   # User, Subreddit, Thread, Comment schemas
│   ├── routes/                   # API route definitions
│   ├── scripts/                  # Database seed data and population script
│   ├── services/                 # Business and persistence logic
│   └── utils/                    # Shared application utilities
└── tests/
    ├── setup.js                  # MongoDB Memory Server lifecycle
    ├── integration/              # HTTP and database flow tests
    └── unit/                     # Isolated unit tests
```

## Getting Started

### Prerequisites

- Node.js with npm
- A reachable MongoDB instance for local application use
- A disposable MongoDB test environment, or permission for `mongodb-memory-server` to download its MongoDB binary during integration tests

### Installation

From this directory:

```bash
npm install
```

Create a local `.env` file with the variables below and values for your environment. Do not commit real credentials, connection strings, or JWT secrets.

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string used by the application and seed script | `mongodb://localhost:27017/w04Express` |
| `PORT` | HTTP port; defaults to `3000` when omitted | `5000` |
| `JWT_SECRET` | Secret used to sign and verify one-day JWTs | `replace-with-a-local-secret` |
| `NODE_ENV` | Controls development-only error stack output | `development` |

### Running the App

Start the application after MongoDB is available:

```bash
npm start
```

The development command restarts the server when source files change:

```bash
npm run dev
```

The API is available at `http://localhost:<PORT>`. There is no frontend in this project.

## API Endpoints

All endpoints are prefixed with `/api`. Every endpoint requires a Bearer token except registration and login.

### Authentication

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register with `name`, `email`, and `password` | Public |
| `POST` | `/api/auth/login` | Log in with `email` and `password`; returns a JWT | Public |

### Communities

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/subreddits` | List communities | Bearer token |
| `POST` | `/api/subreddits` | Create a community with `name` and `description` | Bearer token |
| `GET` | `/api/subreddits/:id` | Get a community and its threads | Bearer token |

### Threads

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/threads` | List threads, newest first | Bearer token |
| `GET` | `/api/threads/:id` | Get one thread | Bearer token |
| `POST` | `/api/threads` | Create with `title`, `content`, and `subreddit` | Bearer token |
| `PUT` | `/api/threads/:id` | Update a thread | Bearer token |
| `DELETE` | `/api/threads/:id` | Delete a thread | Bearer token |
| `POST` | `/api/threads/:id/upvote` | Upvote a thread | Bearer token |
| `POST` | `/api/threads/:id/downvote` | Downvote a thread | Bearer token |

### Comments

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/comments/thread/:threadId` | List comments for a thread | Bearer token |
| `POST` | `/api/comments` | Create with `thread` and `content` | Bearer token |
| `POST` | `/api/comments/:id/upvote` | Upvote a comment | Bearer token |
| `POST` | `/api/comments/:id/downvote` | Downvote a comment | Bearer token |

Protected requests should include:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Successful responses generally use the following shape:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Application errors use `{ "success": false, "message": "..." }`. Registration and login return `201` and `200`, respectively. Reads, updates, votes, and deletion return `200`; resource creation returns `201`.

## Data Model

- **User**: name, unique email, password, timestamps. Registration stores a bcrypt hash; the population script inserts its sample passwords directly.
- **Subreddit**: unique name, description, author reference, timestamps
- **Thread**: title, content, author and subreddit references, vote arrays and counters, timestamps
- **Comment**: content, thread and user references, vote arrays, vote count, timestamps

Voting is idempotent for the current choice. Switching from an upvote to a downvote, or vice versa, removes the user from the opposite voter list and recalculates the score.

## Testing

Run the complete Vitest suite:

```bash
npm test
```

Run focused suites:

```bash
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/unit/utils/createAppError.test.js
```

Authentication tests need `JWT_SECRET`. A synthetic value can be supplied for local test runs:

```bash
JWT_SECRET='synthetic-test-secret' npm test
```

Integration tests create and manage a temporary MongoDB instance through `tests/setup.js`. They do not use the application database, but the first run may download a MongoDB binary. Tests run in Node, serialise test files, and use 60-second test and hook timeouts.

## Database Population

The population script is destructive. It deletes all users, communities, threads, and comments in the database named by `MONGODB_URI`, then inserts sample records:

```bash
npm run populate
```

Run this command only against a disposable database whose contents may be reset. The sample records are development data and are not intended as production credentials.

## Current Scope and Limitations

- This repository contains an API only; there is no frontend, deployment configuration, migration system, or CI workflow.
- Authentication is JWT-based and does not implement refresh tokens, server-side sessions, token revocation, password reset, or logout beyond client-side token disposal.
- All authenticated users currently have equal route access; author-only editing/deletion and admin authorization are not implemented.
- Some populated read paths should be reviewed to ensure password fields are never serialized.
- Thread updates currently forward the request body to the service; callers should treat allowed editable fields as an area for further hardening.
- Invalid ObjectIds and some Mongoose validation failures may be returned as server errors rather than mapped client errors.

## License

The package metadata declares the `ISC` license.
