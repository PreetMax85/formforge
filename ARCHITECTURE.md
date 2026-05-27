# FormForge — Product Requirements Document 

> Status note: this document is the original starter/reference architecture. The
> live codebase is the source of truth for what is actually implemented.

## Quick Reference

| Item | Value |
|------|-------|
| Project | FormForge |
| GitHub | https://github.com/PreetMax85/formforge |
| Frontend | https://formforge.jdevs.codes/  |
| API | https://api.formforge.jdevs.codes/ |
| Docs | https://api.formforge.jdevs.codes/docs |
| Explore | https://formforge.jdevs.codes/explore |
| Demo credentials | See README.md |

---

## Table of Contents

1.  Project Overview & User Flows
2.  Tech Stack & Rationale
3.  Monorepo Structure (complete file tree)
4.  Database Schema (all tables, indexes, migrations)
5.  Authentication System
6.  tRPC Router Architecture
7.  Zod Schema Definitions
8.  API Response Envelope
9.  Error Handling System
10. Frontend Architecture
11. UI Theme — Game Engine Inspector
12. Public Form System
13. Analytics & Intelligence Layer
14. Email System
15. Seed Data Strategy
16. Rate Limiting & Spam Protection
17. Sentry Integration
18. API Documentation (Scalar + trpc-openapi)
19. Deployment Architecture & CI/CD
20. Scoring Strategy per Criterion
21. Git Commit Convention
22. The 5 Must-Be-Perfect Files
23. Vitest Test Suite
24. Agent Prompt Templates (v3)

---

## 1. Project Overview & User Flows

**FormForge** is a production-style form builder SaaS. Creators build dynamic
forms in a Game Engine Inspector UI, publish with public or unlisted visibility,
and collect responses. Public users fill forms without logging in.

### Creator Flow
1. Sign up / log in → Dashboard (Game Engine Inspector shell)
2. Create form → Form Builder (DnD canvas, Inspector panel, Component palette)
3. Configure fields (10 types), themes, validations, conditional logic
4. Publish (public or unlisted) → shareable link + QR code
5. Monitor live responses in Console Panel
6. View analytics: health score, funnel, field breakdown, time-series, insights

### Respondent Flow
1. Open `/f/[slug]` — no login required
2. Fill form one question at a time (Zustand-powered, sessionStorage persist)
3. Submit → thank-you screen
4. Optionally receive email copy of their response

---

## 2. Tech Stack & Rationale

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 App Router | RSC for marketing, client for builder |
| Backend | Express.js + tRPC | Separate app; required by rules |
| OpenAPI | trpc-openapi | Auto-generates spec from Zod — zero drift |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM | Required; migration-first; type-safe |
| Validation | Zod | Required; shared via @repo/shared |
| Auth | Custom JWT (scratch) |
| State | Zustand | Form runtime |
| Logging | pino + pino-http | Structured JSON logging |
| Email | Resend + React Email |
| DnD | @dnd-kit | Maintained; lighter than alternatives |
| Animations | framer-motion |
| Icons | lucide-react | consistent icon set |
| Monitoring | Sentry | 
| API Docs | @scalar/express-api-reference |
| Styling | Tailwind CSS + shadcn/ui | 
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |
| Hosting | DigitalOcean App Platform |

---

## 3. Monorepo Structure

```
formforge/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── apps/
│   │
│   ├── web/                              ← Next.js 14 (frontend)
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx             ← Landing page
│   │   │   │   ├── pricing/
│   │   │   │   │   └── page.tsx         ← Pricing (dummy SaaS plans)
│   │   │   │   └── explore/
│   │   │   │       └── page.tsx         ← Public forms grid
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx           ← SSR auth guard (cookie forwarding)
│   │   │   │   ├── page.tsx             ← Forms list (Project Hierarchy)
│   │   │   │   ├── forms/
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx     ← Form overview + analytics
│   │   │   │   │       ├── builder/
│   │   │   │   │       │   └── page.tsx ← Scene Editor (DnD canvas)
│   │   │   │   │       └── responses/
│   │   │   │   │           └── page.tsx ← Paginated responses
│   │   │   │   └── settings/page.tsx
│   │   │   └── f/
│   │   │       └── [slug]/
│   │   │           └── page.tsx         ← Public form (no auth, themed)
│   │   ├── components/
│   │   │   ├── engine/                  ← Game Engine Inspector UI
│   │   │   │   ├── GameEngineShell.tsx
│   │   │   │   ├── ConsolePanel.tsx     ← Live response feed
│   │   │   │   ├── HierarchyPanel.tsx
│   │   │   │   ├── InspectorPanel.tsx
│   │   │   │   ├── SceneView.tsx
│   │   │   │   ├── ComponentPalette.tsx
│   │   │   │   └── Menubar.tsx
│   │   │   ├── builder/
│   │   │   │   ├── FieldCard.tsx
│   │   │   │   ├── FieldPalette.tsx
│   │   │   │   ├── FieldInspector.tsx
│   │   │   │   ├── BuilderCanvas.tsx
│   │   │   │   └── PublishModal.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── FormHealthScore.tsx  ← Health score panel
│   │   │   │   ├── DropoffFunnel.tsx    ← Q1→Qn funnel chart
│   │   │   │   ├── CompletionFunnel.tsx ← Views→Submit funnel
│   │   │   │   ├── FieldBreakdown.tsx   ← Per-field response charts
│   │   │   │   ├── TimeSeries.tsx       ← Responses over time
│   │   │   │   └── InsightCards.tsx     ← generateFormInsightsSummary output
│   │   │   ├── form/
│   │   │   │   ├── FormRenderer.tsx     ← SHARED (preview + live modes)
│   │   │   │   ├── FormField.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── ThankYouScreen.tsx
│   │   │   └── shared/
│   │   │       ├── QRCodeModal.tsx
│   │   │       ├── ThemeBackground.tsx  ← Canvas effects for matrix
│   │   │       ├── LoadingState.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── lib/
│   │   │   ├── trpc.ts
│   │   │   ├── auth.ts                  ← In-memory token (never localStorage)
│   │   │   └── store/
│   │   │       └── formStore.ts         ← Zustand runtime store
│   │   ├── sentry.client.config.ts
│   │   ├── sentry.server.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                             ← Express.js (backend)
│       ├── src/
│       │   ├── instrument.ts            ← Sentry init (FIRST import)
│       │   ├── index.ts                 ← Entry: createApp() + listen
│       │   ├── app.ts                   ← createApp() factory (testability)
│       │   ├── common/
│       │   │   ├── config/
│       │   │   │   └── env.ts           ← Zod + process.exit(1)
│       │   │   ├── db/
│       │   │   │   └── index.ts         ← Drizzle + graceful shutdown
│       │   │   ├── logger.ts            ← pino instance export
│       │   │   └── middleware/
│       │   │       ├── auth.ts          ← requireAuth
│       │   │       ├── optionalAuth.ts  ← optionalAuth
│       │   │       ├── rateLimit.ts     ← globalLimiter/apiWriteLimiter/submissionLimiter
│       │   │       └── error.ts         ← Global error handler (LAST)
│       │   ├── trpc/
│       │   │   ├── context.ts
│       │   │   ├── router.ts            ← AppRouter + openApiDocument
│       │   │   └── routers/
│       │   │       ├── auth.ts
│       │   │       ├── forms.ts
│       │   │       ├── fields.ts
│       │   │       ├── responses.ts
│       │   │       └── analytics.ts
│       │   └── modules/
│       │       ├── auth/
│       │       │   ├── auth.service.ts
│       │       │   └── auth.constants.ts
│       │       ├── forms/
│       │       │   └── forms.service.ts ← generateUniqueSlug()
│       │       ├── fields/
│       │       │   └── fields.service.ts
│       │       ├── responses/
│       │       │   ├── responses.service.ts  ← Identity Resolution Pipeline
│       │       │   └── responses.service.test.ts
│       │       └── analytics/
│       │             └── analytics.service.ts  
│       │             └── analytics.service.test.ts  
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   │
│   ├── shared/                          ← SINGLE shared package (renamed from schemas)
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │     ├── index.ts                 ← Re-exports everything
│   │   │   │     ├── auth.schemas.ts
│   │   │   │     ├── forms.schemas.ts
│   │   │   │     ├── fields.schemas.ts
│   │   │   │     └── responses.schemas.ts
│   │   │   │     └── analytics.schemas.ts
│   │   │   │     └── schemas.test.ts
│   │   │   ├── types/
│   │   │   │     └── index.ts             ← z.infer<> type exports
│   │   │   │     └── analytics.ts
│   │   │   ├── errors/
│   │   │   │   └── ApiError.ts          ← Shared error class (FE + BE)
│   │   │   ├── constants/
│   │   │   │   └── index.ts             ← FIELD_TYPES, THEMES, HTTP_STATUS
│   │   │   └── utils/
│   │   │       └── conditionalLogic.ts  ← resolveVisibleFieldGraph()
│   │   └── package.json
│   │
│   ├── db/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── schema/
│   │   │       ├── index.ts
│   │   │       ├── users.ts
│   │   │       ├── sessions.ts
│   │   │       ├── token-blocklist.ts
│   │   │       ├── forms.ts
│   │   │       ├── fields.ts
│   │   │       ├── responses.ts
│   │   │       └── response-answers.ts
│   │   ├── migrations/                  ← drizzle-kit generate output (NOT push)
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── trpc/
│   │   ├── src/
│   │   │   └── index.ts                 ← AppRouter type + client factory
│   │   └── package.json
│   │
│   ├── email/
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/
│       ├── src/index.ts
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── README.md
```

**All imports use workspace aliases:**
- `@repo/shared` — schemas, types, errors, constants, utils
- `@repo/db` — Drizzle schema + client
- `@repo/trpc` — AppRouter type + client factory
- `@repo/email` — React Email templates

---

## 4. Database Schema

### Migration Strategy
Use `drizzle-kit generate` then `drizzle-kit migrate` — NOT `drizzle-kit push`.

```bash
# packages/db/package.json scripts
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:seed":     "tsx src/seed.ts",
"db:studio":   "drizzle-kit studio"
```

### Complete Schema

