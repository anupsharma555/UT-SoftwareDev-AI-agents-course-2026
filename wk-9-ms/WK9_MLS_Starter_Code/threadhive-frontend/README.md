# ThreadHive

ThreadHive is a community discussion app built with React, Redux Toolkit, and
Vite. The frontend connects to an Express API backed by MongoDB.

## Requirements

- Node.js and npm
- MongoDB, running locally or available through a connection URI

## Run locally

Start the backend first. From the repository root:

```bash
cd WK9_MLS_Starter_Code/threadhive-backend
npm install
cp .env.example .env
```

Set `MONGODB_URI` and `JWT_SECRET` in `.env`. Set `GEMINI_API_KEY` if you want
to use the AI features. Then start the API:

```bash
npm run populate
npm run dev
```

The API listens on `http://localhost:5001` by default. Keep it running, then
open a second terminal and start the frontend:

```bash
cd WK9_MLS_Starter_Code/threadhive-frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Frontend commands

Run these commands from `WK9_MLS_Starter_Code/threadhive-frontend`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npx vitest run` | Run tests once |

## Configuration

The API connection is configured in `src/api/axiosInstance.js` and defaults to
`http://localhost:5001/api`. The backend reads its configuration from the
backend `.env` file; use `.env.example` as a starting point and keep real
credentials out of version control.
