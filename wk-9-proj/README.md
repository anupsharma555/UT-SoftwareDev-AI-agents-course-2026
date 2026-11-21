# DevAnswers

DevAnswers is a full-stack Q&A application for developers, built with a React/Redux frontend and an Express/MongoDB backend. This version adds two AI-powered features implemented with the Google Gemini API.

## AI Features

Both features require a logged-in user and make a single Gemini call per action. The API key is read from the backend environment and is never exposed to the frontend.

**Question Quality Optimizer**
- An **Optimize question with AI** button on the Ask a Question page sends the draft title, description and tags to the backend (`POST /api/questions/improve`).
- Gemini returns improved versions of all three fields as schema-validated JSON, with a capped output length.
- Each suggestion appears under its field with independent **Accept** and **Reject** actions. The original text is kept until a suggestion is accepted, and the form can be submitted at any time.

**Answer TL;DR Summarizer**
- A **Summarize Answers** button appears on the question page when the user is logged in and the question has three or more answers.
- The backend (`POST /api/questions/:id/summarize`) loads the question and its answers itself and returns a 3–5 sentence plain-text summary.
- The summary appears in a dismissible banner above the answers. Dismissing it restores the button so the summary can be regenerated.

## Implementation

- **SDK and model:** [`@google/genai`](https://www.npmjs.com/package/@google/genai) with `gemini-2.5-flash`.
- **Architecture:** routes → controllers → services. The Gemini logic lives in `devanswers-backend/src/services/aiService.js`.
- **Tests:** Vitest unit and integration tests cover both features on the backend, and component tests cover them on the frontend.

## Getting Started

**Prerequisites:** Node.js, a MongoDB connection string, and a Gemini API key.

**Backend**
```bash
cd devanswers-backend
cp .env.example .env   # then fill in MONGODB_URI, JWT_SECRET and GEMINI_API_KEY
npm install
npm run populate       # seeds sample data
npm run dev
```

**Frontend**
```bash
cd devanswers-frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173 and calls the backend at `http://localhost:3000/api` by default. If your backend uses a different port, set `VITE_API_URL` in `devanswers-frontend/.env.development.local`, for example `VITE_API_URL=http://localhost:3001/api`.

Run the tests with `npm test` in either folder.
