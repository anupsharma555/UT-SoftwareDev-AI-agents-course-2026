
---
## 2.2 Authentication Context and Routes Prompt (Step 1)
```
Review and complete the ThreadHive authentication context and route structure using the existing Context API pattern.

Requirements:
- In src/context/AuthContext.jsx, verify that token, user, loginUser, updateUser, and logout are provided through useAuth(). Verify that authentication state is hydrated from and persisted to localStorage consistently.
- In src/App.jsx, wrap the router with AuthProvider and add public /login and /register routes for the Login and Register components.
```
---
## 2.2 Login and Header Authentication Prompt (Step 2)
```
Complete the login and header authentication flows using the existing context and service modules.

Requirements:
- In Header.jsx, read token, user, and logout with useAuth(). Implement the Login and Register navigation actions, and make Logout call logout() before navigating to /login.
- In Login.jsx, implement handleSubmit by calling the login function from authService.js, passing the successful response to loginUser from useAuth(), and navigating to /home.
```
---
## 2.3 Create Thread Form Toggle Prompt
```
In src/pages/User/Home.jsx, add a "Create Thread" button that toggles a form into view.

Requirements:
- Add a boolean state variable called showForm, initialized to false
- Add a "➕ Create" button in the heading row of the home feed, aligned to the right of the "🏠 Home Feed" heading
- When showForm is true, render the CreateThreadForm component (from src/components/Forms/CreateThreadForm.jsx) below the heading row
- Pass an onClose prop to CreateThreadForm that sets showForm back to false
- When showForm is true, change the button label to "✕ Close"
- The button should toggle showForm on each click
```
---
## 2.4 Build Profile Page Prompt

```
Build the Profile component in src/pages/User/Profile.jsx and make the related Header.jsx and App.jsx changes described below.

Requirements:
- Import and use the useAuth() hook from src/context/AuthContext.jsx
- Display the user's name, email, bio, location, and website. The optional bio, location, and website fields are local-only profile values because the backend does not provide profile fields or a profile update endpoint; show a blank or a clear placeholder when any of these values is absent.
- Show an avatar circle with the user's first initial (uppercase); fall back to "U" if name is not set
- Add a "← Back to Home" button that uses useNavigate() to navigate to /home
- In Header.jsx, render the authenticated user's name as a button that uses useNavigate() to navigate to /profile
- In App.jsx, add a protected /profile route that renders the Profile component
- Add an "✏️ Edit Profile" toggle button that shows and hides an edit form
- In view mode, display each field (name, email, bio, location, website) with a label
- In edit mode, show form inputs for name, bio, location, and website — the email field must be present but disabled
- On save: call updateUser({ ...user, ...form }) to persist the changes in the existing local authentication state, then set editing to false. Do not add backend calls for profile fields.
- On cancel: set editing to false without saving
- Add a useEffect that syncs the form state when the user object changes (so the displayed values update after a save)
- Use the CSS classes already defined in Profile.css
```

---
## 2.5 Playwright CLI Authentication Flow Test Prompt

For task 2.5, install Playwright CLI globally, install its browser binaries and agent skills, and verify the installation:

```bash
npm install -g @playwright/cli@latest
playwright-cli install --skills
playwright-cli --help
```

With the development server running (`npm run dev`) and the backend API available, use this prompt:

```
Using playwright-cli, test the full authentication flow for the ThreadHive app running at http://localhost:5173.

Test that a new user can register, log in, and is redirected to the home page upon successful login. Then test that the user can log out and is redirected to the login page.
```
---
## Optional Exercise 1: React Compiler Setup Prompt
```
Enable the React Compiler in this Vite React frontend.

Requirements:
- In the `threadhive-frontend` folder, install the dev dependencies babel-plugin-react-compiler and eslint-plugin-react-compiler.
- Update vite.config.js so the existing @vitejs/plugin-react plugin runs babel-plugin-react-compiler.
- Update the existing eslint.config.js flat configuration to register eslint-plugin-react-compiler and enable the react-compiler/react-compiler rule.
- Do not change application behavior or unrelated source files.
- Run npm run lint and npm run build after making the changes.
- Report the files changed, the validation results, and any issues that need my attention.
```
## Optional Exercise 2, Step 1: Performance Agent Creation Prompt
```
/create-agent Create an agent called 'performance-agent' that audits the frontend codebase for performance issues. First check whether the React Compiler is installed and enabled by inspecting the frontend package configuration and build configuration. Because the React Compiler automatically memoizes the application when enabled, do not check for or report missing manual memoization such as React.memo, useMemo, or useCallback in that case. Audit the remaining performance concerns: context providers whose value is recreated on every render (causing all consumers to re-render), unnecessary prop drilling, components re-rendering due to unstable keys in lists, expensive work that runs outside of render but on every state change (e.g. in effects), and opportunities for code-splitting with React.lazy. Report each issue with the file, the problem, its impact, and a suggested fix. Only apply fixes after I confirm which ones to apply. Keep audit targets scoped to the frontend src/ folder.
```
---
## Optional Exercise 2, Step 2: Targeted Performance Audit Prompt
```
Audit ThreadList.jsx, Home.jsx, and ThreadCard.jsx for performance issues.
```
---
## Optional Exercise 2, Step 2 (Broader Audit): Full Frontend Performance Audit Prompt
```
Audit the entire frontend application under src/ for performance issues.
```