# FormForge

A production-grade form builder for creators who care about craft.
Build dynamic forms, publish with custom themes, and collect responses — all
through a Game Engine Inspector interface.

---

## Live

| | |
|---|---|
| Frontend | https://formforge.jdevs.codes |
| API | https://api.formforge.jdevs.codes |
| API Docs | https://api.formforge.jdevs.codes/docs |
| Explore | https://formforge.jdevs.codes/explore |

---

## Demo Credentials

| | |
|---|---|
| Demo login | `demo@formforge.jdevs.codes` |
| Demo password | `Demo@FormForge2026` |

---

## Featured Forms

Three themed public forms are seeded in the demo account. Each demonstrates a
different visual theme from the theme engine.

| Form | Theme |
|---|---|
| [/f/samurai-oath](https://formforge.jdevs.codes/f/samurai-oath) | Ghost of Tsushima |
| [/f/jjk-sorcerer-registration](https://formforge.jdevs.codes/f/jjk-sorcerer-registration) | Jujutsu Kaisen |
| [/f/aujla-vip-backstage](https://formforge.jdevs.codes/f/aujla-vip-backstage) | Karan Aujla Concert |

---

## Features

- **Drag-and-drop form builder** with 10 field types (text, number, email,
  select, multi-select, rating, date, file upload, long text, URL)
- **8 visual themes** with full CSS variable injection and animated canvas
  backgrounds
- **Conditional logic** — show/hide fields based on previous answers (server-side
  validated)
- **Multi-step form rendering** with Zustand-powered state and sessionStorage
  persistence
- **Analytics dashboard** — health score, Q1→Qn dropoff funnel,
  views→submit completion funnel, per-field breakdowns, time-series charts,
  AI-generated insight cards
- **Identity resolution pipeline** — honeypot anti-spam → Turnstile CAPTCHA →
  spam cluster detection → 30s deduplication hash → transactional insert
- **Tiered rate limiting** — global, write, submission, and password-reset
  limiters
- **QR code sharing** — one-click share modal for every published form
- **Custom JWT auth** with refresh token rotation, token blocklist, and
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
| Email | Resend, React Email |
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
│   ├── email/        ← React Email templates (ResponseReceived, ResponseCopy)
│   └── ui/           ← Shared UI primitives
│
├── Dockerfile        ← Railway deployment
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
```

---

## API Documentation

Interactive OpenAPI docs powered by Scalar at
[http://localhost:8080/docs](http://localhost:8080/docs).

The spec is auto-generated from Zod schemas via `trpc-to-openapi` — zero drift
between validation and documentation.

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | formforge.jdevs.codes |
| Backend | Railway (Dockerfile) | api.formforge.jdevs.codes |
| Database | Neon | Serverless PostgreSQL |

**Vercel env vars:**
- `NEXT_PUBLIC_API_URL` — deployed API origin

**Railway env vars:**
- `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `APP_URL`, `COOKIE_DOMAIN`
- `RESEND_API_KEY`, `TURNSTILE_ENABLED`

See `.env.example` for the full list.

---

## License

MIT