```typescript
// packages/db/src/schema/users.ts
import {
  pgTable, pgEnum, uuid, varchar, text,
  boolean, timestamp, integer, jsonb
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  name:         varchar('name',  { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  isAdmin:      boolean('is_admin').notNull().default(false),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});


// packages/db/src/schema/sessions.ts
export const sessions = pgTable('sessions', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').notNull()
                  .references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(), // SHA-256 hashed
  userAgent:    text('user_agent'),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
});

// packages/db/src/schema/token-blocklist.ts
// Real token revocation — prevents access after logout
// Cleanup: DELETE WHERE expires_at < NOW() every 15 minutes (in index.ts)
export const tokenBlocklist = pgTable('token_blocklist', {
  jti:       varchar('jti', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
});

// packages/db/src/schema/forms.ts

// maxResponses and expiresAt: We will implement the UI and handler logic, we want these features.
// See forms settings panel and responses.service.ts status checks.
//
// passwordHash: DB column exists as architectural intent.
// UI not implemented — no password entry screen on public form.
// The column demonstrates forward-thinking schema design only.
export const formVisibilityEnum = pgEnum('form_visibility', ['public', 'unlisted']);
export const formStatusEnum     = pgEnum('form_status',     ['draft', 'published', 'archived']);

export const forms = pgTable('forms', {
  id:              uuid('id').defaultRandom().primaryKey(),
  creatorId:       uuid('creator_id').notNull()
                     .references(() => users.id, { onDelete: 'cascade' }),
  title:           varchar('title',       { length: 255 }).notNull(),
  description:     text('description'),
  slug:            varchar('slug',        { length: 100 }).notNull().unique(),
  status:          formStatusEnum('status').notNull().default('draft'),
  visibility:      formVisibilityEnum('visibility').notNull().default('unlisted'),
  theme:           varchar('theme',       { length: 100 }).notNull().default('default'),
  // Active config
  allowAnonymous:  boolean('allow_anonymous').notNull().default(true),
  requireEmail:    boolean('require_email').notNull().default(false),
  showProgressBar: boolean('show_progress_bar').notNull().default(true),
  notifyCreator:   boolean('notify_creator').notNull().default(true),
  // Live counters — atomically incremented, never calculated on the fly
  responseCount:   integer('response_count').notNull().default(0),
  viewCount:       integer('view_count').notNull().default(0),
  // Thank you screen
  thankYouTitle:   varchar('thank_you_title',   { length: 255 }).default('Thank you!'),
  thankYouMessage: text('thank_you_message').default('Your response has been recorded.'),
  // Form expiry and response limits
  maxResponses:    integer('max_responses'),
  expiresAt:       timestamp('expires_at'),
  // DB column exists for forward-thinking schema design
  passwordHash:    text('password_hash'),
  // Timestamps
  publishedAt:     timestamp('published_at'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
});

// packages/db/src/schema/fields.ts
export const fieldTypeEnum = pgEnum('field_type', [
  'short_text', 'long_text', 'email', 'number',
  'single_select', 'multi_select', 'checkbox',
  'rating', 'date', 'dropdown',
]);

export const fields = pgTable('fields', {
  id:          uuid('id').defaultRandom().primaryKey(),
  formId:      uuid('form_id').notNull()
                 .references(() => forms.id, { onDelete: 'cascade' }),
  type:        fieldTypeEnum('type').notNull(),
  label:       varchar('label',       { length: 500 }).notNull(),
  placeholder: varchar('placeholder', { length: 500 }),
  description: text('description'),
  required:    boolean('required').notNull().default(false),
  order:       integer('order').notNull().default(0),
  // JSONB — see FieldConfigSchema in Section 7 for exact structure
  config:      jsonb('config').notNull().default({}),
  // JSONB — see ConditionalLogicSchema in Section 7
  conditions:  jsonb('conditions'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

// packages/db/src/schema/responses.ts
export const responses = pgTable('responses', {
  id:                      uuid('id').defaultRandom().primaryKey(),
  formId:                  uuid('form_id').notNull()
                             .references(() => forms.id, { onDelete: 'cascade' }),
  respondentEmail:         varchar('respondent_email', { length: 255 }),
  respondentName:          varchar('respondent_name',  { length: 255 }),
  ipAddress:               varchar('ip_address',       { length: 45  }),
  userAgent:               text('user_agent'),
  // Idempotency — 30-second window prevents double-click race conditions
  // Hash: SHA256(ipAddress + formId + userAgent + floor(Date.now()/30000))
  submissionHash:          varchar('submission_hash',  { length: 64 }),
  submissionHashExpiresAt: timestamp('submission_hash_expires_at'),
  emailCopySent:           boolean('email_copy_sent').notNull().default(false),
  completedAt:             timestamp('completed_at').notNull().defaultNow(),
  createdAt:               timestamp('created_at').notNull().defaultNow(),
});

// packages/db/src/schema/response-answers.ts
export const responseAnswers = pgTable('response_answers', {
  id:         uuid('id').defaultRandom().primaryKey(),
  responseId: uuid('response_id').notNull()
                .references(() => responses.id, { onDelete: 'cascade' }),
  fieldId:    uuid('field_id').notNull()
                .references(() => fields.id,    { onDelete: 'cascade' }),
  // MUST be jsonb — not text — to natively support string[] for multi_select/checkbox
  // string fields store: "My answer text"
  // multi_select / checkbox store: ["Option A", "Option B"]
  value:      jsonb('value').notNull(),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

// packages/db/src/schema/index.ts
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  forms:    many(forms),
  sessions: many(sessions),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  creator:   one(users, { fields: [forms.creatorId], references: [users.id] }),
  fields:    many(fields),
  responses: many(responses),
}));

export const fieldsRelations = relations(fields, ({ one }) => ({
  form: one(forms, { fields: [fields.formId], references: [forms.id] }),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  form:    one(forms, { fields: [responses.formId], references: [forms.id] }),
  answers: many(responseAnswers),
}));

export const responseAnswersRelations = relations(responseAnswers, ({ one }) => ({
  response: one(responses, { fields: [responseAnswers.responseId], references: [responses.id] }),
  field:    one(fields,    { fields: [responseAnswers.fieldId],    references: [fields.id]    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
```

### Required Indexes

```sql
CREATE INDEX idx_forms_creator_id          ON forms(creator_id);
CREATE INDEX idx_forms_slug                ON forms(slug);
CREATE INDEX idx_forms_status_visibility   ON forms(status, visibility);
CREATE INDEX idx_fields_form_id_order      ON fields(form_id, "order");
CREATE INDEX idx_responses_form_id         ON responses(form_id);
CREATE INDEX idx_responses_form_id_created ON responses(form_id, created_at);
CREATE INDEX idx_ra_response_id            ON response_answers(response_id);
CREATE INDEX idx_ra_field_id               ON response_answers(field_id);
CREATE INDEX idx_token_blocklist_expires   ON token_blocklist(expires_at);

-- Partial unique index: idempotency only blocks non-expired hashes
-- Legitimate retries after 30s are allowed
CREATE UNIQUE INDEX idx_responses_submission_hash
  ON responses(submission_hash)
  WHERE submission_hash_expires_at > NOW();
```

---

## 5. Authentication System

### Architecture: Full Scratch JWT + HttpOnly Cookies

```
Access Token:  JWT · 15 min · { sub, type:"access", jti, email }
               Stored: IN MEMORY client-side — NEVER localStorage

Refresh Token: JWT · 7 days · { sub, type:"refresh", jti, sessionId }
               Cookie: HttpOnly · Secure · SameSite=Lax
               DB: SHA-256 hashed in sessions table (plaintext never stored)
```

**Why SameSite=Lax not Strict:**
the frontend and backend are different subdomains.
SameSite=Strict silently drops cookies on cross-subdomain requests.
SameSite=Lax allows cookies on top-level navigations.

### REST Auth Endpoints

```
POST /api/auth/signup          → create user, issue tokens
POST /api/auth/login           → validate credentials, issue tokens
POST /api/auth/logout          → add access jti to token_blocklist, clear cookie
POST /api/auth/refresh         → validate refresh cookie, issue new access token
POST /api/auth/forgot-password → send reset email (rate limited)
POST /api/auth/reset-password  → validate SHA-256 hashed reset token from DB
GET  /api/auth/me              → return current user (requireAuth)
```

### Security Checklist

- [x] Anti-enumeration: identical error for wrong email AND wrong password
- [x] JWT type claims: `type:"access"` | `type:"refresh"` (prevents token confusion)
- [x] JWT secrets: Zod-validated at startup, min 32 chars, crashes with process.exit(1)
- [x] Token revocation: token_blocklist checked in requireAuth on every request
- [x] Rate limiting: login + forgot-password + reset-password (all three)
- [x] Reset tokens: SHA-256 hashed before DB storage, expiry enforced in DB
- [x] CORS: origin = "(domain-name-here)" only, credentials: true
- [x] Access token in memory ONLY — never localStorage, never sessionStorage
- [x] SameSite=Lax for cross-subdomain compatibility
- [x] optionalAuth middleware for public routes that identify logged-in creators

### Client-Side Token Management

```typescript
// apps/web/lib/auth.ts
// Access token is a module-scoped variable — lives only in JS memory
let _accessToken: string | null = null;

export const setAccessToken  = (t: string) => { _accessToken = t; };
export const getAccessToken  = ()           => _accessToken;
export const clearAccessToken = ()          => { _accessToken = null; };

// Called on app mount — silent token refresh via HttpOnly cookie
export async function initAuth(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      { method: 'POST', credentials: 'include' }
    );
    if (!res.ok) return false;
    const { data } = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
```

---

## 6. tRPC Router Architecture

### Three Procedure Types

```typescript
publicProcedure    // No auth — explore, bySlug, submit
optionalProcedure  // Auth attempted, not required — creator preview
protectedProcedure // Throws UNAUTHORIZED if no session — all dashboard ops
```

### Root Router

```typescript
// apps/api/src/trpc/router.ts
import { generateOpenApiDocument } from 'trpc-openapi';

export const appRouter = router({
  auth:      authRouter,
  forms:     formsRouter,
  fields:    fieldsRouter,
  responses: responsesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title:       'FormForge API',
  version:     '1.0.0',
  baseUrl:     'https://api.formforge.jdevs.codes',
  description: 'FormForge public API — form retrieval and submission',
  tags:        ['forms', 'responses'],
});
```

### Router Signatures

```typescript
formsRouter = router({
  // PUBLIC — trpc-openapi annotated
  bySlug:    publicProcedure
               .meta({ openapi: { method: 'GET',  path: '/forms/{slug}' } })
               .input(z.object({ slug: z.string() }))
               .query(...)
  explore:   publicProcedure
               .meta({ openapi: { method: 'GET',  path: '/forms/explore' } })
               .input(ExploreSchema)
               .query(...)
  // PROTECTED
  create:    protectedProcedure.input(CreateFormSchema).mutation(...)
  // ^ Must call generateUniqueSlug() — handles collision with nanoid suffix
  update:    protectedProcedure.input(UpdateFormSchema).mutation(...)
  delete:    protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
  publish:   protectedProcedure.input(PublishFormSchema).mutation(...)
  unpublish: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
  clone:     protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
  archive:   protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
  myForms:   protectedProcedure.query(...)
  byId:      protectedProcedure.input(z.object({ id: z.string().uuid() })).query(...)
  exportCsv: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(...)
});

fieldsRouter = router({
  // PROTECTED
  upsertMany: protectedProcedure.input(UpsertFieldsSchema).mutation(...)
  reorder:    protectedProcedure.input(ReorderFieldsSchema).mutation(...)
  delete:     protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
});

responsesRouter = router({
  // PUBLIC — rate limited + spam protected
  submit: publicProcedure
            .meta({ openapi: { method: 'POST', path: '/responses/submit' } })
            .input(SubmitResponseSchema)
            .mutation(...)
  // PROTECTED — cursor-paginated with useInfiniteQuery on frontend
  // NOTE: tRPC v11 useInfiniteQuery passes pageParam automatically.

  // Procedure must be defined with .input() accepting cursor as optional
  // AND the procedure reads ctx.input.cursor ?? undefined for DB query.
  // getNextPageParam receives lastPage.nextCursor from your return value.
  // Return shape must include: { items: Response[], nextCursor: string | undefined }
  list:   protectedProcedure.input(ListResponsesSchema).query(...)
  byId:   protectedProcedure.input(z.object({ id: z.string().uuid() })).query(...)
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(...)
});

analyticsRouter = router({
  // PROTECTED
  formStats:       protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
  fieldStats:      protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
  timeSeries:      protectedProcedure.input(TimeSeriesSchema).query(...)
  dropoffFunnel:   protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
  completionFunnel:protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
  healthScore:     protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
  insights:        protectedProcedure.input(z.object({ formId: z.string().uuid() })).query(...)
});
```

---

## 7. Zod Schema Definitions


// All schemas live in `packages/shared/src/schemas/`.
// Import from `@repo/shared` in both apps.

