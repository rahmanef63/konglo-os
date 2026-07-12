# Konglo OS — project rules for contributors (and Claude)

Family-office OS. Next 16 + React 19 + Tailwind v4 + Convex + `@convex-dev/auth`,
built to **rr conventions** (vertical slices). See `README.md` for the product tour
and `CONTRIBUTING.md` for the commit gate.

## The gate (before every commit)

`tsc --noEmit` + `pnpm lint` + `pnpm test` + `pnpm build` must all be green. A red
build never gets pushed; never `git push --no-verify`. `_generated/` is committed.

## rr conventions (SSOT)

- `proxy.ts` (NOT `middleware.ts`). Tailwind v4 via `@tailwindcss/postcss`, no
  `tailwind.config.*` — design tokens live in `app/globals.css` `@theme`. No raw hex
  in slices; use theme tokens.
- Vertical slices in `frontend/slices/<slug>/`, backend in `convex/features/<slug>/`.
  `registry.tsx` maps slug→screen, `menu.ts` is the menu SSOT. Cross-slice imports
  only through the `@/frontend/shared` barrel. ~200-line soft file cap.
- Every public Convex fn: `args` validators + `requireUser` / `requireAdmin` /
  `requirePrincipal` (`convex/_shared/auth.ts`). No bare `.collect()` — read via
  `.withIndex(...).take(N)`.
- RBAC SSOT `lib/roles.ts`; number/date format SSOT `lib/format.ts` (id-ID Rupiah).

## data-studio RBAC (SEC-001, intentional)

`cfo` (ajudan) is the business-table DB admin via the data-studio surface
(`convex/features/notiondb`) — full CRUD over subsidiaries, contacts,
philanthropyGrants, staffRoster. This is deliberate. **Exception: `heirs` (succession
/ ahli waris) is principal-ONLY.** Each registry table carries a `sensitivity` flag;
`heirs = "principal"`, so after the `data-studio` feature gate the notiondb read/write
fns ALSO call `requirePrincipal` — the admin surface must not be a back door into the
estate plan. SSOT: `notiondb/registry.ts` (Sensitivity) + `_shared/auth.ts:requirePrincipal`.
Covered by `tests/convex/authz.test.ts` (SEC-001 block).

## Working discipline

- Don't touch `.next/` — build output, gitignored.
- After a batch of edits, `git status` + `tsc`/`build` BEFORE commit — verify writes
  landed and the build is green.
- Config that's environment-specific (Convex URLs, domains, admin emails) is
  env-driven — see `.env.example`. Never hardcode a real deployment into the repo.
