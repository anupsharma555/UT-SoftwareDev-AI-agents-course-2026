# ThreadHive Frontend Workspace Guide

## Scope

- The primary implementation target is `threadhive-frontend-starter/`.
- `threadhive-frontend-soln/` is a completed reference implementation for comparison and test expectations. Treat it as read-only unless the user explicitly asks to change it.
- Keep changes inside the project that owns the requested behavior. Do not copy solution code wholesale; preserve the starter's learning intent and existing structure.
- The course prompts and examples are in [threadhive-frontend-starter/resources/prompts.md](threadhive-frontend-starter/resources/prompts.md).

## Stack And Structure

- Both projects are React 19 applications built with Vite 6 and JavaScript/JSX modules.
- Vitest 3, JSDOM, and React Testing Library provide the test environment. ESLint 9 uses the flat config in each project's `eslint.config.js`.
- Run application code from `threadhive-frontend-starter/` unless the task explicitly targets the reference project.
- `src/main.jsx` is the browser entry point; `src/App.jsx` composes the visible application.
- `src/components/` contains reusable UI such as `Header`, `Footer`, and `Form`.
- `src/pages/Auth/` contains authentication pages and their shared `Auth.css` styles.
- `src/assets/` contains imported local assets. Keep asset imports within the component or page that uses them.
- `tests/` is the top-level location for behavior tests. `tests/setup.js` configures the test environment.

Follow the existing JSX and CSS organization. Prefer small, local changes over introducing a new state-management or styling abstraction.

## Commands: Install, Run, And Validate

From the target project directory:

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

- Use `npm test` for the complete Vitest run. For a focused check, use Vitest's file or test-name filters, for example `npm test -- tests/auth.test.jsx`.
- Run `npm run lint` after JSX or JavaScript changes and `npm run build` after changes affecting imports, assets, routing, or Vite configuration.
- Do not add generated `dist/` output to source changes; it is ignored by ESLint.
- There is no shared root package manager configuration. Install dependencies and run scripts separately in each app when both are intentionally being validated.

## Testing Expectations

- Add or update tests in the owning project's top-level `tests/` directory, using React Testing Library queries and `userEvent` for interaction.
- Authentication tests should cover accessible form fields, submit controls, controlled input updates, and the observable submit behavior or callback contract.
- Include validation branches and conditional success/error states for new form behavior, not only the happy path.
- Prefer `getByRole` and `getByLabelText`; keep labels and form controls accessible so tests reflect user behavior.
- When spying on `console.log` or other globals, restore the spy in the test to prevent cross-test contamination.
- Keep the reference project's tests as a behavioral comparison when starter tests are incomplete, but do not make tests pass by weakening assertions.

## Review Checklist

A complete review should inspect:

- behavior and state transitions for login, registration, and any new auth flow;
- accessible names, labels, keyboard-submit behavior, required fields, and useful error/success messaging;
- controlled inputs, submit prevention, callback payloads, and avoidance of stale state;
- responsive layout and CSS regressions across the existing auth components;
- local asset paths and Vite build compatibility;
- focused tests plus lint/build results.

Report findings first, ordered by severity, with a linked file path and a concise explanation of the user-visible or regression risk. Then state open questions, validation performed, and any remaining test or environment gaps. Do not report style preferences as findings unless they affect maintainability or behavior.

## Change Boundaries

- Preserve public component APIs and existing visual conventions unless the request requires a change.
- Avoid unrelated refactors, dependency upgrades, generated files, and edits to the solution project.
- Keep secrets, credentials, and real user data out of source and tests.
