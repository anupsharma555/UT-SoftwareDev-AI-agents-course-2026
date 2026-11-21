# Week 8 publication review

This directory preserves the starter and the updated solution as separate coursework
projects. It is a source publication, not a deployed or production-qualified service.

## Corrections made during review

- Stopped the solution community sidebar from automatically repeating requests after
  empty or failed responses; navigating back to the page permits a fresh request.
- Displayed community-specific fetch errors in the solution feed and prevented a
  previous community heading from appearing on the home feed.
- Removed unused bindings, used `globalThis` in browser tests, and updated the stale
  community-state test expectation. Existing assertions and skipped tests were retained.
- Replaced non-reserved fixture contact URLs/emails with `example.com` values.
- Clarified the test-secret requirement and local-only PDF references in the README.
  The solution environment example now names a Week 8 development database.

## Validation

- Both frontend packages: ESLint and production builds passed.
- Solution frontend: 256 tests passed, 2 pre-existing tests skipped across 30 files,
  including regression coverage for empty/failed
  community responses, recovery on remount, and community-feed error display.
- Both backend packages: 187 tests passed each across 18 files, using disposable MongoDB Memory Server
  databases and a synthetic test JWT secret, without loading the development environment.
- Publication manifest checked for environment files, private credentials, machine
  configuration, dependency directories, generated build output, and course PDFs.

The staged whitespace check reports inherited trailing whitespace and end-of-file blank
lines in the imported course files. These were reviewed and retained to avoid a broad
formatting rewrite.

No dependencies were added or upgraded. Browser end-to-end interaction, live database
behavior, deployment, and a dependency vulnerability audit were not performed.

## Remaining findings

The following are source-review findings in the inherited backend implementation,
not behaviors covered by the passing suites:

1. **Author data exposure:** `src/services/threadService.js` populates full author
   documents in `fetchAllThreads` and `fetchThreadById`. The community thread query in
   `src/services/subredditService.js` does the same. Since the user model does not hide
   `password`, these response paths can serialize password hashes and email addresses.
   Restrict author projections to the public fields before using real accounts.
2. **Missing ownership checks:** authenticated thread update/delete routes delegate
   without comparing the caller with the thread author. Updates also pass the request
   body directly into the model update. Add ownership enforcement and an allowlist of
   editable fields before multi-user deployment.
3. Two pre-existing solution frontend tests remain skipped: authentication and theme
   initialization from browser storage. The starter frontend has no test script and
   retains its intentional assignment gaps.

The first two findings affect both backend copies. They are recorded here without
silently changing the assignment starter or expanding this import into backend hardening.