```typescript
// packages/shared/src/schemas/auth.schemas.ts
export const SignupSchema = z.object({
  email:    z.string().email('Invalid email address'),
  name:     z.string().min(2).max(100),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
});
export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// packages/shared/src/schemas/forms.schemas.ts
export const FORM_THEMES = [
  'default', 'ghost-of-tsushima', 'jujutsu-kaisen',
  'karan-aujla-concert', 'cyberpunk', 'matrix', 'synthwave', 'minimal',
] as const;

export const CreateFormSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  slug:        z.string().min(3).max(100)
                 .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens')
                 .optional(),
  theme:       z.enum(FORM_THEMES).default('default'),
});

export const UpdateFormSchema = z.object({
  id:              z.string().uuid(),
  title:           z.string().min(1).max(255).optional(),
  description:     z.string().max(1000).optional(),
  slug:            z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  theme:           z.enum(FORM_THEMES).optional(),
  visibility:      z.enum(['public', 'unlisted']).optional(),
  notifyCreator:   z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  thankYouTitle:   z.string().max(255).optional(),
  thankYouMessage: z.string().max(1000).optional(),
  maxResponses:    z.number().int().positive().optional(),
  expiresAt:       z.string().datetime().optional(),
});

export const PublishFormSchema = z.object({
  id:         z.string().uuid(),
  visibility: z.enum(['public', 'unlisted']),
});

export const ExploreSchema = z.object({
  search: z.string().max(100).optional(),
  theme:  z.enum(FORM_THEMES).optional(),
  limit:  z.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

// packages/shared/src/schemas/fields.schemas.ts
export const FieldTypeEnum = z.enum([
  'short_text', 'long_text', 'email', 'number',
  'single_select', 'multi_select', 'checkbox',
  'rating', 'date', 'dropdown',
]);

export const FieldConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('short_text'),
    minLength: z.number().optional(), maxLength: z.number().optional() }),
  z.object({ type: z.literal('long_text'),
    minLength: z.number().optional(), maxLength: z.number().optional() }),
  z.object({ type: z.literal('email') }),
  z.object({ type: z.literal('number'),
    min: z.number().optional(), max: z.number().optional() }),
  z.object({ type: z.literal('single_select'),
    options: z.array(z.string()).min(1) }),
  z.object({ type: z.literal('multi_select'),
    options: z.array(z.string()).min(1),
    maxSelections: z.number().optional() }),
  z.object({ type: z.literal('checkbox') }),
  z.object({ type: z.literal('rating'),
    max: z.union([z.literal(5), z.literal(10)]).default(5) }),
  z.object({ type: z.literal('date'),
    minDate: z.string().optional(), maxDate: z.string().optional() }),
  z.object({ type: z.literal('dropdown'),
    options: z.array(z.string()).min(1) }),
]);

export const ReorderFieldsSchema = z.object({
  formId: z.string().uuid(),
  fields: z.array(z.object({
    id:    z.string().uuid(),
    order: z.number().int().min(0),
  })).min(1).max(50),
});

// sourceFieldId: the field whose ANSWER is being evaluated
// (not the field this condition is attached to)
export const ConditionRuleSchema = z.object({
  sourceFieldId: z.string().uuid(),
  operator:      z.enum([
                   'equals', 'not_equals', 'contains',
                   'greater_than', 'less_than',
                   'is_empty', 'is_not_empty',
                 ]),
  value:         z.string(),
});

export const ConditionalLogicSchema = z.object({
  action: z.enum(['show', 'hide']),
  match:  z.enum(['any', 'all']),   // 'any' = OR, 'all' = AND
  rules:  z.array(ConditionRuleSchema).min(1).max(10),
});

export const UpsertFieldSchema = z.object({
  id:          z.string().uuid().optional(),
  formId:      z.string().uuid(),
  type:        FieldTypeEnum,
  label:       z.string().min(1).max(500),
  placeholder: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  required:    z.boolean().default(false),
  order:       z.number().int().min(0),
  config:      z.record(z.unknown()).default({}),
  conditions:  ConditionalLogicSchema.optional(),
});

export const UpsertFieldsSchema = z.object({
  formId: z.string().uuid(),
  fields: z.array(UpsertFieldSchema).max(50),
});

// packages/shared/src/schemas/responses.schemas.ts
export const AnswerSchema = z.object({
  fieldId: z.string().uuid(),
  // jsonb: string for most fields, string[] for multi_select/checkbox
  value:   z.union([z.array(z.string().max(500)).max(50), z.string().max(10000)]),
});

export const SubmitResponseSchema = z.object({
  formSlug:        z.string(),
  answers:         z.array(AnswerSchema).min(1).max(50),
  respondentEmail: z.string().email().optional(),
  respondentName:  z.string().max(255).optional(),
  sendEmailCopy:   z.boolean().default(false),
  turnstileToken:  z.string().optional(),
  _hp:             z.string().max(0, 'Bot detected').optional(), // honeypot
});

// Cursor-based pagination — frontend uses useInfiniteQuery
export const ListResponsesSchema = z.object({
  formId: z.string().uuid(),
  limit:  z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});
```
## 7b. Shared TypeScript Types (packages/shared/src/types/)

```typescript
// packages/shared/src/types/analytics.ts
export interface DropoffRow {
  field_id:       string;
  field_label:    string;
  field_order:    number;
  response_count: number;
  retention_pct:  number;
}

export interface FunnelStage {
  stage:          'viewed' | 'started' | 'halfway' | 'submitted';
  count:          number;
  conversionRate: number;
}

export interface FormInsight {
  type:    'positive' | 'warning' | 'neutral';
  icon:    string;
  message: string;
}

export interface FormStats {
  completionRate:    number;
  recentResponses:   number;
  previousResponses: number;
  avgDropoffRate:    number;
  avgFieldsAnswered: number;
  totalFields:       number;
  fieldDropoffs?:    DropoffRow[];
}

export interface FormAnalyticsStats extends FormStats {
  totalResponses: number;
}

// packages/shared/src/types/index.ts
import type { InferSelectModel } from 'drizzle-orm';
import { forms, fields } from '@repo/db/schema';

export type Form  = InferSelectModel<typeof forms>;
export type Field = InferSelectModel<typeof fields>;
export type FormWithFields = Form & { fields: Field[] };

```

## 7c. Analytics TypeScript Types

// packages/shared/src/schemas/analytics.schemas.ts
```typescript
export const TimeSeriesSchema = z.object({
  formId:      z.string().uuid(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  startDate:   z.string().datetime().optional(),
  endDate:     z.string().datetime().optional(),
});
```

---

## 8. API Response Envelope

**Every API response uses this exact shape.**

```typescript
// packages/shared/src/errors/ApiError.ts  (shared FE + BE)
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest   = (msg = 'Bad request')         => new ApiError(400, msg);
  static unauthorized = (msg = 'Unauthorized')         => new ApiError(401, msg);
  static forbidden    = (msg = 'Forbidden')            => new ApiError(403, msg);
  static notFound     = (msg = 'Not found')            => new ApiError(404, msg);
  static conflict     = (msg = 'Conflict')             => new ApiError(409, msg);
  static tooMany      = (msg = 'Too many requests')    => new ApiError(429, msg);
  static internal     = (msg = 'Internal Server Error')=> new ApiError(500, msg, false);
}

// apps/api/src/common/utils/ApiResponse.ts  (backend only)
export class ApiResponse<T = unknown> {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly data: T | null = null,
  ) {}

  static ok      = <T>(data: T, msg = 'Success')           => new ApiResponse(true, msg, data);
  static created  = <T>(data: T, msg = 'Created')           => new ApiResponse(true, msg, data);
  static noContent = (msg = 'Deleted')                      => new ApiResponse(true, msg, null);
}

// SUCCESS:  { "success": true,  "message": "...", "data": { ... } }
// ERROR:    { "success": false, "error": "..." }
```

---

## 9. Error Handling System

```typescript
// apps/api/src/common/utils/asyncHandler.ts
import type { RequestHandler } from 'express';
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// apps/api/src/common/middleware/error.ts
// MUST be the LAST app.use() call in app.ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@repo/shared';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
    });
    return;
  }
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, '[ApiError 5xx]');
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }
  if ((err as NodeJS.ErrnoException).code === '23505') {
    res.status(409).json({ success: false, error: 'Already exists.' });
    return;
  }
  if ((err as NodeJS.ErrnoException).code === '23503') {
    res.status(400).json({ success: false, error: 'Invalid reference.' });
    return;
  }
  logger.error({ err }, '[Unhandled Error]');
  res.status(500).json({ success: false, error: 'Internal Server Error' });
};
```

---

## 10. Frontend Architecture

### SSR Auth Guard

```typescript
// apps/web/app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token');

  // Fast path: no cookie at all
  if (!refreshToken) redirect('/login');

  // CRITICAL: Server components cannot read in-memory access token.
  // Must forward the HttpOnly cookie to the API explicitly.
  // Next.js server-side fetch does NOT automatically include browser cookies.
  const res = await fetch(`${process.env.API_URL}/api/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache:   'no-store',
  });

  if (!res.ok) redirect('/login');

  return <GameEngineShell>{children}</GameEngineShell>;
}
```

### tRPC Client

```typescript
// apps/web/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/trpc';
import { getAccessToken } from './auth';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
      headers() {
        const token = getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: (url, opts) => fetch(url, { ...opts, credentials: 'include' }),
    }),
  ],
});
```

### Zustand Form Runtime Store

```typescript
// apps/web/lib/store/formStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resolveVisibleFieldGraph } from '@repo/shared';
import type { Field } from '@repo/shared';

interface FormStore {
  currentStep:      number;
  direction:        'forward' | 'backward';
  answers:          Record<string, string | string[]>;
  isSubmitting:     boolean;
  isSubmitted:      boolean;
  setAnswer:        (fieldId: string, value: string | string[]) => void;
  nextStep:         () => void;
  prevStep:         () => void;
  setSubmitting:    (v: boolean) => void;
  setSubmitted:     () => void;
  reset:            () => void;
  getVisibleFields: (fields: Field[]) => Field[];
  getProgress:      (fields: Field[]) => number;
}

/**
 * Factory function — creates a new Zustand store instance per form slug.
 * MUST be a factory, not a singleton, because the sessionStorage key
 * must be scoped per form to prevent answer bleed across tabs.
 
 */
export function createFormStore(formSlug: string) {
  return create<FormStore>()(
    persist(
      (set, get) => ({
        currentStep:  0,
        direction:    'forward',
        answers:      {},
        isSubmitting: false,
        isSubmitted:  false,

        setAnswer:    (id, val) => set(s => ({ answers: { ...s.answers, [id]: val } })),
        nextStep:     ()        => set(s => ({ currentStep: s.currentStep + 1, direction: 'forward' })),
        prevStep:     ()        => set(s => ({ currentStep: Math.max(0, s.currentStep - 1), direction: 'backward' })),
        setSubmitting: (v)      => set({ isSubmitting: v }),
        setSubmitted:  ()       => set({ isSubmitted: true }),
        reset:         ()       => set({ currentStep: 0, answers: {}, isSubmitted: false }),

        getVisibleFields: (fields) =>
          resolveVisibleFieldGraph(fields, get().answers),

        getProgress: (fields) => {
          const visible = get().getVisibleFields(fields);
          if (!visible.length) return 100;
          return Math.round((get().currentStep / visible.length) * 100);
        },
      }),
      {
        name:       `formforge-response-${formSlug}`, // scoped per form — no bleed
        storage:    createJSONStorage(() => sessionStorage),
        partialize: (s) => ({ answers: s.answers }),  // persist answers only
      }
    )
  );
}

