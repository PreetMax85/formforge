# FormForge — AI Coding Standards

This file defines coding standards, architectural rules, and naming conventions
for AI coding assistants working on this codebase. All rules apply to every
generated file without exception. Read this file completely before writing code.

Full architecture reference: `ARCHITECTURE.md`

---

## 1. Stack

```
Frontend:  Next.js 16 App Router (webpack build)   apps/web
Backend:   Express.js + tRPC v11                    apps/api
Database:  Drizzle ORM + Neon (serverless Postgres) packages/db
Shared:    Zod v4 schemas, types, errors            packages/shared
Logging:   pino + pino-http                         Never use console.log in
           production API code. Use the logger from
           apps/api/src/common/logger.ts.
Icons:     lucide-react                             No emoji in non-seed code.
Animation: framer-motion                             Purposeful transitions only.
Styling:   Tailwind CSS v4 + shadcn/ui              No tailwind.config.ts —
           Tailwind v4 uses @theme in globals.css.   Dashboard uses rounded-none
                                                     by convention (manual).
Charts:    Recharts (Bar, Line, Pie, PieChart)
State:     Zustand + sessionStorage persist
DnD:       @dnd-kit
Email:     Resend + React Email
Monitoring: Sentry (@sentry/nextjs v8 — requires webpack build, not Turbopack)
API Docs:  Scalar (via trpc-to-openapi)
Monorepo:  Turborepo + pnpm workspaces
```

---

## 2. Exact File Paths

Use these paths precisely. Never create alternative folder structures.

```
apps/api/src/
  instrument.ts                        Sentry init — imported FIRST in index.ts
  index.ts                             Entry point: imports createApp, calls listen
  app.ts                               createApp() factory — all middleware lives here
  common/
    config/env.ts                      Zod env validation with process.exit(1)
    db/index.ts                        Canonical Drizzle client for the API (pino-logged)
    logger.ts                          pino instance — imported everywhere instead of console
    middleware/
      auth.ts                          requireAuth middleware
      optionalAuth.ts                  optionalAuth middleware
      rateLimit.ts                     globalLimiter / apiWriteLimiter / submissionLimiter /
                                        viewLimiter / passwordResetLimiter
      error.ts                         Global error handler — ALWAYS the last middleware
    utils/
      ApiResponse.ts                   (legacy — tRPC routers use inline envelopes)
      asyncHandler.ts
  trpc/
    context.ts
    router.ts                          AppRouter export + openApiDocument export
    routers/
      auth.ts                          6 procedures, all annotated with .meta()
      forms.ts                         13 procedures, all annotated
      fields.ts                        3 procedures, all annotated
      responses.ts                     4 procedures, all annotated
      analytics.ts                     7 procedures, all annotated
  modules/
    auth/auth.service.ts
    forms/forms.service.ts             Contains generateUniqueSlug()
    fields/fields.service.ts
    responses/
      responses.service.ts            Contains submitResponse() — imports
                                        validateResponseAnswers from @repo/shared
      responses.service.test.ts       5 Vitest tests
    analytics/
      analytics.service.ts            Contains 4 intelligence functions +
                                        detectSpamSubmissionCluster() +
                                        getFieldOptionBreakdowns()
      analytics.service.test.ts       3 Vitest tests

packages/shared/src/
  index.ts                             Re-exports everything
  schemas/
    auth.bchemas.ts
    forms.schemas.ts
    fields.schemas.ts
    responses.schemas.ts
  schemas/schemas.test.ts             5 Vitest boundary-value tests
  types/index.ts                      z.infer<> exports + analytics types
  types/analytics.ts                  FormStats, FormAnalyticsStats, FormInsight,
                                        FunnelStage, DropoffRow, OptionBreakdown —
                                        defined ONLY here
  errors/ApiError.ts                  Shared between frontend and backend
  constants/index.ts                  FIELD_TYPES, THEMES, HTTP_STATUS, THEME_META
  utils/
    conditionalLogic.ts               resolveVisibleFieldGraph()
    buildFieldZodSchema.ts            buildFieldZodSchema() + validateResponseAnswers() —
                                        dynamic Zod generation from field configs
    buildFieldZodSchema.test.ts       11 Vitest tests

packages/db/src/
  index.ts                            Drizzle client for the SEED SCRIPT ONLY
                                        (API has its own client at apps/api/src/common/db)
  schema/
    users.ts
    sessions.ts
    token-blocklist.ts
    forms.ts
    fields.ts
    responses.ts
    response-answers.ts
  migrations/                         drizzle-kit generate output — never use push
  seed.ts                             Idempotent seed script (750 responses, 3 themed forms)

apps/web/
  lib/
    auth.ts                           In-memory token management
    trpc.ts                           (deleted — orphan, real client in providers/global.tsx)
    store/formStore.ts                Zustand form runtime store (no getVisibleFields —
                                        FormRenderer calls resolveVisibleFieldGraph directly)
  components/
    engine/                           Game Engine Inspector shell components
    builder/                          Form builder specific components
    analytics/                        AnalyticsComponents.tsx (DropoffFunnel, CompletionFunnel,
                                        TimeSeries, InsightCards, FieldBreakdown,
                                        OptionBreakdownChart — pie charts per select field)
    form/FormRenderer.tsx             SHARED renderer — used in preview AND live
    shared/                           LoadingState, ErrorBoundary, EmptyState, QRCodeModal,
                                        ThemeBackground
  app/
    (marketing)/page.tsx              Landing page
    (marketing)/pricing/page.tsx      Pricing page
    (marketing)/explore/page.tsx      Public forms grid
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    dashboard/layout.tsx              SSR auth guard with cookie forwarding
    dashboard/page.tsx
    dashboard/forms/[id]/page.tsx
    dashboard/forms/[id]/builder/page.tsx
    dashboard/forms/[id]/responses/page.tsx
    dashboard/forms/[id]/settings/page.tsx
    f/[slug]/page.tsx                 Public form — no auth, themed
    global-error.tsx                  Global error boundary — catches root layout errors,
                                        reports to Sentry
  next.config.mjs                     Wrapped with withSentryConfig (webpack build)
  sentry.client.config.ts             Client-side Sentry (auto-injected by withSentryConfig)
  sentry.server.config.ts             Server-side Sentry (loaded via instrumentation.ts)
  sentry.edge.config.ts               Edge runtime Sentry
  instrumentation.ts                  Loads server + edge Sentry configs
```

