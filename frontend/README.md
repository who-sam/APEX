# APEX Frontend

The web client for **APEX** — the classroom examination portal. Built with React 18, Vite,
TypeScript, Tailwind CSS, and shadcn/ui. It talks to the Go backend over `/api`.

See the [root README](../README.md) for the full-stack overview, architecture, and deployment.

## Getting started

```sh
# from frontend/
bun install          # or: npm install
bun run dev          # Vite dev server on http://localhost:5173
```

The dev server proxies `/api` to the backend at `http://localhost:8080` (see
[`vite.config.ts`](vite.config.ts)), so run the Go API alongside it.

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start the Vite dev server (port 5173, HMR). |
| `build` | Production build to `dist/`. |
| `preview` | Serve the production build locally. |
| `lint` | Run ESLint over the project. |
| `test` | Run the Vitest suite once. |
| `test:watch` | Run Vitest in watch mode. |

## Environment variables

All are optional; unset values degrade gracefully (links hide, features no-op).

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for API calls. Defaults to `/api` (the dev proxy / same-origin in prod). |
| `VITE_GOOGLE_CLIENT_ID` | Google Identity Services web client ID. Must match `GOOGLE_CLIENT_ID` on the backend. |
| `VITE_GITHUB_URL` | Repository URL shown on the landing header, hero, and footer buttons. |
| `VITE_CONTACT_EMAIL` | Contact address rendered as a `mailto:` link in the footer. |

Copy [`.env.example`](.env.example) to `.env.local` (gitignored) for local development,
or set the variables in your hosting provider for production.

## Layout

```
src/
├── features/     # feature modules (auth, classes, exams, grading, dashboard, …)
├── components/   # shared UI (shadcn/ui primitives + composites)
├── pages/        # top-level route pages (Index, NotFound)
├── hooks/ lib/   # shared hooks and utilities
└── test/         # Vitest setup
```