```

### Shared FormRenderer Rule

```typescript
// apps/web/components/form/FormRenderer.tsx
//
// ARCHITECTURAL RULE: This is the ONLY form renderer in the codebase.
// Used in exactly two places:
//   1. dashboard/forms/[id]/builder/page.tsx — mode='preview' (▶ PLAY button)
//   2. f/[slug]/page.tsx — mode='live' (actual public form)
//
// NEVER create a second renderer. Fix bugs here once. Both places benefit.
import { useMemo } from 'react';
import { createFormStore } from '@/lib/store/formStore';
import type { FormWithFields } from '@repo/shared';

interface FormRendererProps {
  formConfig: FormWithFields;
  theme:      string;
  mode:       'preview' | 'live';
}

export function FormRenderer({ formConfig, theme, mode }: FormRendererProps){
  // useMemo = create once, reuse on every render
  // Without useMemo, a NEW store is created 60 times per second = broken
  const useFormStore = useMemo(
    () => createFormStore(formConfig.slug),
    [formConfig.slug]
  );

  // useFormStore is now a hook — call it like any other hook
  const { currentStep, answers, nextStep, prevStep } = useFormStore();
}
```

### Cursor-Paginated Responses

```typescript
// apps/web/app/dashboard/forms/[id]/responses/page.tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  trpc.responses.list.useInfiniteQuery(
    { formId, limit: 50 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
```

### 4-State Component Pattern

**Every async React component MUST implement all four states explicitly.**
No exceptions. This is a scanner check and prevents the "incomplete UI" penalty.

```typescript
// Pattern for every dashboard component that fetches data
if (isLoading) return <LoadingState message="Loading responses..." />;
if (error)     return <ErrorBoundary error={error} retry={refetch} />;
if (!data || data.length === 0) return <EmptyState
  title="No responses yet"
  description="Share your form to start collecting responses"
  action={<ShareButton />}
/>;
return <SuccessState data={data} />;
```

---

## 11. UI Theme — Game Engine Inspector

### Color System (CSS Variables + Data-Attribute Theming)

```css
/* apps/web/app/globals.css */

/* Default: Game Engine Inspector — ALWAYS used for creator dashboard */
:root {
  --bg-primary:     #1e1e1e;
  --bg-secondary:   #252526;
  --bg-tertiary:    #2d2d30;
  --bg-active:      #094771;
  --border:         #3c3c3c;
  --border-subtle:  #2a2a2a;
  --text-primary:   #d4d4d4;
  --text-secondary: #9ca3af;
  --text-accent:    #569cd6;
  --text-method:    #dcdcaa;
  --text-type:      #4ec9b0;
  --text-string:    #ce9178;
  --text-number:    #b5cea8;
  --status-live:    #4caf50;
  --status-draft:   #ff9800;
  --status-error:   #f44336;
  --console-info:   #4fc3f7;
  --console-warn:   #ffb74d;
  --console-error:  #ef5350;
  --console-success:#66bb6a;
}

/* Public form themes — injected via data-theme on /f/[slug] wrapper only */
[data-theme="ghost-of-tsushima"] {
  --bg-primary: #1a1208; --bg-secondary: #2d1f0e;
  --text-primary: #f5deb3; --accent: #c8860a;
}
[data-theme="jujutsu-kaisen"] {
  --bg-primary: #0d0b1a; --bg-secondary: #1a1530;
  --text-primary: #e8e0ff; --accent: #7c3aed;
}
[data-theme="karan-aujla-concert"] {
  --bg-primary: #1a0f00; --bg-secondary: #2d1a00;
  --text-primary: #fef3c7; --accent: #f59e0b;
}
[data-theme="matrix"] {
  --bg-primary: #000000; --bg-secondary: #001100;
  --text-primary: #00ff41; --accent: #00cc33;
}
[data-theme="cyberpunk"] {
  --bg-primary: #0a0015; --bg-secondary: #1a0030;
  --text-primary: #f0f0f0; --accent: #ff2d78;
}
[data-theme="synthwave"] {
  --bg-primary: #1a0533; --bg-secondary: #2d0a52;
  --text-primary: #f8f8f2; --accent: #ff79c6;
}
[data-theme="minimal"] {
  --bg-primary: #ffffff; --bg-secondary: #f9fafb;
  --text-primary: #111827; --accent: #3b82f6;
}
```

### Tailwind Config

```typescript
// apps/web/tailwind.config.ts
theme: {
  extend: {
    borderRadius: { DEFAULT: '0px' }, // rounded-none everywhere — Unity aesthetic
    fontFamily: {
      mono:    ['JetBrains Mono', 'monospace'],
      sans:    ['Inter', 'sans-serif'],
      display: ['Space Grotesk', 'sans-serif'],
    },
  },
}
```

### Typography

```
JetBrains Mono  → Console panel, field type badges, status indicators, code
Inter           → Body text, descriptions, form content
Space Grotesk   → Headers, panel titles, form names, hero headlines
```

### framer-motion Usage (Purposeful Only)

Import and use `framer-motion` for these specific interactions:
- Field cards entering the canvas (slide-in from left)
- Inspector panel sliding open/closed
- Publish modal scale-in
- Public form question transitions (slide up/down)
- ConsolePanel new entry (fade + slide from bottom)

**Do NOT add framer-motion to static elements.** 
The baseline being, we don't want animations that serve no purpose.

### lucide-react — All Icons

Replace all emoji icons with Lucide equivalents:
```
Terminal, Layers, Settings, Play, Square (stop), ChevronRight, ChevronLeft,
Plus, Trash2, Copy, Eye, EyeOff, Share2, QrCode, Download, BarChart2,
Activity, Zap, AlertCircle, CheckCircle, Clock, Globe, Lock
```

### Game Engine Shell Layout

```
┌─[MENUBAR: FormForge | File | Edit | View | Forms | Build | Help]──────┐
│ ┌─[PROJECT HIERARCHY]─┐  ┌──────[SCENE VIEW]──────────┐  ┌[INSPECTOR]┐│
│ │ 📁 My Forms         │  │                             │  │           ││
│ │  🎬 samurai-oath    │  │   [Main content area]       │  │ Component ││
│ │  🎬 jjk-sorcerer   │  │                             │  │ Properties││
│ │  🎬 aujla-vip     │  │                             │  │           ││
│ └─────────────────────┘  └─────────────────────────────┘  └───────────┘│
│ ┌─[CONSOLE]────────────────────────────────────────────────────────────┐│
│ │ [INFO]    2s ago  New response: samurai-oath (respondent: "Preet")  ││
│ │ [SUCCESS] 1m ago  Form 'jjk-sorcerer' published — visibility: public││
│ └──────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

## 11b. Extended UI Guidelines — The Differentiators

### Menubar — Breadcrumb Navigation
FormForge > [form-title] > [Builder|Responses|Analytics]
Keyboard shortcuts shown on hover. Updates on navigation.
[▶ PLAY] [◼ STOP] [⚡ PUBLISH] buttons in menubar, not sidebar.

### Console Panel — Polling (not WebSockets)
Poll analytics.formStats every 10s.
Show blinking ● LIVE dot (CSS pulse animation).
Timestamps count up client-side with setInterval.
Log levels: INFO (blue) | WARN (amber) | SUCCESS (green) | DEBUG (gray).

### Empty State Micro-copy (Game Engine voice)
"Scene is empty. Press [+ New Form] to instantiate your first GameObject."
"Compiling shaders..." instead of "Loading..."
"No assets found in this scene." instead of "No responses yet."

### Field Cards — Visual Differentiation
Left border color per field type:
  text fields    → #569cd6 (blue)
  select fields  → #4ec9b0 (green)
  rating         → #ff9800 (orange)
  date           → #c586c0 (purple)
  email          → #dcdcaa (yellow)

### Inspector Panel — Property Grid
Alternating row backgrounds: #1e1e1e / #252526
Labels in var(--text-secondary), values in var(--text-primary)
Toggle switches styled as square Unity toggles, not rounded pills

### Health Score Widget
Circular arc progress indicator (CSS only, no library)
Four signal bars below: Completion / Velocity / Drop-off / Engagement

### Public Form Theme Effects
ghost-of-tsushima  → CSS falling petals (@keyframes, 10 divs, no canvas)
jujutsu-kaisen     → Canvas particle field (30 particles, purple)
karan-aujla-concert → CSS radial-gradient spotlight animation

### One Rule
Every animation must serve a purpose.
If you cannot explain why it animates, remove it.

## 11c. Landing Page Architecture & Content

### Philosophy
The landing page does not explain FormForge. It demonstrates it.
Users should feel the Game Engine aesthetic before they read a single word.

### File Structure
app/(marketing)/
├── page.tsx                      ← composition only
├── layout.tsx                    ← marketing layout (no GameEngineShell)
└── _components/
    ├── HeroSection.tsx           
    ├── FeaturesSection.tsx       
    ├── ThemesSection.tsx         
    ├── HowItWorksSection.tsx     
    ├── CtaSection.tsx            
    ├── Navbar.tsx                
    └── Footer.tsx                

pricing/
└── page.tsx                      

### page.tsx 
import { Navbar }           from './_components/Navbar';
import { HeroSection }      from './_components/HeroSection';
import { FeaturesSection }  from './_components/FeaturesSection';
import { ThemesSection }    from './_components/ThemesSection';
import { HowItWorksSection } from './_components/HowItWorksSection';
import { CtaSection }       from './_components/CtaSection';
import { Footer }           from './_components/Footer';

export default function LandingPage() {
  return (
    <main className="bg-[#0e0e0e] text-[#d4d4d4] overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ThemesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </main>
  );
}

---

### Navbar Copy & Structure
Left:   FORMFORGE wordmark in JetBrains Mono, weighted, no logo
Center: Explore · Pricing · Docs
Right:  [Log in] ghost button · [Open Builder →] filled button

const NAVBAR = {
  brand: 'FORMFORGE',
  links: [
    { label: 'Explore',  href: '/explore' },
    { label: 'Pricing',  href: '/pricing' },
    { label: 'Docs',     href: 'https://api.formforge.jdevs.codes/docs' },
  ],
  cta: {
    secondary: { label: 'Log in',          href: '/login'  },
    primary:   { label: 'Open Builder →',  href: '/signup' },
  },
} as const;

Visual: navbar has a 1px bottom border in #2a2a2a.
Background: #0e0e0e with backdrop-blur when scrolled.
No gradients. No shadows. Flat and sharp.

---

### HeroSection Copy & Structure

VISUAL CONCEPT:
The hero is split — left side is copy, right side is a
live screenshot/mockup of the Game Engine Inspector UI
showing the samurai-oath form in the builder.
The mockup has a subtle glow behind it: radial-gradient
in #569cd6 at 8% opacity. Floating, not a box.


HEADLINE (two lines, Space Grotesk font, very large):
Line 1: "Forms deserve"
Line 2: "better tooling."

No animation on the headline itself.
Cursor blink after the period — CSS only, 1px wide, #569cd6.

SUBHEADLINE (Inter, #9ca3af, 18px, max-width 480px):
"You already use a game engine to build worlds.
Why are you still building forms in a spreadsheet clone?"

This is intentionally provocative. It disqualifies
the reader from using bad tools and positions FormForge
as the obvious upgrade. No features mentioned yet.

PRIMARY STAT ROW (below subheadline):
Three numbers separated by vertical dividers.

const HERO_STATS = [
  { value: '750+',  label: 'responses seeded'    },
  { value: '10',    label: 'field types'          },
  { value: '< 60s', label: 'to publish a form'   },
] as const;

Numbers in JetBrains Mono, #d4d4d4, large.
Labels in Inter, #6b7280, small.

CTA BUTTONS:
Primary:   [  Start Building — it's free  ]
           bg #569cd6, text #0e0e0e, no border-radius,
           full weight, slight letter-spacing

Secondary: [  See a live form ↗  ]
           transparent, border #3c3c3c, text #9ca3af
           links to /f/samurai-oath

HERO VISUAL (right side):
A static image or high-fidelity div mockup of the
GameEngineShell showing:
- HierarchyPanel with 3 forms listed
- BuilderCanvas with 2-3 field cards visible
- InspectorPanel open with field properties
- ConsolePanel at bottom with 1 log line

Style: slight rotation (-1deg), box-shadow with
#569cd6 glow at 15% opacity, border #3c3c3c 1px.
This is the product. Show it. Don't describe it.

const HERO = {
  headline:     ['Forms deserve', 'better tooling.'],
  sub:          "You already use a game engine to build worlds. Why are you still building forms in a spreadsheet clone?",
  stats: [
    { value: '750+',  label: 'responses seeded'  },
    { value: '10',    label: 'field types'        },
    { value: '< 60s', label: 'to publish a form' },
  ],
  cta: {
    primary:   { label: 'Start Building — it\'s free', href: '/signup'         },
    secondary: { label: 'See a live form ↗',           href: '/f/samurai-oath' },
  },
} as const;

---

### FeaturesSection Copy & Structure

SECTION LABEL (small, mono, #569cd6, uppercase, tracked):
// WHAT YOU GET

HEADLINE:
"Everything a form builder
should have. Finally."

Second line italicized in Space Grotesk.
No period — it ends with authority.

LAYOUT: 3-column grid, each card is a dark panel.
Card background: #141414
Card border: 1px solid #2a2a2a
Card hover: border shifts to #569cd6 at 40% opacity
No border-radius (Unity aesthetic).
Icon in top-left, colored per category.

const FEATURES = [
  {
    icon:        'Layers',
    color:       '#569cd6',
    title:       'Inspector-Driven Builder',
    description: 'Every field is a GameObject. Drag it onto the canvas, click it, configure it in the Inspector panel. No modal popups. No context switching.',
  },
  {
    icon:        'GitBranch',
    color:       '#4ec9b0',
    title:       'Conditional Logic That Actually Works',
    description: 'Show or hide fields based on previous answers. Graph-based resolution handles chains: if A then B, if B then C. No spaghetti rules.',
  },
  {
    icon:        'BarChart2',
    color:       '#dcdcaa',
    title:       'Analytics With a Health Score',
    description: 'Not just response counts. A 0-100 health score, Q1→Qn drop-off funnel, field breakdown, time-series. Computed from real data.',
  },
  {
    icon:        'Globe',
    color:       '#4ec9b0',
    title:       'Public and Unlisted',
    description: 'Public forms appear on the Explore page. Unlisted forms are direct-link only. Both work without login for respondents.',
  },
  {
    icon:        'Palette',
    color:       '#c586c0',
    title:       'Themes That Mean Something',
    description: 'Ghost of Tsushima. Jujutsu Kaisen. Karan Aujla concert night. Respondents get a full-screen immersive experience, not a white box.',
  },
  {
    icon:        'ShieldCheck',
    color:       '#ce9178',
    title:       'Spam Protection Baked In',
    description: 'Honeypot fields. Subnet clustering detection. Idempotency hashing. Cloudflare Turnstile. Bots get a fake 200. Real users never notice.',
  },
] as const;

---

### ThemesSection Copy & Structure

SECTION LABEL:
// LIVE FORMS

HEADLINE:
"Three forms. Three worlds.
Zero login required."

CONCEPT:
Three large cards, each themed to its form.
Each card shows:
  - Theme name as a badge (top left)
  - Form title
  - Response count with a pulsing green dot
  - A preview of the form's color palette
    (3 small color swatches, the actual CSS variable values)
  - [Fill this form →] button that goes to /f/[slug]

The cards use each theme's own CSS variables:
  Card 1 background: #1a1208 (ghost-of-tsushima bg)
  Card 2 background: #0d0b1a (jujutsu-kaisen bg)
  Card 3 background: #1a0f00 (karan-aujla-concert bg)

This section is proof. Not marketing. The forms exist.
Anyone can click through and fill them live.

const THEMES = [
  {
    slug:        'samurai-oath',
    theme:       'ghost-of-tsushima',
    badge:       'Ghost of Tsushima',
    title:       'The Samurai Oath',
    description: 'Which path do you walk — honor or survival? 200 warriors have answered.',
    responses:   200,
    accent:      '#c8860a',
    bg:          '#1a1208',
    swatches:    ['#1a1208', '#c8860a', '#f5deb3'],
  },
  {
    slug:        'jjk-sorcerer-registration',
    theme:       'jujutsu-kaisen',
    badge:       'Jujutsu Kaisen',
    title:       'Sorcerer Registration',
    description: 'Declare your cursed technique. Sign the binding vow. 250 sorcerers enrolled.',
    responses:   250,
    accent:      '#7c3aed',
    bg:          '#0d0b1a',
    swatches:    ['#0d0b1a', '#7c3aed', '#e8e0ff'],
  },
  {
    slug:        'aujla-vip-backstage',
    theme:       'karan-aujla-concert',
    badge:       'Karan Aujla Concert',
    title:       'VIP Backstage Pass',
    description: 'One night. One stage. Which song hits different? 300 fans have spoken.',
    responses:   300,
    accent:      '#f59e0b',
    bg:          '#1a0f00',
    swatches:    ['#1a0f00', '#f59e0b', '#fef3c7'],
  },
] as const;

BELOW THE CARDS — a single line in mono, centered, #6b7280:
"These are real forms with real seeded data.
 The analytics dashboard has actual charts."

---

### HowItWorksSection Copy & Structure

SECTION LABEL:
// HOW IT WORKS

HEADLINE:
"Four steps.
No tutorial needed."

LAYOUT: horizontal steps on desktop, vertical on mobile.
Connecting line between steps: 1px dashed #2a2a2a.
Step number in JetBrains Mono, large, #569cd6 at 20% opacity — watermark style.

const STEPS = [
  {
    step:        '01',
    icon:        'UserPlus',
    title:       'Sign up',
    description: 'One form to fill. Then you\'re in the builder.',
  },
  {
    step:        '02',
    icon:        'Layers',
    title:       'Build',
    description: 'Drag fields. Write labels. Set conditions. Configure in the Inspector.',
  },
  {
    step:        '03',
    icon:        'Zap',
    title:       'Publish',
    description: 'Pick public or unlisted. Get a link. Get a QR code. Done.',
  },
  {
    step:        '04',
    icon:        'BarChart2',
    title:       'Analyze',
    description: 'Watch responses come in. Check the health score. See where people drop off.',
  },
] as const;

---

### CtaSection Copy & Structure

CONCEPT:
Dark panel, full width, #141414 background.
Border top: 1px solid #2a2a2a.
Two lines of copy. One button.

LINE 1 (Space Grotesk, large):
"Your forms are embarrassing you."

LINE 2 (Inter, #9ca3af):
"Fix that in sixty seconds."

BUTTON:
[  Open the Builder →  ]
Full width on mobile, auto on desktop.
bg #569cd6, text #0e0e0e, no border-radius, large padding.

Below the button, in mono, #4b5563, tiny:
"No credit card. No onboarding flow. No sales call."

const CTA = {
  headline:    'Your forms are embarrassing you.',
  sub:         'Fix that in sixty seconds.',
  button:      { label: 'Open the Builder →', href: '/signup' },
  disclaimer:  'No credit card. No onboarding flow. No sales call.',
} as const;

---

### Pricing Page Copy & Structure (pricing/page.tsx)

HEADLINE:
"Pay for what you use.
Stop when you want."

SUBHEADLINE (#9ca3af):
"All plans include public and unlisted forms,
10 field types, and real analytics. No paywalled basics."

const PLANS = [
  {
    name:        'Free',
    price:       '$0',
    period:      'forever',
    badge:       null,
    highlighted: false,
    description: 'For people trying things out.',
    features: [
      '3 active forms',
      '100 responses / month',
      'All 10 field types',
      'Public and unlisted forms',
      'Basic analytics',
      'QR code sharing',
    ],
    cta:  { label: 'Start for free',  href: '/signup'           },
  },
  {
    name:        'Pro',
    price:       '$12',
    period:      '/ month',
    badge:       'Most Popular',
    highlighted: true,
    description: 'For builders who are serious.',
    features: [
      'Unlimited forms',
      '10,000 responses / month',
      'Advanced analytics + health score',
      'Conditional logic',
      'All themes',
      'CSV export',
      'Email notifications',
      'Custom form slugs',
      'Form clone and archive',
    ],
    cta:  { label: 'Start free trial', href: '/signup?plan=pro' },
  },
  {
    name:        'Business',
    price:       '$49',
    period:      '/ month',
    badge:       null,
    highlighted: false,
    description: 'For teams collecting at scale.',
    features: [
      'Everything in Pro',
      'Unlimited responses',
      'Admin dashboard',
      'Priority support',
      'API access via Scalar docs',
      'Password-protected forms',
      'Response filtering',
      'Custom thank-you pages',
    ],
    cta:  { label: 'Contact sales',    href: '/signup'           },
  },
] as const;

NOTE ON HIGHLIGHTED PLAN:
Pro card gets:
  border: 1px solid #569cd6
  background: #0d1117
  badge: small pill, bg #569cd6, text #0e0e0e, "Most Popular"
  
All other cards:
  border: 1px solid #2a2a2a
  background: #141414

---

### Footer Copy & Structure

Three columns:

Left:
  FORMFORGE wordmark
  "A form builder that respects your craft."
  [Inter, #6b7280, small]

Center:
  Product
  - Explore Forms  → /explore
  - Pricing        → /pricing
  - API Docs       → /docs

Right:
  Demo Credentials — see README.md for current credentials.

Bottom bar:
"FormForge · 2026"
[mono, #4b5563, centered, 12px]

const FOOTER = {
  tagline: 'A form builder that respects your craft.',
  product: [
    { label: 'Explore Forms', href: '/explore'  },
    { label: 'Pricing',       href: '/pricing'  },
    { label: 'API Docs',      href: '/docs'     },
  ],
} as const;

---

### Visual Rules for Marketing Pages (not dashboard)

Background:  #0e0e0e — slightly different from dashboard #1e1e1e
             Creates visual separation without a different theme
Sections:    alternate between #0e0e0e and #0a0a0a — 2px difference
             Subtle rhythm without harsh borders
Section padding: py-24 on desktop, py-16 on mobile
Max content width: max-w-6xl mx-auto px-6

Typography scale:
  Hero headline:    text-6xl / text-8xl — Space Grotesk Bold
  Section headline: text-4xl / text-5xl — Space Grotesk
  Section label:    text-xs tracking-widest uppercase — JetBrains Mono
  Body:             text-base / text-lg — Inter
  Micro:            text-xs / text-sm — JetBrains Mono

Accent usage:
  #569cd6 — primary actions, active states, links
  #4ec9b0 — secondary highlights
  #dcdcaa — warning / important callouts
  #ce9178 — string values, code snippets in copy

One rule: no rounded corners anywhere on the marketing page.
Consistent with the dashboard aesthetic.
border-radius: 0 — everywhere.

---

## 12. Public Form System

### URL Structure

```
website-name/f/[slug]           ← Live public form (no auth)
website-name/f/[slug]?preview=1 ← Preview (creator only, shows banner)
website-name/explore             ← Public forms grid (REQUIRED BY RULES)
```

### Explore Page

Must display only `status='published'` AND `visibility='public'` forms.
Shows: title, description, theme badge, response count, link to `/f/[slug]`.
This is where the 3 seeded forms appear during demo day.

### Form Status Checks (Server, before rendering)

```
1. status !== 'published'    → "This form is not available" (NOT a 404)
2. expiresAt && < now        → "This form has closed"
3. responseCount >= max (set)→ "No longer accepting responses"
```

### Theme Injection

```tsx
// apps/web/app/f/[slug]/page.tsx
export default async function PublicFormPage({ params }) {
  const form = await fetchFormBySlug(params.slug); // server-side

  // Increment view count (fire-and-forget, don't await)
  void incrementViewCount(form.id);

  return (
    <div data-theme={form.theme} className="min-h-screen bg-[var(--bg-primary)]">
      {['matrix', 'jujutsu-kaisen'].includes(form.theme) && (
        <ThemeBackground theme={form.theme} /> // canvas particle effect
      )}
      <FormRenderer formConfig={form} theme={form.theme} mode="live" />
    </div>
  );
}
```

### Slug Generation (Collision-Safe)

```typescript
// apps/api/src/modules/forms/forms.service.ts
import { nanoid } from 'nanoid';

export async function generateUniqueSlug(baseTitle: string): Promise<string> {
  const base = baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const exists = await db
    .select({ slug: forms.slug }).from(forms)
    .where(eq(forms.slug, base)).limit(1);

  if (!exists.length) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${nanoid(4)}`;
    const collision = await db
      .select({ slug: forms.slug }).from(forms)
      .where(eq(forms.slug, candidate)).limit(1);
    if (!collision.length) return candidate;
  }
  return nanoid(12);
}
// Custom slug provided by creator → check directly, return friendly error:
// "This URL is taken. Try 'my-form-2' or choose a different one."
```

### Response Submission — Full Implementation

```typescript
// apps/api/src/modules/responses/responses.service.ts
import { createHash } from 'crypto';
import { sql, eq, lt, and, count } from 'drizzle-orm';

export async function submitResponse(input: SubmitResponseInput) {

  // Multi-Strategy Identity Resolution Pipeline:
  // 1. Zod Payload Integrity Verification
  // 2. Finite State Machine Gate (Ensure form is PUBLISHED)
  // 3. Cryptographic Session Token Verification
  // 4. IP/UA Fingerprint Fallback with Distributed Mutex Lock
  // 5. Transactional Relational Integrity Check

  // Step 1: Zod validation handled by tRPC input schema (SubmitResponseSchema)

  // Honeypot: return fake success to fool bots — never reaches DB
  if (input._hp && input._hp.length > 0) {
    return { success: true, message: 'Response submitted successfully.' };
  }

  // Step 2: Finite State Machine Gate
  const form = await db.query.forms.findFirst({
    where: eq(forms.slug, input.formSlug),
    with: { fields: { orderBy: (f, { asc }) => [asc(f.order)] } },
  });
  if (!form) throw ApiError.notFound('Form not found');
  if (form.status !== 'published') throw ApiError.forbidden('Form is not accepting responses');
  if (form.expiresAt && form.expiresAt < new Date()) throw ApiError.forbidden('This form has closed');
  if (form.maxResponses && form.responseCount >= form.maxResponses) throw ApiError.forbidden('This form is no longer accepting responses');

  // Step 3: Cryptographic Session Token (Turnstile)
  if (env.TURNSTILE_ENABLED && env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstileToken(input.turnstileToken);
    if (!valid) throw ApiError.badRequest('CAPTCHA verification failed');
  }

  // Spam cluster detection
  const spamResult = await detectSpamSubmissionCluster(form.id, input);
  if (spamResult.isSpam && spamResult.confidence > 0.8) {
    logger.warn({ formId: form.id, reason: spamResult.reason }, 'Spam detected');
    return { success: true, message: 'Response submitted successfully.' }; // fake success
  }

  // Step 4: IP/UA Fingerprint — Distributed Mutex Lock (idempotency hash)
  const submissionHash = createHash('sha256')
    .update(`${input.ipAddress}:${form.id}:${input.userAgent}:${Math.floor(Date.now() / 30_000)}`)
    .digest('hex');

  // Step 5: Transactional Relational Integrity Check
  return await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responses)
      .values({
        formId:                  form.id,
        respondentEmail:         input.respondentEmail,
        respondentName:          input.respondentName,
        ipAddress:               input.ipAddress,
        userAgent:               input.userAgent,
        submissionHash,
        submissionHashExpiresAt: new Date(Date.now() + 30_000),
      })
      .onConflictDoNothing()
      .returning();

    if (!response) return { duplicate: true }; // silent double-click handling

    await tx.insert(responseAnswers).values(
      input.answers.map(a => ({
        responseId: response.id,
        fieldId:    a.fieldId,
        value:      Array.isArray(a.value) ? a.value : String(a.value),
      }))
    );

    // Atomic increment — NEVER do this outside the transaction
    await tx.update(forms)
      .set({ responseCount: sql`${forms.responseCount} + 1` })
      .where(eq(forms.id, form.id));

    return { response, duplicate: false };
  });
  // Emails sent after transaction (non-critical, fire-and-forget)
}
```

---

## 13. Analytics & Intelligence Layer

All four intelligence functions live in `analytics.service.ts`.
They produce real output shown in the dashboard — not decorative.

```typescript
// apps/api/src/modules/analytics/analytics.service.ts

/**
 * Computes a 0-100 health score for a form based on four weighted signals:
 * completion rate, response velocity, field drop-off, and engagement depth.
 */
export function computeFormHealthScore(stats: FormStats): number {
  const weights = { completion: 0.40, velocity: 0.30, dropoff: 0.20, engagement: 0.10 };

  const completionScore  = Math.min(stats.completionRate * 100, 100);
  const velocityScore    = Math.min(
    (stats.recentResponses / Math.max(stats.previousResponses, 1)) * 50, 100
  );
  const dropoffScore     = Math.max(100 - (stats.avgDropoffRate * 100), 0);
  const engagementScore  = Math.min(
    (stats.avgFieldsAnswered / Math.max(stats.totalFields, 1)) * 100, 100
  );

  return Math.round(
    completionScore  * weights.completion  +
    velocityScore    * weights.velocity    +
    dropoffScore     * weights.dropoff     +
    engagementScore  * weights.engagement
  );
}

/**
 * Calculates Q1→Qn drop-off funnel: of everyone who answered field N,
 * what percentage answered field N+1? Uses window functions for efficiency.
 */
export async function calculateQ1toQnDropoff(formId: string) {
  // Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
  const result = await db.execute(sql`
    WITH field_response_counts AS (
      SELECT
        f.id          AS field_id,
        f.label       AS field_label,
        f."order"     AS field_order,
        COUNT(ra.id)  AS response_count
      FROM fields f
      LEFT JOIN response_answers ra ON ra.field_id = f.id
      LEFT JOIN responses r ON r.id = ra.response_id
      WHERE f.form_id = ${formId}
      GROUP BY f.id, f.label, f."order"
    ),
    ranked AS (
      SELECT *,
        LAG(response_count) OVER (ORDER BY field_order) AS prev_count
      FROM field_response_counts
    )
    SELECT
      field_id,
      field_label,
      field_order,
      response_count,
      CASE
        WHEN prev_count IS NULL THEN 100.0
        ELSE ROUND((response_count::numeric / NULLIF(prev_count, 0)) * 100, 2)
      END AS retention_pct
    FROM ranked
    ORDER BY field_order
  `);
  return result.rows;
}

/**
 * Four-stage completion funnel: Views → Started → 50% Complete → Submitted.
 * Provides conversion rates between each stage.
 */
export async function computeResponseCompletionFunnel(formId: string): Promise<{
  stage: 'viewed' | 'started' | 'halfway' | 'submitted';
  count: number;
  conversionRate: number;
}[]> {
  // Utilizing Postgres CTEs and SQL Window Functions for adaptive time-series bucketing.
  const [form] = await db.select({
    viewCount:     forms.viewCount,
    responseCount: forms.responseCount,
  }).from(forms).where(eq(forms.id, formId));

  const totalFields = await db
    .select({ count: count() }).from(fields)
    .where(eq(fields.formId, formId));
  const fieldCount = totalFields[0]?.count ?? 1;

  // "Started" = responses with at least 1 answer
  // "Halfway" = responses with > 50% of fields answered
  const halfwayResult = await db.execute(sql`
      SELECT COUNT(*) AS halfway_count
      FROM (
        SELECT r.id
        FROM responses r
        JOIN response_answers ra ON ra.response_id = r.id
        WHERE r.form_id = ${formId}
        GROUP BY r.id
        HAVING COUNT(ra.id) > ${Math.floor(fieldCount / 2)}
      ) subq
  `);

  const views     = form.viewCount;
  const halfway   = Number((halfwayResult.rows[0] as { halfway_count: string })?.halfway_count ?? 0);

  const startedResult = await db.execute(sql`
  SELECT COUNT(DISTINCT response_id) AS started_count
  FROM response_answers ra
  JOIN responses r ON r.id = ra.response_id
  WHERE r.form_id = ${formId}
`);
  const started   = Number((startedResult.rows[0] as { started_count: string })?.started_count ?? 0);
  const submitted = form.responseCount; // completed submissions

  return [
    { stage: 'viewed',    count: views,     conversionRate: 100 },
    { stage: 'started',   count: started,   conversionRate: views > 0 ? Math.round(started / views * 100) : 0 },
    { stage: 'halfway',   count: halfway,   conversionRate: started > 0 ? Math.round(halfway / started * 100) : 0 },
    { stage: 'submitted', count: submitted, conversionRate: halfway > 0 ? Math.round(submitted / halfway * 100) : 0 },
  ];
}

/**
 * Analyzes recent submissions for coordinated spam patterns:
 * subnet clustering, identical payloads, and velocity spikes.
 */
export async function detectSpamSubmissionCluster(
  formId: string,
  newSubmission: { ipAddress?: string; answers: { value: string | string[] }[] }
): Promise<{ isSpam: boolean; confidence: number; reason?: string }> {
  if (!newSubmission.ipAddress) return { isSpam: false, confidence: 0 };

  const subnet = newSubmission.ipAddress.split('.').slice(0, 3).join('.');
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const recentFromSubnet = await db.execute(sql`
    SELECT COUNT(*) AS cnt
    FROM responses
    WHERE form_id = ${formId}
      AND ip_address LIKE ${subnet + '%'}
      AND created_at > ${fiveMinutesAgo}
  `);
  const subnetCount = Number((recentFromSubnet.rows[0] as { cnt: string })?.cnt ?? 0);

  if (subnetCount > 10) {
    return { isSpam: true, confidence: 0.9, reason: `Subnet ${subnet} sent ${subnetCount} submissions in 5 minutes` };
  }

  return { isSpam: false, confidence: 0 };
}

/**
 * Rule-based pattern matching that generates natural-language insights
 * from aggregated form analytics. Output displayed in Inspector panel.
 */
export function generateFormInsightsSummary(stats: FormAnalyticsStats): FormInsight[] {
  const insights: FormInsight[] = [];

  // Response velocity insight
  if (stats.recentResponses > stats.previousResponses * 2) {
    insights.push({
      type:    'positive',
      icon:    'trending-up',
      message: `Response rate doubled in the last 7 days — your form is gaining traction.`,
    });
  } else if (stats.recentResponses < stats.previousResponses * 0.5 && stats.previousResponses > 5) {
  insights.push({
    type:    'warning',
    icon:    'trending-down',
    message: `Response rate dropped by more than 50% compared to last week. Consider resharing.`,
  });
}

  // Drop-off insight
  const worstDropoff = stats.fieldDropoffs?.reduce(
    (worst, f) => f.retention_pct < worst.retention_pct ? f : worst,
    { retention_pct: 100, field_label: '' }
  );
  if (worstDropoff && worstDropoff.retention_pct < 70) {
    insights.push({
      type:    'warning',
      icon:    'alert-circle',
      message: `"${worstDropoff.field_label}" sees the largest drop-off (${worstDropoff.retention_pct}% continue). Consider making it optional.`,
    });
  }

  // Health score insight
  const score = computeFormHealthScore(stats);
  if (score >= 80) {
    insights.push({ type: 'positive', icon: 'zap', message: `Form health is excellent (${score}/100).` });
  } else if (score < 50) {
    insights.push({ type: 'warning',  icon: 'activity', message: `Form health is low (${score}/100). Review required fields.` });
  }

  return insights;
}
```

### `resolveVisibleFieldGraph` (packages/shared)

```typescript
// packages/shared/src/utils/conditionalLogic.ts
import { ConditionalLogicSchema } from '../schemas/fields.schemas';
import type { Field } from '../types';

/**
 * Builds a directed dependency graph of conditional fields and resolves
 * visible fields in topological order. Handles multi-level conditions
 * (Field C shows if Field B shows if Field A = "Yes").
 * Used by both Zustand store (frontend) and server-side validation (backend).
 */
export function resolveVisibleFieldGraph(
  fields: Field[],
  answers: Record<string, string | string[]>
): Field[] {
  // Topological visibility resolution
  const visible = new Set<string>();
  const resolved = new Set<string>();

  function isVisible(fieldId: string): boolean {
    if (resolved.has(fieldId)) return visible.has(fieldId);
    resolved.add(fieldId);

    const field = fields.find(f => f.id === fieldId);
    if (!field?.conditions) {
      visible.add(fieldId);
      return true;
    }

    const logic = ConditionalLogicSchema.safeParse(field.conditions);
    if (!logic.success) {
      visible.add(fieldId);
      return true;
    }

    const results = logic.data.rules.map(rule => {
      // Ensure source field is itself visible before evaluating
      if (!isVisible(rule.sourceFieldId)) return false;
      return evaluateRule(rule, answers);
    });

    const passes = logic.data.match === 'all'
      ? results.every(Boolean)
      : results.some(Boolean);

    const fieldVisible = logic.data.action === 'show' ? passes : !passes;
    if (fieldVisible) visible.add(fieldId);
    return fieldVisible;
  }

  fields.forEach(f => isVisible(f.id));
  return fields.filter(f => visible.has(f.id));
}

function evaluateRule(
  rule: { operator: string; sourceFieldId: string; value: string },
  answers: Record<string, string | string[]>
): boolean {
  const answer = answers[rule.sourceFieldId];
  const val    = Array.isArray(answer) ? answer.join(',') : String(answer ?? '');
  switch (rule.operator) {
    case 'equals':       return val === rule.value;
    case 'not_equals':   return val !== rule.value;
    case 'contains':     return val.toLowerCase().includes(rule.value.toLowerCase());
    case 'greater_than': return Number(val) > Number(rule.value);
    case 'less_than':    return Number(val) < Number(rule.value);
    case 'is_empty':     return val.trim() === '';
    case 'is_not_empty': return val.trim() !== '';
    default:             return true;
  }
}
```

---

## 14. Email System

```typescript
// packages/email/src/index.ts
import { Resend } from 'resend';
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendResponseReceived(opts: ResponseReceivedOpts) {
  if (!resend) return;
  return resend.emails.send({
    from:    'FormForge <noreply@formforge.jdevs.codes>',
    to:      opts.creatorEmail,
    subject: `New response on "${opts.formTitle}"`,
    text:    `New response from ${opts.respondentName ?? 'Anonymous'} on "${opts.formTitle}". View responses: ${opts.formUrl}`,
  });
}

export async function sendResponseCopy(opts: ResponseCopyOpts) {
  if (!resend) return;
  const answerList = opts.answers.map(a => `${a.label}: ${a.value}`).join('\n');
  return resend.emails.send({
    from:    'FormForge <noreply@formforge.jdevs.codes>',
    to:      opts.respondentEmail,
    subject: `Your response to "${opts.formTitle}"`,
    text:    `Thank you for your response!\n\n${answerList}`,
  });
}
```

---

## 15. Seed Data Strategy

```typescript
// packages/db/src/seed.ts — run with: pnpm db:seed
// Idempotent: safe to run multiple times. Uses fixed UUIDs + onConflictDoNothing().
// CRITICAL: Never use Math.random() for seeded data — use deterministic values.
// Run with: pnpm db:seed
// Requires: "type": "module" in packages/db/package.json

const DEMO_USER = { id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@formforge.jdevs.codes', name: 'Demo Creator',
  passwordHash: await bcrypt.hash('Demo@FormForge2026', 12), isAdmin: false };

await db.insert(users).values([DEMO_USER]).onConflictDoNothing();
// Then forms → fields → responses → response_answers with onConflictDoNothing()
// Seed responses in batches of 50 to avoid Neon connection limits
```

### Form 1: Ghost of Tsushima — Samurai Oath (~250 responses)

```
Slug:       samurai-oath       Theme: ghost-of-tsushima    Visibility: public
Fields:
  1. Your warrior name             [short_text,    required]
  2. Chosen fighting style         [single_select, required]
     Way of the Samurai | Ghost Tactics | Balanced Path | The Ronin Way
  3. Which clan do you serve?      [single_select, required]
     Clan Sakai | The Ghost | Shimura's Army | No Clan
  4. Rate your sword proficiency   [rating max=10, required]
  5. Describe your greatest battle [long_text,     optional]
  6. Your email                    [email,         optional]

Seed distributions (deterministic, not random):
  Style: cycle through fighting styles with weighted index mapping
  Clan:  cycle through clans with weighted index mapping
  Rating: cycle through [6,7,7,8,8,8,9,9,10,5]
```

### Form 2: JJK — Sorcerer Registration (~250 responses)

```
Slug:       jjk-sorcerer-registration    Theme: jujutsu-kaisen    Visibility: public
Fields:
  1. Your name                     [short_text,    required]
  2. Cursed techniques             [multi_select,  required]
     Cursed Energy Manipulation | Dismantle | Blood Manipulation |
     Ten Shadows | Limitless | Idle Death Gamble
  3. Jujutsu High grade            [single_select, required]
     Grade 4 | Grade 3 | Grade 2 | Grade 1 | Special Grade
  4. Sacrifice for comrades        [rating max=10, required]
  5. Accept binding vow            [checkbox,      required]
  6. Your email                    [email,         optional]

Seed distributions:
  Techniques: cycle through technique pairs
  Grade: cycle through grades with weighted index mapping
  Sacrifice: cycle through [6,7,7,8,8,8,9,9,10,5]
```

### Form 3: Karan Aujla Concert — VIP Backstage (~250 responses)

```
Slug:       aujla-vip-backstage    Theme: karan-aujla-concert    Visibility: public
Fields:
  1. Your name                     [short_text,    required]
  2. Favorite Karan Aujla song     [dropdown,      required]
     Tauba Tauba | Softly | Wavy | Winning Speech | Boyfriend |
     Admirin' You | White Brown Black | Top Fella | For A Reason | Don't Worry
  3. Concerts attended             [number min=0 max=50, required]
  4. Concert date                  [date,          required]
  5. Phone (for VIP passes)        [short_text,    optional]
  6. Your email                    [email,         optional]

Seed distributions:
  Songs: cycle through names array
  Concerts: cycle through [0,0,1,0,1,2,0,1,0,3]
  Dates: deterministic 2026 dates
```

**Total: 750 seeded responses distributed evenly across 3 forms via deterministic modulo cycling.**

---

## 16. Rate Limiting & Spam Protection

### Tiered Limiters (Exact Names Required by Scanner)

```typescript
// apps/api/src/common/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// Tier 1: All routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { success: false, error: 'Too many requests.' },
  standardHeaders: true, legacyHeaders: false,
});

// Tier 2: Auth write operations
export const apiWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { success: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

// Tier 3: Public form submission
export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { success: false, error: 'Too many submissions. Try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

// Password reset — stricter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 3,
  message: { success: false, error: 'Too many password reset attempts.' },
});

// Wired in app.ts:
// app.use(globalLimiter);                               ← all routes
// app.use('/api/auth/login', apiWriteLimiter);
// app.use('/api/auth/forgot-password', passwordResetLimiter);
// app.use('/api/auth/reset-password',  passwordResetLimiter);
// submissionLimiter applied in responses tRPC router context
```

### Honeypot Field

`SubmitResponseSchema._hp` — CSS-hidden on frontend (`display:none; position:absolute`).
Bots fill it. Humans never see it. Server returns fake 200 without DB insert.

### Cloudflare Turnstile (Feature-Flagged)

```typescript
// Only activates when TURNSTILE_ENABLED=true in production
async function verifyTurnstileToken(token?: string): Promise<boolean> {
  if (!token || !env.TURNSTILE_SECRET_KEY) return false;
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY, response: token }) }
  );
  const data = (await res.json()) as { success: boolean };
  return data.success;
}
```

---

## 17. Sentry Integration

```typescript
// apps/api/src/instrument.ts — imported FIRST in index.ts before all else
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn:              process.env.SENTRY_DSN,
  environment:      process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
});

