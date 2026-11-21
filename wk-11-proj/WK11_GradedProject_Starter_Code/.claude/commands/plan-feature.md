---
description: Produce an ordered implementation plan and task checklist from a spec
argument-hint: <path-to-spec>
allowed-tools: Read, Glob, Grep, Write
---
Read the spec at $ARGUMENTS and `CLAUDE.md`, then produce an implementation plan saved next to the spec as `<spec>.plan.md` (for example `specs/001-bookmarks.plan.md`).

Sequence the work bottom-up, with tests written before or alongside the code they cover:

model -> service -> controller -> route -> backend tests -> endpoint config -> frontend service -> Redux slice -> component -> wire-up -> frontend tests (including MSW handlers)

For each task, name the exact files to create or edit and the key functions. Skip any step the spec says already exists. Call out changes to shared test setup (for example `tests/setup.js` collection cleanup) and anything that could break existing tests.

End with:
- A verification section: the commands to run the backend and frontend test suites, and the manual checks to perform in the running app.
- A checklist of tasks suitable for tracking.

Do NOT write implementation code yet.
