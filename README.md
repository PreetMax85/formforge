# FormForge

A form builder for creators who care about craft.
Build dynamic forms, publish with custom themes, and collect responses — all
through a Game Engine Inspector interface.

**Live:** [formforge.jdevs.codes](https://formforge.jdevs.codes) · [public API docs](https://formforge.jdevs.codes/docs)

---

## Features

- **Drag-and-drop form builder** with 10 implemented field types
  (short text, long text, email, number, single select, multi-select, checkbox,
  rating, date, dropdown)
- **8 visual themes** with full CSS variable injection and animated canvas
  backgrounds
- **Conditional logic** — show/hide fields based on previous answers (server-side
  validated)
- **Multi-step form rendering** with Zustand-powered state and sessionStorage
  persistence
- **Analytics dashboard** — health score, Q1→Qn dropoff funnel,
  views→submit completion funnel, per-field breakdowns, time-series charts,
  rule-based insight cards
- **Identity resolution pipeline** — honeypot anti-spam → Turnstile CAPTCHA →
  spam cluster detection → 30s deduplication hash → transactional insert
- **Tiered rate limiting** — global, login/signup, token refresh, submission,
  view-count, and password-reset limiters
- **QR code sharing** — one-click share modal for every published form
- **Custom JWT auth** with refresh token rotation (30-second grace period for
  the previous token), token blocklist, and
  cross-subdomain cookie support

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, React 19 |
| Backend | Express.js, tRPC |
| Database | Neon (serverless PostgreSQL), Drizzle ORM |
| Validation | Zod (shared between frontend and backend) |
| State | Zustand |
| Styling | Tailwind CSS, shadcn/ui |
| Animation | framer-motion |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Email | Resend |
| Logging | pino |
| Monitoring | Sentry |
| API Docs | Scalar |
| Monorepo | Turborepo, pnpm workspaces |

---

## Architecture

```
formforge/
├── apps/
│   ├── web/          ← Next.js frontend
│   │   ├── app/      ← App Router pages (marketing, auth, dashboard, f/[slug])
│   │   ├── components/
│   │   │   ├── engine/    ← Game Engine Inspector shell
│   │   │   ├── builder/   ← Form builder (FieldCard, FieldInspector, BuilderCanvas)
│   │   │   ├── analytics/ ← Health score, funnels, time-series, insights
│   │   │   ├── form/      ← FormRenderer (shared preview + live modes)
│   │   │   └── shared/    ← QRCodeModal, ThemeBackground, LoadingState
│   │   └── lib/           ← tRPC client, auth, Zustand form store
│   │
│   └── api/          ← Express.js backend
│       └── src/
│           ├── common/    ← env config, db client, logger, middleware
│           ├── trpc/      ← tRPC router, context, auth/forms/fields/responses/analytics
│           └── modules/   ← service layer (auth, forms, fields, responses, analytics)
│
├── packages/
│   ├── shared/       ← Zod schemas, types, ApiError, constants, conditional-logic utils
│   ├── db/           ← Drizzle schema, migrations, seed script
│   ├── trpc/         ← AppRouter type export + client factory
│   ├── email/        ← Resend helpers for notification emails (plain text)
│   └── ui/           ← (empty)
│
├── vercel.json       ← Vercel deployment: web + API as two services, one origin
├── scripts/boot-smoke-test.sh ← starts the real API; CI fails if it can't
├── Dockerfile        ← container build (not used by the Vercel deployment)
├── .github/workflows/ci.yml
└── turbo.json
```

---

## Getting Started

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The API starts on `http://localhost:8080` and the frontend on
`http://localhost:3000`.

### Database

```bash
pnpm --filter @repo/db db:migrate   # apply migrations
pnpm --filter @repo/db db:seed      # seed demo data (idempotent)
```

### Tests

```bash
pnpm turbo run test
scripts/boot-smoke-test.sh   # boots the API; needs the env vars from .env
```

---

## API Documentation

Interactive OpenAPI docs powered by Scalar at
[formforge.jdevs.codes/docs](https://formforge.jdevs.codes/docs) (locally,
[http://localhost:8080/docs](http://localhost:8080/docs)).

Only the public endpoints are exposed over REST at `/api/v1` and documented:
fetch a published form, record a view, list public forms, and submit a response.
The app itself talks to the API over tRPC at `/trpc`. The spec is generated from
the same tRPC/Zod sources that power validation.

---

## Deployment

One Vercel project serves both apps from one origin using
[Vercel Services](https://vercel.com/docs/services) (`vercel.json`): Next.js
at `/`, and the Express API on `/trpc`, `/api/v1`, `/docs`, `/openapi.json` and
`/health`. Serving both from one origin keeps the refresh-token cookie
first-party. Functions run in `sin1`, next to the Neon database in Singapore.

| Service | Platform |
|---|---|
| Web + API | Vercel (Hobby), region `sin1` |
| Database | Neon (Free), `aws-ap-southeast-1` |

**Vercel env vars:** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`APP_URL`; optionally `RESEND_API_KEY`, `SENTRY_DSN`, `TURNSTILE_ENABLED` and
`TURNSTILE_SECRET_KEY`. Leave `NODE_ENV` unset: Vercel sets it at runtime, and
setting it in the project also applies it to the build, where pnpm then skips
devDependencies. Leave `NEXT_PUBLIC_API_URL` unset too, so the browser calls the
same origin.

See `.env.example` for the full list.

---

## License

MIT