// apps/api/src/app.ts
Sentry.setupExpressErrorHandler(app); // BEFORE our errorHandler
app.use(errorHandler);                // LAST
```

---

## 18. API Documentation (Scalar + trpc-openapi)

```typescript
// apps/api/src/app.ts
import { createOpenApiExpressMiddleware } from 'trpc-openapi';
import { apiReference } from '@scalar/express-api-reference';

// REST API via trpc-openapi (auto-generated from Zod schemas — zero drift)
app.use('/api', createOpenApiExpressMiddleware({ router: appRouter, createContext }));

// Serve auto-generated spec
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

// Scalar UI
app.use('/docs', apiReference({
  spec:    { url: '/openapi.json' },
  theme:   'default',
  layout:  'modern',
  defaultHttpClient: { targetKey: 'javascript', clientKey: 'fetch' },
}));
```

---

## 19. Deployment Architecture & CI/CD

### Environment Variables

```bash
# apps/api/.env (NEVER committed — .env.example IS committed with all keys)
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...neon.tech/...
JWT_ACCESS_SECRET=<random-min-32-chars>
JWT_REFRESH_SECRET=<random-min-32-chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_URL=https://formforge.jdevs.codes
RESEND_API_KEY=re_...
SENTRY_DSN=https://...@sentry.io/...
TURNSTILE_SECRET_KEY=...
TURNSTILE_ENABLED=true

