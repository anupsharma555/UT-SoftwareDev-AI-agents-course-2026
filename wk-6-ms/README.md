# ThreadHive Frontend

Two independent React and Vite applications for the ThreadHive interface:

- **`threadhive-frontend-starter/`** is the active development app.
- **`threadhive-frontend-solution/`** is a reference implementation with component and page tests.

Each app has its own dependencies and npm scripts. Run commands from the app you want to work with:

```sh
cd threadhive-frontend-starter
npm ci
npm run dev
```

Replace the directory name with `threadhive-frontend-solution` to run the reference app. In either app, use `npm test` for tests, `npm run lint` to check the source, and `npm run build` for a production build.

The current data services use local sample data in each app's `data/dummyData.js`; no backend is required to explore the interface.
