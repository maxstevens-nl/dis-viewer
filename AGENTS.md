# AGENTS.md

This repo is a Zero + React + Hono app with a Postgres backend and Drizzle ORM.
Use this file as operating guidance for agentic coding work.

## Project overview
- Frontend: React + Vite in `src/`
- API: Hono in `api/` (served via Vite dev server middleware)
- Data: Postgres (Docker compose in `docker/`)
- Sync: RociCorp Zero (schema in `src/schema.ts`)
- ORM: Drizzle (schema in `api/drizzleSchema.ts`, migrations in `drizzle/`)

## Commands

### Install
- Recommended: `bun install`
- Also works: `npm install`

### Dev
- UI: `bun run dev:ui`
- Zero cache: `bun run dev:zero-cache`
- Postgres (docker): `bun run dev:db-up`
- Stop Postgres: `bun run dev:db-down`
- Clean replica + volume: `bun run dev:clean`

### Build
- `npm run build`

### Lint
- `npm run lint`

### Tests
- No test runner is configured in `package.json`.
- There is no single-test command at this time.

### Drizzle / migrations
- Generate SQL migrations: `npx drizzle-kit generate --config ./drizzle.config.ts`
- Migrations output: `drizzle/`

## Repo conventions

### Language / tooling
- TypeScript is strict (`tsconfig.app.json` and `tsconfig.node.json`).
- Vite build targets ES2022.
- ESLint is enabled for `*.ts` and `*.tsx` using TypeScript ESLint rules.
- No Prettier configuration; formatting follows existing code style.

### Imports
- External packages first, then internal relative imports.
- Include `.ts` extensions for local imports (`./schema.ts`).
- Prefer named imports; default exports are used only when the module is a single primary export.

### Formatting
- Double quotes for strings.
- Semicolons are used.
- Use trailing commas where they already appear (object/array literals).
- Prefer multiline objects with one property per line when more than 2-3 fields.

### Naming
- `camelCase` for variables and functions.
- `PascalCase` for React components and types.
- `SCREAMING_SNAKE_CASE` is only for env vars.
- Database tables and columns are `snake_case` in Drizzle schema, mapped to `camelCase` fields.

### Types
- Prefer inferred types when obvious; add explicit types for public API surfaces and callbacks.
- Use `type` for object shapes (consistent with `schema.ts`).
- Favor `zod` schemas for runtime validation in API handlers.

### Error handling
- API handlers return JSON errors with status codes (`c.json(..., 400)`).
- Use `safeParse` for request validation and return validation issues.
- Use guard helpers for required env vars (see `api/db.ts` and `api/index.ts`).
- Avoid throwing in request handlers unless it is truly fatal for the request.

### React patterns
- Keep components function-based.
- Use hooks from Zero (`useZero`, `useQuery`) and React (`useState`).
- Handle missing data early with `return null` or a small empty state.

### API patterns
- Hono app uses `.basePath("/api")`.
- Requests are proxied in dev via Vite middleware in `vite.config.ts`.
- Prefer `async` handlers with clear input validation and explicit JSON responses.
- Keep API logic thin and move shared logic into helpers if it grows.

### Zero usage
- Client schema is in `src/schema.ts` and must remain aligned with server schema.
- Queries live in `src/queries.ts` and are defined with `defineQuery` + `zod` args.
- Mutators live in `src/mutators.ts`.

### Drizzle usage
- Schema in `api/drizzleSchema.ts`.
- Migrations are generated with drizzle-kit (SQL only; no runtime apply configured).

## Environment variables
- `ZERO_UPSTREAM_DB`: Postgres connection string for Zero and Drizzle.
- `ZERO_REPLICA_FILE`: path for Zero sqlite replica.
- `VITE_PUBLIC_SERVER` / `VITE_PUBLIC_ZERO_CACHE_URL`: client Zero cache URL.
- `AUTH_SECRET` is used in `api/index.ts` for JWT handling.
- The README mentions `ZERO_AUTH_SECRET`; align env names if you modify auth.

## Where to look
- API: `api/index.ts`, `api/db.ts`, `api/drizzleSchema.ts`
- Frontend: `src/App.tsx`, `src/main.tsx`
- Zero schema: `src/schema.ts`
- Drizzle migrations: `drizzle/`
- Docker Postgres: `docker/docker-compose.yml`

## Cursor / Copilot rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found in this repo.

## Change hygiene
- Keep edits minimal and in existing style.
- Prefer adding new helpers over duplicating logic.
- When editing schema-related code, update both Zero and Drizzle if needed.