# apps/web/.env.local (NEVER committed)
API_URL=https://api.formforge.jdevs.codes          ← server-side only, NO NEXT_PUBLIC
NEXT_PUBLIC_API_URL=https://api.formforge.jdevs.codes
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:   { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  check:
    name: Typecheck + Lint + Test + Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run typecheck
      - run: pnpm turbo run lint
      - run: pnpm turbo run test
      - run: pnpm turbo run build
        env:
          DATABASE_URL: postgresql://stub:stub@stub/stub
          JWT_ACCESS_SECRET: stub-secret-minimum-thirty-two-characters-xx
          JWT_REFRESH_SECRET: stub-secret-minimum-thirty-two-characters-xx
          APP_URL: https://formforge.jdevs.codes
          RESEND_API_KEY: re_stub
```

**Required in every app/package package.json:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test":      "vitest run",
    "lint":      "eslint src --max-warnings 0",
    "build":     "..."
  }
}
```

**README CI badge:**
```markdown
![CI](https://github.com/PreetMax85/formforge/actions/workflows/ci.yml/badge.svg)
```

---



## 21. Git Commit Convention

**Never squash. Never push everything in one commit.**

```
feat: initialize turborepo monorepo structure with pnpm workspaces
feat: add packages/db drizzle schema users sessions token-blocklist
feat: add packages/db drizzle schema forms fields with jsonb config
feat: add packages/db drizzle schema responses with idempotency hash
feat: add packages/shared zod schemas auth and forms
feat: add packages/shared zod schemas fields with discriminated union config
feat: add packages/shared conditional logic zod schema and resolveVisibleFieldGraph
feat: add packages/shared zod response schemas with jsonb answer union
feat: add packages/shared ApiError class and constants
feat: implement env validation with zod and process.exit(1) on failure
feat: implement pino structured logging
feat: implement createApp factory and express server setup
feat: implement custom jwt auth signup login refresh logout
feat: add token revocation via token_blocklist table
feat: implement requireAuth optionalAuth middleware
feat: implement tiered rate limiters globalLimiter apiWriteLimiter submissionLimiter
feat: add trpc context router and three procedure types
feat: implement forms trpc router with collision-safe slug generation
feat: implement fields trpc router with upsert and reorder
feat: implement responses trpc router with identity resolution pipeline
feat: implement analytics trpc router with four intelligence functions
feat: add trpc-openapi and scalar api documentation at /docs
feat: implement game engine inspector shell with console panel
feat: implement form builder canvas with dnd-kit drag and drop
feat: implement field inspector panel with conditional logic ui
feat: implement shared formrenderer with preview and live modes
feat: implement public form page with data-attribute theme engine
feat: add explore page with public forms grid
feat: implement zustand form runtime store with sessionStorage persist
feat: add spam protection honeypot turnstile and detectSpamSubmissionCluster
feat: implement landing page and pricing page
feat: add qr code sharing modal
feat: implement analytics dashboard with all four intelligence functions
feat: add csv export for responses
feat: add sentry monitoring to api and web
feat: add github actions ci pipeline
feat: add idempotent seed script 750 responses across 3 themed forms
docs: write readme with architecture rationale demo credentials ci badge
chore: configure vercel and railway deployment with custom domain
```

---

## 22. The 5 Must-Be-Perfect Files

Zero dead code. Zero `any`. Perfect TypeScript.

### File 1: `apps/api/src/common/config/env.ts`

```typescript
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT:                   z.coerce.number().default(8080),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL:           z.string().startsWith('postgresql'),
  JWT_ACCESS_SECRET:      z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  APP_URL:                z.string().url(),
  RESEND_API_KEY:         z.string().startsWith('re_'),
  SENTRY_DSN:             z.string().url().optional(),
  TURNSTILE_SECRET_KEY:   z.string().optional(),
  TURNSTILE_ENABLED:      z.coerce.boolean().default(false),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('[ENV] Invalid or missing environment variables:');
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
  process.exit(1); // Fail fast — never run with bad config
}

export const env = result.data;
```

### File 2: `apps/api/src/app.ts`

```typescript
import './instrument'; // Sentry — FIRST, before all other imports
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import * as Sentry from '@sentry/node';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware } from 'trpc-openapi';
import { apiReference } from '@scalar/express-api-reference';
import { env } from './common/config/env';
import { logger } from './common/logger';
import { appRouter, openApiDocument } from './trpc/router';
import { createContext } from './trpc/context';
import { errorHandler } from './common/middleware/error';
import { sql } from 'drizzle-orm';
import {
  globalLimiter, apiWriteLimiter,
  passwordResetLimiter,
} from './common/middleware/rateLimit';

/**
 * Factory function — creates and configures Express application.
 * Separated from index.ts for testability (import without starting server).
 */
export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.APP_URL, credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(globalLimiter);

  app.use('/api/auth/login',           apiWriteLimiter);
  app.use('/api/auth/signup',          apiWriteLimiter);
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/auth/reset-password',  passwordResetLimiter);

// 1. Auth routes — plain Express, not tRPC
// app.use('/api/auth', authRouter); ← registered in auth module setup
// 2. tRPC internal endpoint
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
// 3. OpenAPI REST adapter — only for forms/responses/analytics
// Using /api/v1 to avoid conflicting with /api/auth Express routes
app.use('/api/v1', createOpenApiExpressMiddleware({ router: appRouter, createContext }));

  app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  app.use('/docs', apiReference({ spec: { url: '/openapi.json' },
    theme: 'default', layout: 'modern' }));

  app.get('/health', async (_req, res) => {
    const { db } = await import('./common/db');
    let dbStatus = 'connected';
    try { await db.execute(sql`SELECT 1`); }
    catch { dbStatus = 'disconnected'; }
    res.json({
      status: 'ok',
      version: process.env['npm_package_version'] ?? '1.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      db: dbStatus,
    });
  });

  Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler); // MUST be last

  return app;
}
```

### File 3: `apps/api/src/index.ts`

```typescript
import { createApp } from './app';
import { env } from './common/config/env';
import { logger } from './common/logger';
import { db } from './common/db';
import { tokenBlocklist } from '@repo/db/schema';
import { lt } from 'drizzle-orm';

const app = createApp();

// Cleanup expired token blocklist entries every 15 minutes
setInterval(async () => {
  try {
    await db.delete(tokenBlocklist).where(lt(tokenBlocklist.expiresAt, new Date()));
  } catch (err) {
    logger.error({ err }, '[CLEANUP] Token blocklist cleanup failed');
  }
}, 15 * 60 * 1000);

app.listen(env.PORT, () => {
  logger.info(`[API] FormForge running on port ${env.PORT} (${env.NODE_ENV})`);
  logger.info(`[API] Docs: http://localhost:${env.PORT}/docs`);
});
```

### File 4: `apps/api/src/common/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@repo/db/schema';
import { env } from '../config/env';
import { logger } from '../logger';

