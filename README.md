# HomePlate

HomePlate is a full-stack restaurant workspace and mobile app builder. It combines a React SPA, an Express API, SQLite-backed persistence, role-based auth, customizable dashboard tooling, and a mobile app designer with theming, API bindings, and export support.

## Stack

- Frontend: React 18, React Router 6, TypeScript, Vite, Tailwind CSS 3, Radix UI
- Backend: Express 5
- Persistence: SQLite
- Testing: Vitest
- Package manager: pnpm

## Main features

- SQLite-backed auth and app data
- Customizable operations dashboard
- Menu, rewards, members, analytics, and access-control modules
- Site-wide white-labeling with theme presets, font presets, uploaded fonts, logo, and favicon
- Mobile app builder with templates, reusable blocks, HTML elements, CSS editor/upload, theme presets, uploaded fonts, API event bindings, and per-app branding
- MAUI export from the builder in server mode
- GitHub Pages static mode with browser-backed demo data

## Requirements

- Node.js 22+
- pnpm 10+

## Local development

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm dev
```

The Vite dev server runs on `http://localhost:8080` and mounts the Express API during development on the same origin.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm build:pages
pnpm start
pnpm test
pnpm typecheck
```

## Authentication

Local server mode uses SQLite-backed auth with seeded demo users:

- `admin` / `admin123!`
- `designer` / `design123!`
- `operator` / `store123!`
- `analyst` / `insight123!`

The SQLite database file is created at `data/homeplate.sqlite`.

## App modes

### Server mode

Use this for normal local development and production-style hosting:

- Express API is active
- SQLite is used for auth, configs, menus, rewards, members, and builder apps
- MAUI export works

Build and run:

```bash
pnpm build
pnpm start
```

### GitHub Pages mode

Use this when deploying as a static site:

- Built with `pnpm build:pages`
- Uses `HashRouter` so route refreshes work on GitHub Pages
- Installs a browser-side `/api/*` demo layer backed by `localStorage`
- Persists auth session, dashboard preferences, site brand, menus, rewards, members, and builder app configs in the browser
- Does not run the Express server or SQLite
- Disables MAUI export

The static-mode runtime is implemented in `client/lib/static-runtime.ts` and `client/lib/static-demo-api.ts`.

## GitHub Pages deployment

The repository includes a workflow at `.github/workflows/deploy-pages.yml`.

To use it:

1. Enable GitHub Pages in repository settings.
2. Set the Pages source to `GitHub Actions`.
3. Push to `main`, or trigger the workflow manually.

The workflow builds with:

- `VITE_STATIC_MODE=true` from `.env.github-pages`
- `VITE_BASE_PATH=/<repo-name>/` so project pages deploy correctly

Your site will be published at:

```text
https://<user>.github.io/<repo-name>/
```

## Project layout

```text
client/    React SPA
server/    Express API and SQLite-backed routes
shared/    Shared API and domain types
data/      SQLite database file
```

## Notes

- The GitHub Pages build is for demo/static use, not full server deployment.
- Node may print an experimental SQLite warning because it is using Node's built-in SQLite support.
- Browserslist may warn about stale data during builds; that does not block the app from building.
