# FormForge — Adversarial Revival Pass

**Scheduled run:** 2026-09-09, 04:15 IST · **Branch:** `main` · **Mode:** diagnosis only

---

## 1. Why you exist

FormForge is a side project built May–June 2026 and dormant since. Its owner is
applying for **software internships, mostly at startups and YC companies**, with
only a few big-tech applications. He wants the project revived, sharpened, and
made genuinely good. He has stated he is willing to **strip the entire UI** if
that makes the project better.

You are the adversarial pass. Two people are looking at this repo through you:
a **Screener** who decides whether its author gets an interview, and a
**Believer** who thinks it could be a product and wants to know what it would
take. Both are on the author's side. Neither is polite.

### The anchor fact

FormForge was reviewed live on a stream. The reviewer opened the dashboard,
**could not work out what to do next**, and closed the project without building
a form. They did not realise that fields are dragged from the left palette onto
the centre canvas and edited in the right-hand inspector.

This is the most valuable evidence in the entire repository. It is a real
zero-to-first-value failure with a real observer, and it outranks every
heuristic you can generate on your own. The owner finds it a sore subject, so
treat it as evidence, not as an anecdote to be clever about.

Screenshots of that exact path are committed at `docs/review/screenshots/`.
**Look at them.** They are the primary evidence for Workstream 1.

---

## 2. Rules

1. **Diagnosis only.** Do not modify anything under `apps/` or `packages/`. You
   write documents. The one exception is the deliverables listed in section 6.
2. **No time-boxing, no sampling.** Read every relevant file. Do not scope down
   to a "representative subset". Use maximum effort throughout. If something is
   too large for one pass, say so and propose a split — never silently shrink.
3. **A persona may be impatient; you may not.** Reporting "a hurried screener
   would bounce at line 3 of the README" is a valid finding. Reaching that
   finding by skimming is not. Read everything, then report what a hurried
   reader would have missed.
4. **Cite `file_path:line_number`** for every code claim.
5. **Primary sources only** for external facts: official docs, source code,
   specs, changelogs. Never a secondary write-up.
6. **Do not re-run the existing code audit.** `.opencode/agents/formforge-auditor.md`
   already covers P0/P1/P2 correctness and security sweeps. You sit above it.
   If you find something it would have caught, note it in one line and move on.
7. **Argue, don't assert.** Every recommendation to keep, change, or delete
   something must carry the case against itself before the verdict.

---

## 3. Confirmed findings — do not rediscover, go deeper

These were verified on 2026-09-08/09. Treat them as given and build past them.

### 3.1 `main` does not boot — the headline finding

The API crashes at import, before it ever listens:

```
TRPCError: [mutation.auth.signup] - Output parser expects a Zod validator
```

`trpc-to-openapi` requires every procedure carrying `.meta({ openapi })` to
declare an `.output()` Zod schema. The repo has **33 annotated procedures and
4 output schemas**:

| Router | `.meta({openapi})` | `.output()` |
|---|---|---|
| `auth.ts` | 6 | 0 |
| `forms.ts` | 13 | 3 |
| `fields.ts` | 3 | 0 |
| `responses.ts` | 4 | 1 |
| `analytics.ts` | 7 | 0 |

It throws from **two** independent call sites, either of which alone is fatal:
`generateOpenApiDocument` at `apps/api/src/trpc/router.ts:19`, and
`createOpenApiExpressMiddleware` at `apps/api/src/app.ts:96`.

