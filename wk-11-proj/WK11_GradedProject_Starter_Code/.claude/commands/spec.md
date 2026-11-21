---
description: Draft a feature specification from a short description
argument-hint: <feature-name> — <one-line description>
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion
---
You are writing a feature specification for the DevAnswers project (Express/MongoDB backend, React/Redux frontend, both in the project root, `devanswers-backend/` and `devanswers-frontend/`).

Feature request: $ARGUMENTS

First read `CLAUDE.md` and the problem statement requirements for this feature, then explore the relevant parts of the codebase so the spec is grounded in the actual architecture and conventions. Check what already exists before specifying anything new, since some backend capability is already in place. Build only what is genuinely missing.

Ask any clarifying questions using the AskUserQuestion tool. Once all questions are answered, write the spec to `specs/` using a numbered kebab-case filename (for example `specs/001-bookmarks.md`) with these sections:

- Problem / motivation
- User stories
- Existing code to reuse (what is already there and what is missing)
- Acceptance criteria (each one testable)
- API contract (endpoints, request/response shapes using the `{ success, message, data }` envelope, status codes, auth)
- Data model changes (exact Mongoose schema deltas)
- UI changes (components, Redux slices, endpoint config entries, routes)
- Edge cases and error handling (auth, authorization, validation, empty states)
- Out of scope
- Test plan (backend unit and integration, frontend unit and integration)

Follow the existing layering: routes -> controllers -> services -> models on the backend, and endpoint config -> service -> Redux slice -> component on the frontend.

Do NOT write any implementation code. Write only the specification.