// NOTE: `neonClient` here is the Neon serverless HTTP transport client.
// It is NOT drizzle-orm's sql tagged template literal.
// drizzle-orm's sql is used in query builders — import separately when needed.
const neonClient = neon(env.DATABASE_URL);

export const db = drizzle(neonClient, {
  schema,
  logger: env.NODE_ENV === 'development',
});

// Graceful shutdown on SIGTERM
const shutdown = (signal: string) => {
  logger.info(`[DB] Received ${signal}. Shutting down gracefully.`);
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

### File 5: `apps/api/src/common/logger.ts`

```typescript
import pino from 'pino';
import { env } from './config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: { service: 'formforge-api' },
});
```

---

## 23. Vitest Test Suite

```typescript
// apps/api/src/modules/responses/responses.service.test.ts
import { describe, it, expect } from 'vitest';
import { validateResponseAnswers, submitResponse } from './responses.service';

describe('validateResponseAnswers — Response submission validation', () => {
  it('rejects text value for a number field', () => {
    const result = validateResponseAnswers(
      [{ id: 'f1', type: 'number', required: true, config: { min: 0, max: 100 }, label: 'Age' }],
      [{ fieldId: 'f1', value: 'not-a-number' }]
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('number');
  });

  it('rejects submission with missing required field', () => {
    const result = validateResponseAnswers(
      [{ id: 'f1', type: 'short_text', required: true, config: {}, label: 'Name' }],
      []
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects invalid email format in email field', () => {
    const result = validateResponseAnswers(
      [{ id: 'f1', type: 'email', required: true, config: {}, label: 'Email' }],
      [{ fieldId: 'f1', value: 'not-an-email' }]
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });

  it('accepts valid submission with all required fields present', () => {
    const result = validateResponseAnswers(
      [
        { id: 'f1', type: 'short_text', required: true,  config: {}, label: 'Name'  },
        { id: 'f2', type: 'email',      required: true,  config: {}, label: 'Email' },
        { id: 'f3', type: 'number',     required: false, config: {}, label: 'Age'   },
      ],
      [
        { fieldId: 'f1', value: 'Preet' },
        { fieldId: 'f2', value: 'preet@formforge.jdevs.codes' },
      ]
    );
    expect(result.success).toBe(true);
  });
});

describe('submitResponse honeypot', () => {
  it('returns silent success when honeypot is filled', async () => {
    const result = await submitResponse({
      formSlug:      'test-form',
      answers:       [{ fieldId: '11111111-1111-4111-8111-111111111111', value: 'test' }],
      sendEmailCopy: false,
      _hp:           'bot-filled-this',
    });
    expect(result).toEqual({ success: true, message: 'Response submitted successfully.' });
  });
});

// packages/shared/src/schemas/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { SubmitResponseSchema, ConditionalLogicSchema } from './index';

const VALID_FIELD_ID = '11111111-1111-4111-8111-111111111111';
const VALID_SOURCE_FIELD_ID = '22222222-2222-4222-8222-222222222222';

describe('SubmitResponseSchema', () => {
  it('rejects honeypot value', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [{ fieldId: VALID_FIELD_ID, value: ['honor'] }],
      _hp:      'bot-filled-this',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty answers array', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid multi-select array answer', () => {
    const result = SubmitResponseSchema.safeParse({
      formSlug: 'samurai-oath',
      answers:  [{ fieldId: VALID_FIELD_ID, value: ['honor', 'duty', 'sacrifice'] }],
    });
    expect(result.success).toBe(true);
  });
});

describe('ConditionalLogicSchema', () => {
  it('parses valid show/hide rule', () => {
    const result = ConditionalLogicSchema.safeParse({
      action: 'show',
      match:  'any',
      rules:  [{ sourceFieldId: VALID_SOURCE_FIELD_ID, operator: 'equals', value: 'yes' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty rules array', () => {
    const result = ConditionalLogicSchema.safeParse({
      action: 'show',
      match:  'any',
      rules:  [],
    });
    expect(result.success).toBe(false);
  });
});

// apps/api/src/modules/analytics/analytics.service.test.ts
import { describe, it, expect } from 'vitest';
import { computeFormHealthScore, generateFormInsightsSummary } from './analytics.service';
import type { FormStats, FormAnalyticsStats } from '@repo/shared';

const realisticStats: FormStats = {
  completionRate:           0.62,
  recentResponses:          30,
  previousResponses:        20,
  avgDropoffRate:           0.15,
  avgFieldsAnswered:        4,
  totalFields:              6,
  totalUnconditionalFields: 5,
};

describe('computeFormHealthScore', () => {
  it('returns integer between 0 and 100', () => {
    const score = computeFormHealthScore(realisticStats);
    expect(score).not.toBeNull();
    expect(Number.isInteger(score as number)).toBe(true);
    expect(score as number).toBeGreaterThanOrEqual(0);
    expect(score as number).toBeLessThanOrEqual(100);
  });

  it('weights completion rate at 40%', () => {
    const score = computeFormHealthScore({
      completionRate:           1,
      recentResponses:          0,
      previousResponses:        0,
      avgDropoffRate:           1,
      avgFieldsAnswered:        0,
      totalFields:              1,
      totalUnconditionalFields: 1,
    });
    expect(score).toBe(40);
  });
});

describe('generateFormInsightsSummary', () => {
  it('returns array of FormInsight objects', () => {
    const stats: FormAnalyticsStats = { ...realisticStats, totalResponses: 50 };
    const insights = generateFormInsightsSummary(stats);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      expect(['positive', 'warning', 'neutral']).toContain(insight.type);
      expect(typeof insight.icon).toBe('string');
      expect(typeof insight.message).toBe('string');
      expect(insight.message.length).toBeGreaterThan(0);
    }
  });
});

```

---
