# FormForge — AI Coding Standards

This file defines coding standards, architectural rules, and naming conventions
for AI coding assistants working on this codebase. All rules apply to every
generated file without exception. Read this file completely before writing code.

Full architecture reference: `ARCHITECTURE.md`

---

## 1. Stack

```
Frontend:  Next.js 14 App Router       apps/web
Backend:   Express.js + tRPC           apps/api
Database:  Drizzle ORM + Neon          packages/db
Shared:    Zod schemas, types, errors  packages/shared
Logging:   pino + pino-http             Never use console.log, console.warn, or console.error in production          code. Use  the logger in backend and toast.error() or Sentry in frontend.
Icons:     lucide-react                Prefer lucide-react icons, emoji only allowed in seed data or console logs.
Animation: framer-motion               Purposeful transitions only
Styling:   Tailwind CSS + shadcn/ui
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
    db/index.ts                        Drizzle client + graceful shutdown handlers
    logger.ts                          pino instance — imported everywhere instead of console
    middleware/
      auth.ts                          requireAuth middleware
      optionalAuth.ts                  optionalAuth middleware
      rateLimit.ts                     globalLimiter / apiWriteLimiter / submissionLimiter
      error.ts                         Global error handler — ALWAYS the last middleware
    utils/
      ApiResponse.ts
      asyncHandler.ts
  trpc/
    context.ts
    router.ts                          AppRouter export + openApiDocument export
    routers/
      auth.ts
      forms.ts
      fields.ts
      responses.ts
      analytics.ts
  modules/
    auth/auth.service.ts
    forms/forms.service.ts             Contains generateUniqueSlug()
    fields/fields.service.ts
    responses/
      responses.service.ts            Contains submitResponse() + validateResponseAnswers()
      responses.service.test.ts       5 Vitest tests
    analytics/
      analytics.service.ts            Contains all 4 intelligence functions + detectSpamSubmissionCluster()
      analytics.service.test.ts       3 Vitest tests

packages/shared/src/
  index.ts                             Re-exports everything
  schemas/
    auth.schemas.ts
    forms.schemas.ts
    fields.schemas.ts
    responses.schemas.ts
  schemas/schemas.test.ts             5 Vitest boundary-value tests
  types/index.ts                      z.infer<> exports
  errors/ApiError.ts                  Shared between frontend and backend
  constants/index.ts                  FIELD_TYPES, THEMES, HTTP_STATUS
  utils/conditionalLogic.ts           resolveVisibleFieldGraph()

packages/db/src/
  index.ts
  schema/
    users.ts
    sessions.ts
    token-blocklist.ts
    forms.ts
    fields.ts
    responses.ts
    response-answers.ts
  migrations/                         drizzle-kit generate output — never use push
  seed.ts                             Idempotent seed script

apps/web/
  lib/
    auth.ts                           In-memory token management
    trpc.ts                           tRPC client setup
    store/formStore.ts                Zustand form runtime store
  components/
    engine/                           Game Engine Inspector shell components
    builder/                          Form builder specific components
    analytics/                        Analytics dashboard components
    form/FormRenderer.tsx             SHARED renderer — used in preview AND live
    shared/                           LoadingState, ErrorBoundary, EmptyState
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
    f/[slug]/page.tsx                 Public form — no auth, themed
```

---

## 3. Non-Negotiable Rules

Every rule here applies to every file generated. No exceptions.

**TypeScript**
- No `any` types. Ever. Use `unknown` and narrow, or define a proper type.
- TypeScript strict mode. Every type must be explicit.
- Named exports only. Exception: React components use default export.
- JSDoc comment on every exported function.
- Analytics types (FormStats, FormAnalyticsStats, FormInsight, FunnelStage, DropoffRow)
  are defined ONLY in `packages/shared/src/types/analytics.ts`.
  Import them from `@repo/shared` in both backend and frontend.
  Never redefine them locally.

**Express / Backend**
- Every Express route handler is wrapped with `asyncHandler()`. No raw try/catch in controllers.
- All responses use `ApiResponse` or `ApiError`. Never raw `res.json()`.
- Use `logger` from `apps/api/src/common/logger.ts`. Never `console.log` in backend code.
- `errorHandler` is always the last `app.use()` call. Never move it.
- `instrument.ts` (Sentry) is always the first import in `index.ts`. Before everything.

**Database**
- Drizzle migrations only. Run `drizzle-kit generate` then `drizzle-kit migrate`.
- Never use `drizzle-kit push` — migrations folder must have numbered SQL files.
- `response_answers.value` is `jsonb` not `text`. Supports `string[]` for multi-select.
- `responseCount` and `viewCount` on forms are atomically incremented server-side only.
- Never accept `responseCount` or `viewCount` as user input.

**Auth**
- Access token lives in module-scoped JS variable only. Never localStorage. Never sessionStorage.
- Refresh token in HttpOnly cookie with `SameSite=Lax` (not Strict — different subdomains).
- SSR auth guard in `dashboard/layout.tsx` must forward cookies manually to the API.
  Next.js server-side `fetch` does not automatically send browser cookies.

**Frontend**
- Every async React component that fetches data must implement all four states:
  ```typescript
  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorBoundary error={error} />;
  if (!data || data.length === 0) return <EmptyState />;
  return <SuccessState data={data} />;
  ```
