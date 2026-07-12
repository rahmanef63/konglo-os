# Contributing — Konglo OS

Next 16 · React 19 · Tailwind v4 · Convex · `@convex-dev/auth`, built to **rr
conventions** (vertical slices). See `CLAUDE.md` for the conventions and `README.md`
for the product tour.

## The gate (run before every commit)

All four must be green — the same gate the pre-push hook enforces.

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

- `tsc --noEmit` — TypeScript strict, no `any`.
- `pnpm lint` — eslint 9 flat config (`eslint-config-next`).
- `pnpm test` — vitest unit + component + convex suites.
- `pnpm build` — `next build` (standalone). A red build never gets pushed; do not
  `git push --no-verify`.

## Slice conventions

- One feature per folder: `frontend/slices/<slug>/` (UI) + `convex/features/<slug>/`
  (schema + queries + mutations). `registry.tsx` maps slug→screen; `menu.ts` is the
  menu SSOT. Cross-slice imports only through `@/frontend/shared`.
- Every public Convex fn validates `args` and calls `requireUser` / `requireAdmin` /
  `requirePrincipal`. Reads use `.withIndex(...).take(N)` — never a bare `.collect()`.
- No raw hex in slices — use the `@theme` tokens in `app/globals.css`. RBAC SSOT is
  `lib/roles.ts`; number/date format SSOT is `lib/format.ts`.
- `_generated/` is committed. Keep files under ~200 lines.

## Tests

```bash
pnpm test           # full vitest run (lib + jsdom components + convex)
pnpm test:convex    # convex-test suite only (queries / mutations / RBAC)
```

End-to-end smoke specs live in `e2e/*.spec.ts` (Playwright, `playwright.config.ts`)
and are CI-only — they run in a dedicated job where Chromium is installed. Author
specs so they typecheck; let CI execute them. Point them at a running app with
`E2E_BASE_URL=<your-url> pnpm test:e2e`.

## Configuration

Everything environment-specific is env-driven — see `.env.example`. Set your Convex
deployment URLs (`NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL`) as build
args, and your owner/admin email via `PRINCIPAL_EMAIL`. Never hardcode a real
deployment, domain, or email into the repo.

## Deploy

`pnpm build` produces a standalone server (`output: "standalone"`), containerized by
the `Dockerfile`. Deploy it anywhere that runs a Node server or Docker image and set
the env above. `scripts/deploy-verify.sh` (`pnpm deploy:verify`) is a reference
build-and-verify loop for a Dokploy + Convex setup — all inputs are env-driven.

## Where errors / logs live

- **Convex** (backend errors, function logs): `pnpm exec convex logs`, or the Convex
  dashboard for your deployment.
- **Frontend**: browser console for client errors; your host's build/runtime logs.
- **Probes**: `GET /api/health` (liveness) and `GET /api/ready` (Convex reachability).