Introduced by commit `70d2336` ("docs(api): openapi meta annotations for all
procedures", 2026-06-21), which took annotations from 4/33 to 33/33 without
adding output schemas. Before it, the 4 annotated procedures were exactly the 4
with output schemas, and the API ran. **That commit's own message says it was
made to satisfy an AI judge that flagged "sparse annotations."**

CI (`.github/workflows/ci.yml`) runs `typecheck`, `build`, and `test`, all of
which pass, because none of them boot the app.

**Go deeper on:** the correct fix and its full shape; whether output schemas
should be hand-written or derived; whether a boot smoke test belongs in CI and
what else that class of test would have caught; and the meta-lesson — a change
made to score better against a rubric destroyed the product, which is a theme
worth carrying through the whole report.

### 3.2 The deployment is gone

`api.formforge.jdevs.codes` returns Railway's `{"code":404,"message":"Application not found"}`
on every path. `formforge.jdevs.codes` still serves pages from Vercel, but they
are shells that cannot fetch. The README advertises the live URLs, demo
credentials, and an API docs link that 404s. Given 3.1, the service almost
certainly crash-looped after `70d2336` and never came back.

The owner has explicitly de-scoped redeployment — he intends to make the project
good locally first and redeploy later. **Do not write a deployment runbook.**
Do report the README's dead claims as a Screener finding.

### 3.3 Database

The Neon project behind the deployed app is out of compute quota (HTTP 402). A
fresh Neon project was provisioned for local development on 2026-09-08 and
seeded successfully: 1 user, 3 forms, 18 fields, 750 responses, 4500 answers.
Local `.env` points at it. Nothing here is committed.

### 3.4 Analytics defects visible in the screenshots

From `analytics-01.png`, on a form with **zero** responses:

- The **Q1 → Qn drop-off** chart renders "Short Answer" as a full bar at
  **100%**. With no responses this should be empty or N/A.
- That chart's x-axis reads `0% · 30% · 60% · 105%`. A percentage axis with a
  **105%** tick is a domain bug.
- The **AI INSIGHTS** panel displays the identical string as the FORM HEALTH
  SCORE panel — "Not enough data to calculate form health. Share your form to
  start collecting responses." — so the same sentence appears twice on one
  screen in two different components.

From `analytics-02.png`: `FIELD RESPONSE COUNTS` draws an axis from 0–4 for
zero data. Counting the page as a whole, a new user's first analytics view is
**six consecutive empty panels**.

Trace each to source and say whether it is a guard bug, a chart-domain bug, or
a copy bug.

### 3.5 The vocabulary split — the likely cause of the stream failure

The builder is dressed as a Unity editor. From the screenshots, the empty
dashboard reads:

> Scene is empty. Press [+ New Form] to instantiate your first GameObject.

with a primary button labelled **"Instantiate Form"**. The builder labels its
regions `PROJECT HIERARCHY`, `COMPONENT PALETTE`, `SCENE EDITOR`, `INSPECTOR`,
and a `CONSOLE` that logs `Asset "Short Answer" added to scene (unsaved)`.

But `form-settings.png` shows plain English with helper text under every field,
and the form-level nav is `Dashboard · Overview · Builder · Responses ·
Settings`. **The same application speaks two languages**, and the one guarding
the front door is the jargon.

Note also: the builder *does* contain the instructions — "Drag a component from
the palette", "Drag a field to instantiate" — rendered in very low-contrast grey
on near-black. So the failure is probably not missing guidance. Candidate
explanations to test against the code and pixels, and there may be others:

- the hint text is too low-contrast to register
- "Component Palette" does not read as "your form fields"
- palette rows look like a menu, not draggable objects — no grip, no drag cursor
- **clicking a palette row may do nothing**, so the natural first action fails
  silently with no feedback pointing to drag
- five regions of chrome exist before any content does
- no template, sample, or example path — the only road is the hardest one

**The strategic question you must answer:** the game-engine metaphor is
simultaneously this project's most distinctive asset and its demonstrated point
of failure. Is there a version that keeps the aesthetic — monospace, dark,
panelled, the console, "Play" for preview — while making the *nouns* plain?
Argue it properly in both directions.

### 3.6 The landing page sells its own emptiness

`landing-page-01.png` positions FormForge as "// THE GAME ENGINE FOR FORMS",
headline "Forms deserve better tooling.", sub-head "You already use a game
engine to build worlds. Why are you still building forms in a spreadsheet
clone?" Two things follow:

- The copy **presumes the visitor is a game developer**. That is either a sharp
  wedge or a fatal narrowing, and it is the same assumption that made the
  builder unreadable to a reviewer who was not one. Resolve this.
- The hero's three proof stats are "**750+ responses seeded**", "10 field
  types", "< 60s to publish a form", and `landing-page-02.png` closes with
  "These are real forms with real seeded data." The site **advertises its
  seed data as a metric**. A startup screener reads that as "no real users".
  The "< 60s to publish" claim is also directly contradicted by the stream
  evidence.

`landing-page-02.png` also shows the Next.js dev overlay reporting **"1 Issue"**
on the landing page. Find it.

### 3.7 Save model

`03-builder-left-palette.png` shows an `UNSAVED` badge in the inspector and a
manual `SAVE CHANGES` button — placed at the **bottom of the centre column**,
while the editing it applies to happens in the **right** panel. There is no
autosave, and the repo's own `todo.md` lists Zustand `isDirty` tracking as
never done, so a `beforeunload` guard is likely absent too. Assess the
data-loss risk on the real first-run path.

### 3.8 Stack staleness lead

`AGENTS.md` mandates `next build --webpack` because "@sentry/nextjs v8 does not
support Turbopack". The installed SDK still emits that warning in dev, pointing
at getsentry/sentry-javascript#8105. **Verify against current primary sources**
whether this is still true in September 2026, and what it costs to keep.

---

## 4. The two personas

### The Screener

A YC/startup internship reviewer. They weight shipping ability, product
judgement, and evidence of real user contact far above algorithmic depth. They
clone the repo and run it.

Answer, bluntly:

- Does it run? (No — see 3.1.) What does that alone cost the candidate?
- Does the code show **judgement**, or volume? `AGENTS.md` is 29KB and mandates
  verbatim comments such as "Multi-Strategy Identity Resolution Pipeline" and
  "Distributed Mutex Lock" on a form builder. Read the code those comments sit
  above and say whether the naming is earned or inflated. This matters: a
  Screener who thinks a candidate oversells will discount everything else.
- What is the strongest genuine signal here? Name the two or three things that
  would actually make you take the interview.
- The stream failure is **evidence of real user contact**, which most portfolio
  projects lack entirely. How should the author present it so it reads as
  judgement rather than embarrassment?
- Verdict: interview, or pass, and what single change most moves that.

### The Believer

Someone who likes this and wants to know if it can be a product.

- Form builders are a bloodbath: Typeform, Tally, Google Forms, Fillout,
  Formbricks, Jotform. You are **free to conclude that a generic form builder is
  dead on arrival** and to propose wedges instead.
- Propose at most three candidate wedges. Each needs a first user you can name,
  a reason this team can win it, and a **kill criterion** — the observation that
  would tell the author to abandon it. Wedges without kill criteria are
  brainstorm mush.
- Interrogate the game-engine positioning from 3.6 as wedge candidate zero.
- What would you cut? Assume cutting is cheap and the author is willing.

---

## 5. Workstreams

Run these in parallel where you can. Depth over speed everywhere.

1. **First-run cognitive walkthrough** — the centrepiece. Use the screenshots
   plus the source (`components/engine/`, `components/builder/`,
   `app/dashboard/`, `lib/store/formStore.ts`). Reconstruct the path from
   signup to first published form. Find every stall point. Rank fixes by the
   single question: *would this have saved the reviewer on the stream?*
2. **Stack staleness audit** — invoke `mattpocock-skills:research`. Primary
   sources only, one cited Markdown file. Cover Next.js 16, React 19, tRPC v11,
   `trpc-to-openapi`, Drizzle, Zod v4, Sentry, Tailwind v4, @dnd-kit, Neon
   serverless. Current versions, breaking changes, deprecations, and the 3.8
   question specifically.
3. **Architecture deepening scan** — invoke `mattpocock-skills:codebase-design`
   for vocabulary, then `improve-codebase-architecture`'s method: the deletion
   test, shallow modules, seams, locality, leverage. Weight recent hot spots.
   Note that neither `CONTEXT.md` nor `docs/adr/` exists, so there is no domain
   glossary or ADR history to read — say whether they are worth creating.
4. **Market and wedge teardown** — the Believer's workstream.
5. **Screener verdict** — the Screener's workstream, written last, informed by
   all of the above.

**Skills to invoke explicitly.** Several are `disable-model-invocation: true`
and will never load unless you name them: `mattpocock-skills:research`,
`mattpocock-skills:codebase-design`, `mattpocock-skills:to-questionnaire`,
`superpowers:verification-before-completion`. Note that
`mattpocock-skills:to-tickets` and `triage` assume `setup-matt-pocock-skills`
has been run — it has not, and there are no GitHub issues — so produce the
ticket list as Markdown instead.

---

## 6. Deliverables

Open **one pull request** against `main` containing:

1. `docs/review/2026-09-09-adversarial-report.md` — the full report. Lead with
   the Screener's verdict, because that is the thing the author most needs to
   read first. Then the first-run walkthrough, the architecture findings, and
   the Believer's wedge analysis.
2. `docs/review/2026-09-09-stack-research.md` — Workstream 2, every claim cited.
3. `docs/review/2026-09-09-questionnaire.md` — via
   `mattpocock-skills:to-questionnaire`. Every decision only the author can
   make: which wedge, whether the game-engine metaphor survives, what gets cut.
   Order it most-important-first; he answers it over coffee.
4. `docs/review/2026-09-09-tickets.md` — prioritised, each ticket with its
   blocking edges, sized, and ordered so the first one is the one to do first.

Also **publish the report as an Artifact** and put the link at the top of the PR
description, so it can be read on a phone. If publishing is unavailable, say so
in the PR rather than silently skipping it.

The PR description must open with the three findings the author most needs to
know, in plain language, above any structure.

---

## 7. What good looks like

The author already knows this project has problems. A report that lists them
has failed. A report that tells him **which two things to fix first, why those
two, and what to ignore** has succeeded.

He is one person with limited evenings, applying for internships. Rank
everything by leverage against that reality. If your honest conclusion is that
the project should be narrowed to a third of its current surface, say so
plainly and show the cut.