- Import all icons from `lucide-react`. Prefer lucide-react icons, emoji only allowed in seed data or console logs.
- `framer-motion` for meaningful transitions: field cards, inspector panel,
  publish modal, form question transitions. Not on static elements.
- All dashboard components must use rounded-none (enforced in tailwind.config.ts). All panels and inputs are hard-edged.

**Data**
- Never hardcode data arrays in non-seed code. Charts derive from tRPC queries or props.
- Seed data uses deterministic cycles, not random values.

---

## 4. Form Expiry and Response Limits

We will implement `maxResponses` and `expiresAt`.

### Handler logic (responses.service.ts — inside Step 2):
```typescript
if (form.status !== 'published') throw ApiError.forbidden('Form is not accepting responses');
if (form.expiresAt && form.expiresAt < new Date()) throw ApiError.forbidden('This form has closed');
if (form.maxResponses && form.responseCount >= form.maxResponses) throw ApiError.forbidden('This form is no longer accepting responses');

---

## 5. Required Rate Limiter Names

The rate limiters must use these exact export names:

```typescript
export const globalLimiter       // Applied to ALL routes via app.use()
export const apiWriteLimiter     // Applied to auth write routes
export const submissionLimiter   // Applied to public form submission
export const passwordResetLimiter // Applied to forgot/reset-password only
```

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

// packages/shared/src/utils/conditionalLogic.ts
resolveVisibleFieldGraph(fields: Field[], answers: Record<string, string | string[]>): Field[]

// forms.service.ts
generateUniqueSlug(baseTitle: string): Promise<string>
```

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
`ApiResponse` lives in `apps/api/src/common/utils/ApiResponse.ts` (backend only).

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
  // Insert response with idempotency
  const [response] = await tx
    .insert(responses)
    .values({ ...responseData, submissionHash, submissionHashExpiresAt })
    .onConflictDoNothing()
    .returning();

  if (!response) return { duplicate: true };

  // Insert answers
  await tx.insert(responseAnswers).values(answerRows);

  // Atomic increment — never outside this transaction
  await tx.update(forms)
    .set({ responseCount: sql`${forms.responseCount} + 1` })
    .where(eq(forms.id, formId));

  return { response, duplicate: false };
});
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

---

## 14. Public Form Theme Injection

```tsx
<div data-theme={form.theme} className="min-h-screen bg-[var(--bg-primary)]">
  {['matrix', 'jujutsu-kaisen'].includes(form.theme) && (
    <ThemeBackground theme={form.theme} />
  )}
  <FormRenderer formConfig={form} theme={form.theme} mode="live" />
</div>
```

Creator dashboard always uses `:root` Game Engine Inspector variables.
Public form uses `data-theme` attribute to override CSS variables.
All 8 themes defined in `globals.css` as `[data-theme="..."]` blocks.

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

## 16. Test File Locations and Scope

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
  - SubmitResponseSchema rejects honeypot value
  - SubmitResponseSchema rejects empty answers array
  - SubmitResponseSchema accepts valid multi-select array answer
  - ConditionalLogicSchema parses valid show/hide rule
  - ConditionalLogicSchema rejects empty rules array
```

Use `describe`, `it`, `expect` from Vitest. No test framework other than Vitest.

---

## 17. Git Commit Convention

One commit per feature. Never squash. The commit history shows incremental progress.

```
feat: initialize turborepo monorepo with pnpm workspaces
feat: add drizzle schema all tables with indexes and migrations
feat: implement zod schemas in packages/shared
feat: implement custom jwt auth signup login refresh logout
feat: add token revocation via token_blocklist
feat: implement requireAuth optionalAuth middleware
feat: add tiered rate limiters and spam protection
feat: implement tRPC router context and procedure types
feat: implement forms tRPC router with slug collision handling
feat: implement fields tRPC router with upsert and reorder
feat: implement responses tRPC router with identity resolution pipeline
feat: implement analytics service with four intelligence functions
feat: add trpc-openapi and scalar api docs
feat: implement game engine inspector shell
feat: implement form builder with dnd-kit
feat: implement shared formrenderer preview and live modes
feat: implement public form page with theme engine
feat: add explore page with public forms grid
feat: implement zustand form store with sessionStorage persist
feat: implement analytics dashboard components
feat: add landing and pricing pages
feat: add qr code sharing
feat: add sentry to api and web
feat: add github actions ci pipeline
feat: add idempotent seed script 750 responses 3 themed forms
docs: write readme with architecture rationale and demo credentials
chore: configure digitalocean deployment
```

## 18. Conflict Resolution Rule

If you notice a difference between ARCHITECTURE.md, formforge-supplements.md,
or this file — in variable names, function signatures, or patterns — always
pick the option that follows these priorities in order:

1. Most type-safe (explicit types win over inferred)
2. Most readable (descriptive names win over short names)
3. Most consistent with the rest of the codebase

Examples:
- `form.id` vs `formId` → use `form.id` when you have the full object, 
  `formId` when it is passed as a standalone parameter
- `neonClient` vs `sql` → use `neonClient` (avoids naming collision with drizzle sql)
- Any signature difference → use the one in ARCHITECTURE.md as the source of truth or ask me for comformation. 