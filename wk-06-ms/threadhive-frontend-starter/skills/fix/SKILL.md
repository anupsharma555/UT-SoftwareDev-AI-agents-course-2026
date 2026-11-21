---
name: fix
description: Use when you have lint errors, formatting issues, or
before committing code to ensure it passes CI.
---
# Fix Lint and Formatting
## Instructions
1. Run `npm run prettier` to fix formatting
2. Run `npm run lint` to check for remaining lint issues
3. Report any remaining manual fixes needed
## Common Mistakes
- **Running prettier on wrong files** - `npm run prettier` only
formats changed files
- **Ignoring lint errors** - These will fail CI, fix them before
committing