---

## 3. Non-Negotiable Rules

Every rule here applies to every file generated. No exceptions.

**TypeScript**
- No `any` types. Ever. Use `unknown` and narrow, or define a proper type.
- TypeScript strict mode. Every type must be explicit.
- Named exports only. Exception: React components use default export.
- JSDoc comment on every exported function.
- Analytics types (FormStats, FormAnalyticsStats, FormInsight, FunnelStage,
  DropoffRow, OptionBreakdown) are defined ONLY in `packages/shared/src/types/analytics.ts`.
  Import them from `@repo/shared` in both backend and frontend.
  Never redefine them locally.

**Express / Backend**
- Every Express route handler is wrapped with `asyncHandler()`. No raw try/catch in controllers.
- All tRPC procedures return the envelope shape:
  `{ success: true, message: string, data: T }` (or `{ success: false, error: string }` on error).
  The legacy `ApiResponse` class exists but is unused — tRPC routers build the envelope inline.
- Use `logger` from `apps/api/src/common/logger.ts`. Never `console.log` in backend code.
  Exception: `packages/db/src/index.ts` uses `console.error` for pool errors because it
  has no pino dependency (it's the seed-script client, not the API client).
- `errorHandler` is always the last `app.use()` call. Never move it.
- `instrument.ts` (Sentry) is always the first import in `index.ts`. Before everything.

**Database**
- Drizzle migrations only. Run `drizzle-kit generate` then `drizzle-kit migrate`.
- Never use `drizzle-kit push` — migrations folder must have numbered SQL files.
- `response_answers.value` is `jsonb` not `text`. Supports `string[]` for multi-select.
- `responseCount` and `viewCount` on forms are atomically incremented server-side only.
  Never accept `responseCount` or `viewCount` as user input.
- The canonical Drizzle client for the API is `apps/api/src/common/db/index.ts`
  (with pino logging and graceful shutdown). `packages/db/src/index.ts` is a
  SEPARATE client for the standalone seed script only. Never import `db` from
  `@repo/db` in API code — import schema from `@repo/db/schema` and `db` from
  `../../common/db/index`.

**Auth**
- Access token lives in module-scoped JS variable only. Never localStorage. Never sessionStorage.
- Refresh token in HttpOnly cookie with `SameSite=Lax` (not Strict — different subdomains).
- SSR auth guard in `dashboard/layout.tsx` must forward cookies manually to the API.
  Next.js server-side `fetch` does not automatically send browser cookies.

**Frontend**
- Every async React component that fetches data must implement all four states,
  checked in THIS ORDER:
  ```typescript
  if (isLoading) {
    if (!showLoading) return null;  // useDelayedLoading delay window
    return <LoadingScreen />;
  }
  if (error)     return <ErrorState error={error} />;
  if (!data || data.length === 0) return <EmptyState />;
  return <SuccessState data={data} />;
  ```
  Checking `!data` before `isLoading` shows "not found" during the loading window.
- Import all icons from `lucide-react`. No emoji in non-seed code.
- `framer-motion` for meaningful transitions: field cards, inspector panel,
  publish modal, form question transitions. Not on static elements.
- Dashboard components use `rounded-none` by convention (applied via className).
  Tailwind v4 has no `tailwind.config.ts` — the convention is manual, not enforced.
- Build script uses `next build --webpack` because `@sentry/nextjs` v8 does not
  support Turbopack (Next.js 16 default). Dev server uses Turbopack.
- `next.config.mjs` must be wrapped with `withSentryConfig` so Sentry's
  client config is auto-injected into the browser bundle.

**Data**
- Never hardcode data arrays in non-seed code. Charts derive from tRPC queries or props.
- Seed data uses deterministic cycles, not random values.

---

## 4. Form Expiry and Response Limits

`maxResponses` is enforced atomically inside the submission transaction to
prevent TOCTOU races. The check is NOT done outside the transaction.

### Handler logic (responses.service.ts — inside the transaction):
```typescript
// Conditional atomic increment — only increments if under maxResponses cap.
// This is race-safe: the WHERE clause is evaluated at UPDATE time.
const [updated] = await tx
  .update(forms)
  .set({ responseCount: sql`${forms.responseCount} + 1` })
  .where(
    and(
      eq(forms.id, form.id),
      or(isNull(forms.maxResponses), lt(forms.responseCount, forms.maxResponses)),
    ),
  )
  .returning({ responseCount: forms.responseCount });

if (!updated) {
  // Cap reached — undo the response insert within the same transaction
  await tx.delete(responses).where(eq(responses.id, response.id));
  throw ApiError.forbidden('This form is no longer accepting responses');
}
```

The pre-transaction checks (status, expiry) remain outside:
```typescript
if (form.status !== 'published') throw ApiError.forbidden('Form is not accepting responses');
if (form.expiresAt && form.expiresAt < new Date()) throw ApiError.forbidden('This form has closed');
```

Form-level access settings are enforced after the FSM gate:
```typescript
if (form.requireEmail && !input.respondentEmail) throw ApiError.badRequest('Email is required');
if (!form.allowAnonymous && !input.respondentEmail && !input.respondentName)
  throw ApiError.badRequest('This form does not accept anonymous responses');
if (form.passwordHash && !(await bcrypt.compare(input.password ?? '', form.passwordHash)))
  throw ApiError.unauthorized('Incorrect form password');
```

---

## 5. Required Rate Limiter Names

The rate limiters must use these exact export names:

```typescript
export const globalLimiter        // Applied to ALL routes via app.use()
export const apiWriteLimiter      // Applied to auth write routes (login, signup, refresh)
export const submissionLimiter    // Applied to public form submission (5/15min)
export const viewLimiter          // Applied to view-count increments (60/15min)
export const passwordResetLimiter // Applied to forgot/reset-password only
```

`viewLimiter` is separate from `submissionLimiter` so view-count tracking isn't
starved by the strict 5/15min submission cap. Using `submissionLimiter` for view
increments corrupts the health score (40% weighted on completion rate = responses/views).

`apiWriteLimiter` MUST cover the `refresh` endpoint, not just login + signup.
Without it, a stolen refresh token can spam session-row creation (DoS via DB bloat).

---

## 6. Required Verbatim Comments

These exact comment strings must appear in their specified files.
The wording is precise — do not paraphrase.

### In `responses.service.ts` — at the start of the submit function:

```typescript
// Multi-Strategy Identity Resolution Pipeline:
// 1. Zod Payload Integrity Verification
// 2. Finite State Machine Gate (Ensure form is PUBLISHED)
// 3. Cryptographic Session Token Verification
// 4. IP/UA Fingerprint Fallback with Distributed Mutex Lock
// 5. Transactional Relational Integrity Check
```

Each numbered step must map to actual code beneath it.

### In `analytics.service.ts` — immediately before the CTE SQL block:

```typescript
// Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
```

This comment appears in `calculateQ1toQnDropoff` and `getTimeSeries`. Do NOT
place it in `computeResponseCompletionFunnel` (which does not use CTEs).

### In `analytics.service.ts` — at the top of the file:

```typescript
// Analytics Aggregation Pipeline:
// Raw responses → field-level aggregation → health scoring →
// funnel computation → insight generation → client delivery via tRPC.
```

### In `responses.service.ts` — after the transaction closes:

```typescript
// Dead Letter Queue (DLQ) pattern: email notifications dispatched
// post-transaction to prevent blocking the critical submission path.
// Failed notifications are logged via pino for manual retry.
```

### In `rateLimit.ts`:

```typescript
// Tiered rate limiting strategy with cascading defense:
// globalLimiter → apiWriteLimiter → submissionLimiter
```

### In `token-blocklist.ts`:

```typescript
// Distributed token revocation store — enables stateless JWT invalidation
// without shared session state. Periodic TTL-based cleanup via setInterval.
```

---

## 7. Required Named Functions

These exact function names must exist. Do not rename them.

```typescript
// analytics.service.ts
computeFormHealthScore(stats: FormStats): number | null
calculateQ1toQnDropoff(formId: string): Promise<DropoffRow[]>
computeResponseCompletionFunnel(formId: string): Promise<FunnelStage[]>
generateFormInsightsSummary(stats: FormAnalyticsStats): FormInsight[]
detectSpamSubmissionCluster(
  formId: string,
  newSubmission: {
    ipAddress?: string;
    answers: { value: string | string[] }[];
  }
): Promise<{ isSpam: boolean; confidence: number; reason?: string }>
getFieldOptionBreakdowns(formId: string): Promise<OptionBreakdown[]>

// packages/shared/src/utils/conditionalLogic.ts
resolveVisibleFieldGraph(fields: FieldForGraph[], answers: Record<string, string | string[]>): FieldForGraph[]

// packages/shared/src/utils/buildFieldZodSchema.ts
buildFieldZodSchema(field: FieldForValidation): z.ZodType
validateResponseAnswers(formFields: FieldForValidation[], answers: { fieldId: string; value: string | string[] }[]): { success: boolean; error?: string }

// forms.service.ts
generateUniqueSlug(baseTitle: string): Promise<string>
```

`resolveVisibleFieldGraph` uses `FieldForGraph[]` (a permissive interface with
`id: string`, `conditions: unknown`, `[key: string]: unknown`) rather than the
full Drizzle `Field` type. This is intentional — it allows both the frontend
(local `Field` type) and backend (Drizzle `Field` type) to call it without
type errors. Callers cast via `as unknown as FieldForGraph[]`.

---

## 8. API Response Shape

Every endpoint returns one of these two shapes. No exceptions.

```typescript
// Success
{ "success": true,  "message": "...", "data": { ... } }

// Error
{ "success": false, "error": "..." }
```

`ApiError` lives in `packages/shared/src/errors/ApiError.ts` (used in both apps).
tRPC routers build the success envelope inline (the legacy `ApiResponse` class
at `apps/api/src/common/utils/ApiResponse.ts` is dead code — do not use it).

---

## 9. env.ts — Exact Pattern Required

```typescript
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('[ENV] Invalid environment variables:');
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = result.data;
```

Use `safeParse` + `process.exit(1)`. Never use `parse()` directly — it throws
a ZodError that might be caught by the error handler, keeping the process alive
with a broken configuration.

---

## 10. createApp() Factory — Exact Pattern

```typescript
// apps/api/src/app.ts
export function createApp(): express.Application {
  const app = express();
  // all middleware, routes, error handler registered here
  return app;
}

// apps/api/src/index.ts
import { createApp } from './app';
const app = createApp();
app.listen(env.PORT, () => { logger.info(`Running on ${env.PORT}`); });
```

`index.ts` is thin. All logic is in `app.ts`. This enables importing `createApp()`
in test files without starting the server.

---

## 11. Submission Transaction — Exact Pattern

```typescript
return await db.transaction(async (tx) => {
  // Insert response with idempotency + emailCopySent flag
  const [response] = await tx
    .insert(responses)
    .values({
      ...responseData,
      submissionHash,
      submissionHashExpiresAt,
      emailCopySent: input.sendEmailCopy && !!input.respondentEmail,
    })
    .onConflictDoNothing({ target: responses.submissionHash })
    .returning();

  if (!response) return { duplicate: true, response: null, capReached: false };

  // Conditional atomic increment — race-safe maxResponses enforcement
  const [updated] = await tx
    .update(forms)
    .set({ responseCount: sql`${forms.responseCount} + 1` })
    .where(and(eq(forms.id, form.id), or(isNull(forms.maxResponses), lt(forms.responseCount, forms.maxResponses))))
    .returning({ responseCount: forms.responseCount });

  if (!updated) {
    await tx.delete(responses).where(eq(responses.id, response.id));
    return { duplicate: false, response: null, capReached: true };
  }

  // Insert answers
  await tx.insert(responseAnswers).values(answerRows);

  return { duplicate: false, response, capReached: false };
});
```

The submission hash includes `respondentEmail` and `respondentName` to avoid
false-positive duplicate rejection when multiple users share the same NAT IP:
```typescript
const submissionHash = createHash('sha256')
  .update(`${input.ipAddress ?? ''}:${form.id}:${input.userAgent ?? ''}:${input.respondentEmail ?? ''}:${input.respondentName ?? ''}:${Math.floor(Date.now() / 30_000)}`)
  .digest('hex');
```

---

## 12. Slug Collision Handling

`forms.create` always calls `generateUniqueSlug()` before inserting.
Never insert a slug directly from user input without a collision check.
On collision: append `nanoid(4)` suffix, retry up to 5 times.
Custom slug from creator: check DB directly, return friendly error message.

---

## 13. FormRenderer — Shared Component Rule

`FormRenderer` is used in exactly two places:
1. `dashboard/forms/[id]/builder/page.tsx` — `mode="preview"` (▶ PLAY button)
2. `f/[slug]/page.tsx` — `mode="live"` (actual public form)

Never create a second renderer. Fix bugs once, both places benefit.
The `mode` prop controls all behavioral differences.

`currentStep` must be clamped when conditional logic shrinks `visibleFields`:
```typescript
const clampedStep = Math.min(currentStep, Math.max(0, totalSteps - 1));
useEffect(() => {
  if (currentStep !== clampedStep) setCurrentStep(clampedStep);
}, [currentStep, clampedStep, setCurrentStep]);
```

`visibleFields` and `progress` must be `useMemo`'d to avoid O(n)
`resolveVisibleFieldGraph` re-evaluation per keystroke. The store does NOT
have `getVisibleFields`/`getProgress` methods — `FormRenderer` calls
`resolveVisibleFieldGraph` directly from `@repo/shared`.

---

## 14. Public Form Theme Injection

```tsx
<div data-theme={form.theme} className="min-h-screen bg-[var(--bg-primary)]">
  {['matrix', 'jujutsu-kaisen', 'ghost-of-tsushima', 'karan-aujla-concert'].includes(form.theme) && (
    <ThemeBackground theme={form.theme} />
  )}
  <FormRenderer formConfig={form} theme={form.theme} mode="live" />
</div>
```

`ThemeBackground` renders for 4 themes (matrix, jujutsu-kaisen,
ghost-of-tsushima, karan-aujla-concert). Creator dashboard always uses
`:root` Game Engine Inspector variables. Public form uses `data-theme`
attribute to override CSS variables. All 8 themes defined in `globals.css`
as `[data-theme="..."]` blocks.

---

## 15. Honeypot Anti-Spam Pattern

In `SubmitResponseSchema`:
```typescript
_hp: z.string().optional()
```

The honeypot field is accepted by the schema (no `.max(0)`) so bots never
receive a validation error that would reveal the honeypot exists. The actual
check happens in the service layer, returning a **silent fake success**:

In `submitResponse()`, before any DB work:
```typescript
if (input._hp && input._hp.length > 0) {
  // Return fake success — bot gets 200, no DB insert, no log
  return { success: true, message: 'Response submitted successfully.' };
}
```

Frontend honeypot input: `style={{ display: 'none', position: 'absolute' }}`

---

## 16. Dynamic Zod Validation

The imperative `validateResponseAnswers` loop has been replaced with a dynamic
Zod schema generator. Every constraint in `field.config` JSONB is now enforced:

```typescript
// packages/shared/src/utils/buildFieldZodSchema.ts
buildFieldZodSchema(field: FieldForValidation): z.ZodType
```

Field type → Zod schema mapping:
- `short_text` / `long_text`: `z.string()` with `.min(config.minLength)` / `.max(config.maxLength)`
- `email`: `z.string().email()`
- `number`: `z.string().refine(Number)` with `.refine(v => v >= config.min)` / `.refine(v => v <= config.max)`
- `single_select` / `dropdown`: `z.string().refine(v => config.options.includes(v))`
- `multi_select`: `z.array(z.string()).refine(arr => arr.every(v => options.includes(v)))` with `.max(config.maxSelections)`
- `checkbox`: `z.string().refine(v => v === 'true' || v === 'false')`
- `rating`: `z.string().refine(v => 1 <= Number(v) <= config.max)`
- `date`: `z.string()` with `.refine(v => new Date(v) >= config.minDate)` / `.refine(v => new Date(v) <= config.maxDate)`

`validateResponseAnswers` is exported from `@repo/shared` and used by both the
API (`responses.service.ts`) and the frontend (`FormRenderer.tsx` preview mode).

---

## 17. Pagination — Composite Cursor

All cursor-based queries use a composite cursor `(createdAt, id)` with
`ORDER BY createdAt DESC, id DESC`. This prevents skipped/duplicate rows
that occur when cursoring on `id` (random UUIDs) while sorting on `createdAt`.

```typescript
// Cursor format: ISO timestamp + "|" + UUID
const nextCursor = hasMore ? `${last.createdAt.toISOString()}|${last.id}` : null;

// Decoding:
const sepIdx = opts.cursor.lastIndexOf('|');
const cursorCreatedAt = new Date(opts.cursor.slice(0, sepIdx));
const cursorId = opts.cursor.slice(sepIdx + 1);

// WHERE clause:
or(
  lt(table.createdAt, cursorCreatedAt),
  and(eq(table.createdAt, cursorCreatedAt), lt(table.id, cursorId)),
)
```

Cursor schema fields use `z.string()`, not `z.string().uuid()`.

---

## 18. OpenAPI Annotations

Every tRPC procedure must have `.meta({ openapi: { method, path, tags, description } })`.
This powers the Scalar API docs at `/docs`. All 33 procedures across 5 routers
are annotated.

Tags group endpoints in the docs:
- `['Auth']` — 6 procedures
- `['Forms']` — 13 procedures
- `['Fields']` — 3 procedures
- `['Responses']` — 4 procedures
- `['Analytics']` — 7 procedures

Use `/forms/by-id/{id}` for authenticated form lookup to avoid path collision
with the public `/forms/{slug}` route.

---

## 19. Sentry Configuration

`@sentry/nextjs` v8 does not support Turbopack. Production builds must use
`next build --webpack` (dev server keeps Turbopack). `next.config.mjs` must
be wrapped with `withSentryConfig` so the client config is auto-injected:

```javascript
import { withSentryConfig } from '@sentry/nextjs';
export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  disableLogger: true,
});
```

`app/global-error.tsx` must exist to catch React render errors in the root
layout that `error.tsx` cannot capture. It calls `Sentry.captureException`.

---

## 20. Test File Locations and Scope

```
apps/api/src/modules/responses/responses.service.test.ts
  - rejects text for number field
  - rejects missing required field
  - rejects invalid email format
  - accepts valid submission
  - returns silent success when honeypot is filled

apps/api/src/modules/analytics/analytics.service.test.ts
  - computeFormHealthScore returns integer between 0 and 100
  - computeFormHealthScore weights completion rate at 40%
  - generateFormInsightsSummary returns array of FormInsight objects

packages/shared/src/schemas/schemas.test.ts
  - SubmitResponseSchema accepts honeypot value (silent pass-through)
  - SubmitResponseSchema rejects empty answers array
  - SubmitResponseSchema accepts valid multi-select array answer
  - ConditionalLogicSchema parses valid show/hide rule
  - ConditionalLogicSchema rejects empty rules array

packages/shared/src/utils/buildFieldZodSchema.test.ts
  - buildFieldZodSchema enforces number min/max from config
  - buildFieldZodSchema enforces text minLength/maxLength from config
  - buildFieldZodSchema enforces single_select options from config
  - buildFieldZodSchema enforces multi_select maxSelections from config
  - buildFieldZodSchema enforces date minDate/maxDate from config
  - validateResponseAnswers rejects number below config min
  - validateResponseAnswers rejects text below config minLength
  - validateResponseAnswers rejects single_select option not in config
  - validateResponseAnswers rejects required checkbox unchecked
  - validateResponseAnswers accepts valid submission with config constraints
  - validateResponseAnswers skips optional field with no answer
```

Use `describe`, `it`, `expect` from Vitest. No test framework other than Vitest.

---

## 21. Git Commit Convention

One commit per logical concern. Never squash. The commit history shows
incremental progress.

```
fix(web): dashboard loading states and hydration
fix(web): wire sentry client-side replay and errors
feat(api): dynamic zod validation from field configs
fix(api): harden submission pipeline
fix(api): rate limiters for refresh and view-count
feat: option-wise field breakdown analytics
docs(api): openapi meta annotations for all procedures
chore: remove dead code and consolidate db client
chore: add opencode mcp servers plugins and agents
docs: rewrite AGENTS.md to match current codebase
```

---

## 22. Conflict Resolution Rule

If you notice a difference between ARCHITECTURE.md, this file, or the actual
code — in variable names, function signatures, or patterns — always pick the
option that follows these priorities in order:

1. Most type-safe (explicit types win over inferred)
2. Most readable (descriptive names win over short names)
3. Most consistent with the rest of the codebase

If the code disagrees with this file, the code wins (this file is documentation,
not the source of truth). Update this file to match the code.

Examples:
- `form.id` vs `formId` → use `form.id` when you have the full object,
  `formId` when it is passed as a standalone parameter
- `neonClient` vs `db` → use `db` (avoids naming collision with drizzle `sql`)
- Any signature difference → check the code first, then update this file
