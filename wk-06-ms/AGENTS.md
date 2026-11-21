# Workspace Agent Instructions

## Project Boundaries

- This workspace contains two independent Vite apps. Treat `threadhive-frontend-starter/` as the primary development target; use `threadhive-frontend-solution/` only as a reference unless the user explicitly asks to edit it.
- Each app has its own `package.json`. Run npm scripts from the selected app root, and verify the terminal's working directory before using relative paths.
- See the [prompt examples](threadhive-frontend-starter/resources/prompts.md) for task-specific guidance; don't duplicate their full content here.

## Architecture and Data

- `src/App.jsx` composes the app shell; `src/pages/User/Home.jsx` fetches recent threads and switches to `ThreadPage`; `ThreadPage` owns comment loading and composes `ThreadCard`, `CommentForm`, and `CommentList`.
- Data services under `src/services/` currently read `data/dummyData.js`. Check that file for actual field names rather than assuming API shapes.
- `Home` passes `threads` and `onSelect` to `ThreadList`. `ThreadCard` is the expanded thread-detail view and accepts `thread` and `goBack`; don't treat it as a list-item component without first reconciling that API with the project brief.
- Confirm subreddit field naming across the dummy data and detail view before changing rendering; list and detail code may use different names.

## Implementation Conventions

- Use the existing React function-component and hooks patterns. Keep changes scoped to the owning page/component and its adjacent styles or tests.
- Prefer the installed React-Bootstrap components and Bootstrap utility classes for new UI, while preserving existing component-specific CSS where it carries app styling. Use semantic controls and accessible labels.
- Reuse `src/components/Shared/VoteButtons.jsx` for voting controls rather than recreating its buttons.

## Styling

1. Prefer React-Bootstrap components over raw HTML:
   - Use `Card` instead of `div` wrappers.
   - Use `Button` instead of `button`.
   - Use `Badge` instead of `span` elements with badge classes.
   - Use React-Bootstrap form components instead of raw inputs.
   - Use `Container`, `Row`, and `Col` for layout.
2. Prefer Bootstrap utility classes over custom CSS:
   - Spacing: `m-*`, `p-*`, `gap-*`, `mb-*`, `mt-*`.
   - Layout: `d-flex`, `justify-content-*`, `align-items-*`.
   - Typography: `fw-bold`, `text-muted`, `small`.
   - Borders: `border`, `rounded`, `shadow-sm`.
   - Backgrounds: `bg-light`, `bg-body-tertiary`.
3. Avoid unnecessary custom CSS classes, inline styles, wrapper elements, and deeply nested layouts.
4. Maintain responsiveness, a consistent spacing rhythm (prefer `gap-2`, `gap-3`, `mb-3`), clear visual hierarchy, semantic structure, and accessibility (`aria-label`, appropriate button types).

## Build and Test

- From the selected app root: `npm run dev`, `npm run build`, `npm test`, and `npm run lint`.
- The starter has Vitest and Testing Library dependencies, a `tests/setup.js` file, and a small test suite. Expand coverage based on changed behavior; the solution's tests are reference material, not starter tests.
- In the starter, `npm run prettier` runs `lint-staged` on staged files. It is not a general formatter for unstaged files; avoid formatting unrelated files.
