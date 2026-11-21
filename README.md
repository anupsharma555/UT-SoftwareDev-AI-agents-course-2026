# Full-Stack Applications & AI Integration

[![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![React](https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Redux](https://img.shields.io/badge/Redux%20Toolkit-State-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Generative%20AI-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

A collection of JavaScript applications and supporting examples exploring
full-stack web development, API design, data modeling, and practical generative
AI integration. The repository brings together community discussion and
developer Q&A experiences, with independent frontend and backend packages.

## Applications

| Application | Focus | Featured implementation |
| --- | --- | --- |
| **ThreadHive** | Topic-based communities, threads, comments, voting, and user accounts | [AI-enabled ThreadHive](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/tree/feat/wk9-threadhive/wk-9-ms/WK9_MLS_Starter_Code) on `feat/wk9-threadhive` |
| **DevAnswers** | Developer questions and answers, tags, voting, and user accounts | [AI-enabled DevAnswers](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/tree/main/wk-9-proj) on `main` |

Other directories contain alternative implementations, earlier application
variants, and smaller demonstrations. Packages are independently configured:
dependencies, API ports, scripts, and feature availability vary by version.
The links above point to the branches that contain the featured implementations;
they might not be present in every checkout.

## Technology

- **Frontend:** React, Vite, React Router, Redux Toolkit, Axios, Bootstrap, and React Bootstrap.
- **Backend:** Node.js, Express, MongoDB, and Mongoose, with REST endpoints organized into routes, controllers, services, and models.
- **Authentication and middleware:** JWT, bcryptjs, CORS, Helmet, and request rate limiting in the relevant API implementations.
- **AI:** Google Gemini via the `@google/genai` SDK. A ThreadHive reference implementation also contains an optional OpenAI provider example.
- **Quality and tooling:** Vitest, React Testing Library, Mock Service Worker, Supertest, MongoDB Memory Server, ESLint, and Prettier across the projects.

## Engineering highlights

- **Application state:** Redux Toolkit stores and slices manage authentication,
  threads, comments, communities, and theme preferences. Async thunks connect
  user actions to API requests and track loading and error states.
- **Authentication and password protection:** Registration hashes passwords
  with bcrypt; login verifies the hash and issues a signed JWT. Backend
  middleware verifies tokens for protected routes. Password hashing is
  one-way, rather than reversible encryption.
- **API and data design:** Express routes delegate to controllers and services,
  while Mongoose schemas model users and application content in MongoDB.
  Central error handling, security headers, and rate limiting appear in the
  API implementations.
- **Testing:** Unit and integration suites exercise services, API routes, and
  React components using test doubles and isolated test databases where
  appropriate.

Implementation details and security controls vary across versions. These
projects are examples, not a guarantee of production readiness.

## AI-powered experiences

The featured implementations integrate generative AI into existing application
workflows rather than exposing provider credentials in the browser:

- **ThreadHive:** authenticated users can request a thread summary or generate
  rephrasing suggestions. Suggestions can be reviewed before being applied.
- **DevAnswers:** authenticated users can improve a question's title,
  description, and tags, or generate a concise summary of its answers.
  Question suggestions are presented for individual acceptance or rejection.
  Answer summaries require at least three answers.

The frontend calls authenticated backend endpoints; the backend constructs the
prompt and calls Gemini using a server-side API key. The DevAnswers question
optimizer requests structured JSON and validates the returned fields. AI output
is generated content, so users should review it for accuracy. Requests send the
relevant user-provided content to the configured AI provider; avoid submitting
sensitive data and review the provider's terms and privacy practices.

## AI-assisted development

GitHub Copilot, OpenAI Codex, and Claude Code have been used at different
stages of development. Alongside these coding assistants, the applications
use the Gemini SDK at runtime to provide user-facing AI features.

The repository also includes task-focused agent and skill definitions, such as:

- **[Backend testing agent](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/blob/main/wk-4-gprojstartercode/devanswers-backend/.github/agents/backend-testing-agent.agent.md):** guides Vitest service tests and Supertest API integration tests with an isolated MongoDB instance.
- **[React testing agent](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/blob/main/wk-6-ms/.github/agents/react-testing-agent.agent.md):** focuses on accessible, behavior-oriented component tests using React Testing Library and Vitest.
- **[Fix skill](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/blob/main/wk-6-ms/threadhive-frontend-starter/skills/fix/SKILL.md):** describes a formatting and linting workflow for a frontend project.
- **[Playwright CLI skill](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/blob/main/wk-7-ms/starter_code/threadhive-frontend/.claude/skills/playwright-cli/SKILL.md):** provides browser automation and testing guidance for Claude Code.

These are project-specific instructions rather than universal commands; their
availability and execution depend on the assistant, workspace, and installed
tools. Review the relevant definition and package scripts before using them.

## Getting started

The following example runs the featured DevAnswers implementation from the
`main` branch. It requires **Node.js 20 or later**, npm, a MongoDB connection,
and a Gemini API key for AI features. Use a separate clone if you have local
changes in another branch.

```bash
git clone --branch main https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026.git
cd UT-SoftwareDev-AI-agents-course-2026/wk-9-proj/devanswers-backend
npm install
cp .env.example .env
```

In the backend `.env`, configure `MONGODB_URI`, `JWT_SECRET`, and
`GEMINI_API_KEY`. Keep secrets local and do not commit `.env` files.
Start the API:

```bash
npm run dev
```

In a second terminal, from the clone root, start the frontend:

```bash
cd wk-9-proj/devanswers-frontend
npm install
npm run dev
```

Open the URL printed by Vite. DevAnswers uses `http://localhost:3000/api`
by default; configure `VITE_API_URL` in the frontend's
`.env.development.local` if the backend uses another address.
See the [DevAnswers README](https://github.com/anupsharma555/UT-SoftwareDev-AI-agents-course-2026/blob/main/wk-9-proj/README.md)
for further details.

**Database seeding:** Some backends provide `npm run populate`. These scripts
can delete existing application data before inserting sample records. Inspect
the relevant script and use a disposable development database before running it.

## Testing and development

Run commands inside the relevant frontend or backend package, not at the
repository root. For the featured DevAnswers packages:

```bash
npm test              # backend or frontend tests
npm run lint          # frontend
npm run build         # frontend production build
```

Backend tests include API integration tests and use MongoDB Memory Server;
frontend tests use component testing and mocked API responses. Test coverage
and scripts differ between application variants.

---

Developed in collaboration with the University of Texas.
