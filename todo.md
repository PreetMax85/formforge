# FormForge — 24h Backlog

> **Deadline**: 2026-05-27 (today: 2026-05-26)
> **Last audit**: 2026-05-26 (verified against source, not assumed)

---

## STATUS SNAPSHOT (verified)

- **`pnpm typecheck`: 7/7 pass** as of 2026-05-26 after fixing `packages/trpc/tsconfig.json` (was missing the `module: preserve` + `moduleResolution: bundler` override that every other package has).
- **Zero test files exist.** CI runs `pnpm turbo run test` which silently no-ops.
- **Creator-email notification broken.** `responses.service.ts:163` sends to hard-coded empty string. Drizzle `formsRelations.creator` already exists — fix is extending the `with:` clause.
- **No deployment config anywhere** (no `vercel.json`, `.do/app.yaml`, `Dockerfile`, `render.yaml`, `fly.toml`). Hackathon requires deployed demo.
- **README is 28 lines.** Missing architecture diagram, seeded form URLs, live URL, scoring map.
- **Conditional logic UI missing.** `resolveVisibleFieldGraph` is implemented; `formStore.getVisibleFields` calls it; `FormRenderer` respects it. Only the editor in `FieldInspector.tsx` is missing.

---

## P0 — SHIP BLOCKERS (today)

- [x] Fix `@repo/trpc` typecheck (override `module`/`moduleResolution` in `packages/trpc/tsconfig.json`) ← done 2026-05-26
- [ ] Fix creator-email bug (`responses.service.ts`: extend `with:` clause at line 75 + use `form.creator.email` at line 163)
- [ ] Write 11 Vitest tests (file paths + bullets in TESTS section below)
- [ ] DEPLOY — Vercel for `apps/web` + Railway/Render/Fly for `apps/api` + keep Neon DB
- [ ] Update README (architecture, 3 seeded URLs, live URL, demo creds, scoring-criteria → feature map)

---

## P1 — HIGH-VALUE BONUS (4-6h)

- [ ] **Conditional logic UI** in `apps/web/components/builder/FieldInspector.tsx`. All runtime plumbing exists; only the editor is missing. Directly boosts the 15-pt "Dynamic Form Builder" criterion.
- [ ] **Form clone/duplicate** — no endpoint in `forms.service.ts` or `forms` router. ~45m: copy form row + fields rows, generate new slug.
- [ ] Verify all 3 seeded form themes render gorgeously (`/f/samurai-oath`, `/f/jjk-sorcerer-registration`, `/f/aujla-vip-backstage`). These are the Demo Day hero shots.

---

## P2 — POLISH (if time)

- [ ] Zustand `isDirty` tracking — `apps/web/lib/store/formStore.ts:1-55`
- [ ] CSRF middleware (`csrf-csrf`) — `apps/api/src/app.ts`
- [ ] Per-page `metadata` for browser tab titles — `apps/web/app/layout.tsx`
- [ ] `useEffect` dep `[form?.id]` → `[form]` — `apps/web/app/dashboard/forms/[id]/builder/page.tsx:100-104`
- [ ] ESLint config for `apps/api/`
- [ ] `robots.txt` + `sitemap.xml` — `apps/web/app/robots.ts` and `sitemap.ts`
- [ ] Custom FormForge favicon
- [ ] User-level settings page (deleted; per-form settings exists at `/dashboard/forms/[id]/settings`)
- [ ] Admin dashboard route (`users.isAdmin` exists in schema, no UI)

---

## P3 — NICE-TO-HAVE

- [ ] Field-type icons consistent between `FieldCard` and field-type selector
- [ ] Theme preview thumbnails in builder dropdown
- [ ] Loading skeletons in dashboard sub-pages
- [ ] Toast on QR code copy
- [ ] `aria-label` on DnD handles / modal close buttons

---

## TESTS — 11 Vitest tests required (AGENTS.md §16)

### `apps/api/src/modules/responses/responses.service.test.ts` (4)
Tests target the pure `validateResponseAnswers` function.
- rejects text for number field
- rejects missing required field
- rejects invalid email format
- accepts valid submission

### `apps/api/src/modules/analytics/analytics.service.test.ts` (3)
Tests target pure `computeFormHealthScore` and `generateFormInsightsSummary`.
- `computeFormHealthScore` returns integer between 0 and 100
- `computeFormHealthScore` weights completion rate at 40%
- `generateFormInsightsSummary` returns array of `FormInsight` objects

### `packages/shared/src/schemas/schemas.test.ts` (4)
- `SubmitResponseSchema` rejects empty answers array (`.min(1)` enforcement)
- `SubmitResponseSchema` accepts valid multi-select array answer
- `ConditionalLogicSchema` parses valid show/hide rule
- `ConditionalLogicSchema` rejects empty rules array

Run: `pnpm turbo run test` or per-package `pnpm --filter @repo/api test`.

