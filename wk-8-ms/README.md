# ThreadHive

ThreadHive is a full-stack discussion platform for creating and browsing topic-based
communities, sharing threads, commenting, and voting. This workspace contains both an
assignment starter and a completed solution; they are separate projects with their own
frontend and backend packages.

## Project layout

```text
wk-8-ms/
├── WK8_MLS_Solution/
│   ├── threadhive-backend/   # Express API, MongoDB models, and tests
│   └── threadhive-frontend/  # React application, Redux state, and tests
├── WK8_MLS_Starter_Code/
│   ├── threadhive-backend/   # Backend assignment starter
│   └── threadhive-frontend/  # Frontend assignment starter
├── WK8_MLS_Problem_Statement.pdf
├── WK8_MLS_Component_Tree.pdf
└── Modern Redux Toolkit.pdf
```

Use `WK8_MLS_Solution` to run the completed application. The starter directories are
intended for assignment work and are not interchangeable with the solution.

## Features

- Register and sign in
- Browse communities and discussion threads
- Create threads and comments
- Upvote and downvote threads and comments
- View a user profile
- Use a responsive interface with a dark theme

## Technology

- **Frontend:** React, Vite, React Router, Redux Toolkit, Bootstrap
- **Backend:** Node.js, Express, Mongoose, MongoDB
- **Testing:** Vitest, Testing Library, MSW, Supertest, and MongoDB Memory Server

## Prerequisites

- Node.js and npm (Node.js 20 or later recommended)
- MongoDB, running locally or available through a MongoDB connection URI

## Run the solution locally

Open two terminals from the workspace root.

### 1. Configure and start the backend

```bash
cd WK8_MLS_Solution/threadhive-backend
npm install
cp .env.example .env
```

Edit `.env` and set `MONGODB_URI` to the MongoDB database you intend to use and
`JWT_SECRET` to a private, locally generated secret. The example configuration sets
the API port to `5000`, which matches the frontend's configured API URL.

Start the API:

```bash
npm run dev
```

The backend connects to MongoDB before listening. Its API routes are mounted under
`/api` (for example, authentication routes are under `/api/auth`).

### 2. Start the frontend

In another terminal:

```bash
cd WK8_MLS_Solution/threadhive-frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser. The frontend calls the API at
`http://localhost:5000/api`; if you change the backend port, update the frontend API
base URL in `src/api/axiosInstance.js` to match.

## Seed data

The backend includes sample data that can be loaded with:

```bash
cd WK8_MLS_Solution/threadhive-backend
npm run populate
```

**This command deletes the existing users, communities, threads, and comments in the
database selected by `MONGODB_URI` before inserting sample data.** Use a disposable
development database and back up any data you need to keep.

## Development checks

Run commands from the relevant package directory.

### Frontend

```bash
npm run lint
npm run build
npm test -- --run
```

### Backend

```bash
JWT_SECRET=synthetic-test-secret npm test
```

The backend test suite uses an in-memory MongoDB instance; it does not require the
development database.

## API areas

The backend provides endpoints for authentication, communities, threads, comments,
and voting. Protected API operations require authentication. The route modules are
located in `WK8_MLS_Solution/threadhive-backend/src/routes/`.

## Assignment references

The local course workspace contains the problem statement, component tree, and Redux
Toolkit reference PDFs at the root; these PDFs are excluded from GitHub publication. The starter frontend also contains assignment prompts in
`WK8_MLS_Starter_Code/threadhive-frontend/resources/prompts.md`.

## Review and limitations

See [the publication review](REVIEW.md) for validation scope and remaining backend
authorization and data-exposure findings. Use synthetic data for this coursework.
