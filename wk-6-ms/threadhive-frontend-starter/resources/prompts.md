
# Part 2: AI-Assisted Development with GitHub Copilot


## 2.1 Updating Custom Instructions for Frontend Development

```
#### Styling
1. React-Bootstrap components over raw HTML:
   - Card instead of div wrappers
   - Button instead of button
   - Badge instead of span with badge classes
   - Form components instead of raw inputs
   - Container / Row / Col for layout

2. Prefer Bootstrap utility classes over custom CSS:
   - Spacing: m-*, p-*, gap-*, mb-*, mt-*
   - Layout: d-flex, justify-content-*, align-items-*
   - Typography: fw-bold, text-muted, small
   - Borders: border, rounded, shadow-sm
   - Backgrounds: bg-light, bg-body-tertiary

3. Do NOT:
   - Invent unnecessary custom CSS classes
   - Use inline styles unless unavoidable
   - Add unnecessary wrapper divs
   - Over-nest layout structures

4. Maintain:
   - Responsiveness
   - Proper spacing rhythm (prefer gap-2, gap-3, mb-3)
   - Clear visual hierarchy and semantic structure
   - Accessibility (aria-label, proper button types)
```


```
Generate a Forgot Password component that displays a form with an email input and a submit button.
```

## 2.2 Augmenting Agents with Skills


1.
   ```
   ---
   name: fix
   description: Use when you have lint errors, formatting issues, or before committing code to ensure it passes CI.
   ---

   # Fix Lint and Formatting

   ## Instructions

   1. Run `npm run prettier` to fix formatting
   2. Run `npm run lint` to check for remaining lint issues
   3. Report any remaining manual fixes needed

   ## Common Mistakes

   - **Running prettier on wrong files** - `npm run prettier` only formats changed files
   - **Ignoring lint errors** - These will fail CI, fix them before committing
   ```

2.
   ```
   Install Prettier and ESLint for this project. Add scripts to package.json for running them on changed files.
   ```

   ```json
   "scripts": {
     "prettier": "prettier --write .",
     "lint": "eslint ."
   }
   ```

3.
   ```
   Use the React fix skill to ensure my code is clean before committing.
   ```


## 2.3 Visual Context with the Integrated Browser

### Referencing Browser Content in Copilot Prompts (Agent Mode)

4.
   ```
   1. Make the corners of the badge sharp.
   2. Change the badge background to a uniform dark green without a gradient.
   3. Keep the text inside the badge in lowercase
   ```

## 2.4 Generate Unit Tests with GenAI

```
/create-agent Create an agent called 'react-testing-agent' that creates unit tests for React components. Use 'React Testing Library' as the testing library and Vitest as the test runner. Keep all the tests in a separate top-level tests/ directory. Keep the agent workspace scoped.
```

```
Generate unit tests for the ThreadCard component. Cover rendering, props, and interactions.
```

## 2.5 Visualizing Prompt Caching with the Cache Explorer


### Observe a cache hit

1.
   ```
   Explain what the ThreadCard component renders and list the props it expects.
   ```

2.
   ```
   Now describe how VoteButtons is used inside it.
   ```

### Cause and diagnose a cache miss

```
Summarize the CommentList component in one sentence.
```