**Test infra notes:**
- `apps/api/vitest.config.ts` already exists. Needs `setupFiles` to seed stub env vars (env validation `process.exit(1)`s on import).
- `packages/shared` has no `vitest.config.ts` but vitest defaults will find `*.test.ts`. Schema tests don't trigger env load.

---

## DEPLOYMENT

- [ ] Vercel project for `apps/web` (set `NEXT_PUBLIC_API_URL` to deployed API origin)
- [ ] Railway / Render / Fly for `apps/api` (Express + Neon)
- [ ] Set `APP_URL` (API env) to deployed web origin (cookies + CORS)
- [ ] Update README with both live URLs
- [ ] Verify `/docs` (Scalar) loads on deployed API
- [ ] Smoke test 3 seeded form URLs on deployed web

---

## BLOCKERS — verify before demo

- [ ] `DATABASE_URL` points to real Neon in deployed env
- [ ] Migrations applied: `pnpm --filter @repo/db drizzle-kit migrate`
- [ ] Seed run on deployed DB: `pnpm --filter @repo/db db:seed` (idempotent)
- [ ] All 3 themed forms render: `/f/samurai-oath`, `/f/jjk-sorcerer-registration`, `/f/aujla-vip-backstage`

---

## ALREADY DONE (verified in source)

### Auth
- Login, signup, JWT access + refresh, token blocklist, SSR auth guard (`dashboard/layout.tsx`)
- Module-scoped access token (no localStorage / sessionStorage)
- Honeypot `_hp` input wired via `useRef` in `FormRenderer`
- `requireEmail` + email field on last step

### Forms CRUD
- `create`, `update`, `delete`, `archive`, `publish`/`unpublish`, `byId`, `bySlug`, `explore`
- `UpdateFormSchema` covers all 6 settings fields
- `incrementView` endpoint wired (`POST /forms/{slug}/view`)
- Slug collision via `generateUniqueSlug()`

### Responses CRUD
- `submit` (Multi-Strategy Identity Resolution Pipeline: `_hp` → FSM gate → Turnstile → spam cluster → 30s dedupe hash → tx)
- `list` (cursor pagination + fieldLabel join), `byId`, `delete`
- DLQ pattern for email (creator email path is broken — see P0)

### Fields
- `upsertFieldsForForm` in single Drizzle transaction
- `reorderFields`, `deleteField`
- Temp-ID reconciliation to real UUIDs

### Analytics
- 8 service functions (`computeFormHealthScore`, `calculateQ1toQnDropoff`, `computeResponseCompletionFunnel`, `generateFormInsightsSummary`, `detectSpamSubmissionCluster`, `getFormStats`, `getTimeSeries`, `incrementViewCount`)
- All 7 tRPC procedures wired with `assertFormOwner`
- Frontend: 5 charts consolidated into `AnalyticsComponents.tsx` + `FormHealthScore` + `InsightCards`

### Public form rendering
- `/f/[slug]` page with theme injection
- `ThemeBackground` canvas effects (matrix, jjk)
- 8 themes defined in `globals.css`
- Multi-step UX with `ProgressBar`, sessionStorage scoped by mode (preview vs response)
- `ThankYouScreen`

### Settings (per-form)
- `/dashboard/forms/[id]/settings/page.tsx` — 6 toggles, sticky save bar

### Layout & nav
- Tab bar (Overview / Builder / Responses / Settings), hidden on builder
- `QRCodeModal` with `isOpen`/`formTitle`/Escape key

### Landing & marketing
- 5-section composition (Hero + Features + Themes + How It Works + CTA)
- Marketing layout wraps `/`, `/pricing`, `/explore` with shared Navbar + Footer
- Footer has copy-to-clipboard demo credentials

### Spam protection
- Tiered rate limiting (`globalLimiter` / `apiWriteLimiter` / `submissionLimiter` / `passwordResetLimiter`)
- `submissionLimiter` on `/api/v1/responses/submit` AND `/trpc/responses.submit`
- `detectSpamSubmissionCluster` (subnet + answer similarity)

### API docs
- Scalar at `/docs`, `/openapi.json`
- `bearerAuth` security scheme exposed
- `trpc-to-openapi` auto-generates spec from Zod

### DB
- Migrations `0000_brown_metal_master.sql` + `0001_skinny_jimmy_woo.sql` (generated, not pushed)
- Idempotent seed: 3 themed forms × 750 responses
- All Drizzle relations defined (users / forms / fields / responses / responseAnswers / sessions)

### Sentry
- `instrument.ts` is the first import in `apps/api/src/index.ts`
- `Sentry.setupExpressErrorHandler` before custom `errorHandler`
- 3× sentry config files in `apps/web` (client/server/edge)

### Code health
- All 6 required verbatim comments present (`responses.service.ts`, `analytics.service.ts`, `rateLimit.ts`, `token-blocklist.ts`)
- All required named functions present with correct signatures
- Pino logger used throughout backend (no `console.log`)
- All `as` casts replaced with runtime type checks in `FormField.tsx`
- Honeypot DOM input, `submissionLimiter` on REST + tRPC submit paths, OpenAPI `bearerAuth`
