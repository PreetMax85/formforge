# FormForge — Adversarial Revival Pass

**Run:** 2026-09-08 late UTC = 2026-09-09 early IST — hence the `2026-09-09`
filenames, which follow the brief's naming. · **Branch:**
`review/adversarial-pass-2026-09-09` · **Mode:** diagnosis only
**Personas:** the Screener (decides if you get the interview) and the Believer (thinks this could be a product)

Everything below was verified in this checkout unless explicitly marked
**UNVERIFIED**. Where I claim something runs, crashes, passes or fails, I ran it
and the output is quoted.

---

## 0. Read this part if you read nothing else

### Fix these two things. In this order.

**1. Make it boot, and make CI notice when it doesn't.** (~1 evening)

`main` does not start. Not "has a bug" — the API process dies at import, before
it listens. I reproduced it verbatim:

```
TRPCError: [mutation.auth.signup] - Output parser expects a Zod validator
    at apps/api/src/trpc/router.ts:19:32
```

And in the same environment, minutes apart:

```
pnpm turbo run typecheck  →  Tasks: 7 successful, 7 total
pnpm turbo run test       →  Tests: 24 passed (24)
pnpm turbo run build      →  ESM dist/index.js 75.03 KB  ⚡️ Build success
```

CI is green. The artefact it produces crashes the instant you run it. That is
why the deployment is a 404: Railway built the image successfully and then
crash-looped forever.

Why this is first: **nothing else you fix is visible until this is fixed.** A
screener who clones your repo and runs `pnpm dev` sees a stack trace. Every
other strength in this codebase — and there are real ones — is behind that door.

**2. Fix the first thirty seconds of the builder.** (~1 evening)

A reviewer opened this on a stream and could not work out what to do. I found
the mechanical reason, and it is not "the hint was missing." Three things, all
one-line fixes:

- **Palette rows have no click handler.** `FieldPalette.tsx:35-60` is a `<div>`
  with drag listeners and nothing else. Clicking "Short Text" — the first thing
  any human tries — does nothing at all. No feedback, no error, no hint.
- **The drag affordance is on the wrong list.** `HierarchyPanel.tsx:119` draws a
  `GripVertical` on items you *cannot* drag. `FieldPalette.tsx` draws no grip on
  the items you *must* drag. The app points at the wrong thing.
- **The instruction is invisible.** "Drag a component from the palette" is
  `#374151` on `#1e1e1e` — a contrast ratio of **1.57:1**. WCAG asks for 4.5:1.
  Meanwhile "Scene is empty." right above it is `#4b5563` — **2.21:1**. The
  useless line is rendered 40% more legibly than the actionable one, and this
  same inversion repeats in four places.

Why this is second: it is the only failure in this repo with a **real observer**.
Every other finding here is me reasoning about your code. That one is a fact
about a human being.

### What to ignore

- **Redeploying.** Already de-scoped, correctly. Local-good first.
- **Writing real `.output()` schemas for all 33 procedures.** This is the
  obvious fix and it is a trap — see §2.2. It would replace one loud crash with
  up to 29 silent data-loss bugs.
- **The recharts 3 migration, the Tailwind bump, the framer-motion rename.**
  All real, all stale, none of them are why anyone bounced. See the stack
  research doc for the one exception (Sentry).
- **`ARCHITECTURE.md`.** 2,978 lines. Nobody will read it, including you.
- **Adding any feature.** The surface is already ~2× what one person can keep
  correct in evenings. See §5.

### The one-sentence version

> FormForge is better engineered than it looks and worse presented than it is,
> and both halves of that come from the same habit: **optimising for how the
> work reads to a grader instead of how it behaves for a user.**

That is not a personality critique. It is a documented causal chain, and §4
traces it commit by commit.

---

## 1. The Screener's verdict

**Verdict today: pass. Verdict after two evenings of work: interview.**

I want to be precise about that, because "pass" sounds worse than I mean it.
The gap is not skill. The gap is that the repo currently fails the cheapest
test a screener runs, and screeners do not debug candidates' projects.

### 1.1 Does it run? What does that alone cost you?

No. And it costs you nearly everything, for a reason worth internalising:
**a screener's first action is not reading your code. It is running it.**

The realistic sequence at a YC-shaped company reviewing an intern applicant is:
open README (30s) → clone → `pnpm install && pnpm dev` (2 min) → if it works,
click around (5 min) → if *that* works, read code (15 min). You are eliminated
in minute three, before a single line of your genuinely good submission pipeline
is read.

The compounding damage is in the README:

- **`README.md:3` — "A production-grade form builder."** Three lines in. On a
  repo that dies at import. This is the single most expensive sentence in the
  project. A screener who reads that, then hits the stack trace, does not think
  "unlucky bug" — they think **"this person cannot tell working from broken,"**
  which is the one belief that ends an internship application on the spot.
- **`README.md:11-16`** advertises four live URLs. The API and its `/docs` link
  return Railway's `{"code":404,"message":"Application not found"}`.
- **`README.md:22-23`** publishes demo credentials for a service that is gone.

Fixing the code without fixing those three claims leaves half the damage in
place. They are the same evening's work.

### 1.2 Does the code show judgement, or volume?

This is the question I was asked to be harshest on, and the honest answer is
uncomfortable in a useful direction: **the judgement is real, and the packaging
is actively destroying credit for it.**

Take the exact example from the brief. `AGENTS.md:292-334` has a section titled
"Required Verbatim Comments" mandating that this string appear in the code:

```
// 4. IP/UA Fingerprint Fallback with Distributed Mutex Lock
```

Here is the code it sits above (`responses.service.ts:115-141`):

```ts
const submissionHash = createHash('sha256')
  .update(`${ip}:${form.id}:${ua}:${email}:${name}:${Math.floor(Date.now() / 30_000)}`)
  .digest('hex');
// ...
.onConflictDoNothing({ target: responses.submissionHash })
```

There is no mutex. Nothing is distributed. Nothing is locked. It is a hash
bucketed into a 30-second window, deduplicated by a unique index
(`packages/db/src/schema/responses.ts:15`). **That is a perfectly good
idempotency key** — a sound, conventional design — wearing a name roughly three
sizes too big.

Now the part that matters. Fifteen lines below that comment sits this
(`responses.service.ts:147-162`):

```ts
const [updated] = await tx.update(forms)
  .set({ responseCount: sql`${forms.responseCount} + 1` })
  .where(and(eq(forms.id, form.id),
             or(isNull(forms.maxResponses), lt(forms.responseCount, forms.maxResponses))))
  .returning({ responseCount: forms.responseCount });
if (!updated) { await tx.delete(responses).where(eq(responses.id, response.id)); ... }
```

That is a genuinely race-safe conditional increment — the cap is enforced inside
the UPDATE's WHERE clause, so two concurrent submissions cannot both slip past a
`maxResponses` limit, and the insert is rolled back in the same transaction if
the cap was hit. It is the best code in this repository. A senior engineer would
notice it and it would count for a lot.

**Almost nobody will get to it,** because a reader who has just been told a
sha256 hash is a "Distributed Mutex Lock" has already decided you overstate
things, and reads the rest looking for confirmation.

The same pattern, twice more:

- **`responses.service.ts:186` — "Dead Letter Queue (DLQ) pattern."** The code is
  `sendResponseReceived(...).catch(err => logger.error(...))`. There is no
  queue and no dead letter. The comment's own next line admits it: *"logged via
  pino for manual retry."* A fire-and-forget promise with a log line is called
  fire-and-forget, and that is a perfectly defensible choice to have made.
- **`AnalyticsComponents.tsx:363` — `<Panel title="AI Insights">`.** The
  generator is `generateFormInsightsSummary`, whose own docstring
  (`analytics.service.ts:159`) says, correctly, *"Rule-based pattern matching."*
  It is an if/else chain over five thresholds. **The code is honest and the UI
  label is not.** In 2026, labelling if/else "AI" on a portfolio project reads as
  either naïve or cynical, and a screener will not spend time working out which.

And the mandate contradicts itself. `AGENTS.md:311-313` says of one comment:

> This comment appears in `calculateQ1toQnDropoff` and `getTimeSeries`. Do NOT
> place it in `computeResponseCompletionFunnel` (which does not use CTEs).

The comment is at `analytics.service.ts:96`, inside `computeResponseCompletionFunnel`.
A screener with `grep` finds that in under a minute. Likewise `AGENTS.md:307`
requires "Each numbered step must map to actual code beneath it," while step 1
maps to a comment saying it happens somewhere else entirely
(`responses.service.ts:36`).

**The verdict on this question: it is not volume masquerading as judgement. It
is judgement masquerading as volume, which is a rarer and much more fixable
problem.** The fix is a find-and-replace and it is worth more than a month of
features:

| Now | Honest name |
|---|---|
| Multi-Strategy Identity Resolution Pipeline | Submission pipeline |
| IP/UA Fingerprint Fallback with Distributed Mutex Lock | 30-second idempotency key |
| Dead Letter Queue (DLQ) pattern | Fire-and-forget email dispatch |
| Cryptographic Session Token Verification | Turnstile CAPTCHA check |
| Finite State Machine Gate | Published-status check |
| AI Insights | Insights (or: What we noticed) |

Your own README already gets this right — `README.md:57` calls it a "30s
deduplication hash," the accurate name. **You knew.** The inflation lives in
`AGENTS.md`, a document written to instruct an AI, and it got applied to code
that did not need it.

### 1.3 The strongest genuine signals here

Three things would make me take the interview, and I'd want you to lead with
them:

1. **The race-safe conditional increment** (`responses.service.ts:147-162`),
   plus the TOCTOU reasoning behind it. Most intern portfolios have never
   considered two requests arriving at once.
2. **One Zod schema builder driving both client validation and server
   validation, generated from field config at runtime**
   (`packages/shared/src/utils/buildFieldZodSchema.ts`, 169 lines, 11 tests).
   With server-side conditional-visibility resolution
   (`conditionalLogic.ts:resolveVisibleFieldGraph`) so a respondent cannot forge
   a hidden field. That is a real distributed-systems instinct: never trust the
   client's view of which fields existed.
3. **The composite cursor pagination** (`responses.service.ts:~228`,
   `createdAt|id`) — evidence you know offset pagination breaks under concurrent
   inserts.

All three are invisible today because the app does not start.

### 1.4 How to present the stream failure

Do not hide it, do not apologise for it, and do not make it a joke. It is the
single rarest thing in your application.

Approximately 100% of intern portfolio projects have never been used by anyone
other than their author. You have a recorded instance of a real person failing
at your product's core task. That is a *user research finding*, and the fact
that it stings is exactly why most people never obtain one.

The framing that works is three beats, and it must end with a diff:

> "I watched someone open FormForge on a stream and close it without building a
> form. They never found the drag interaction. I went and looked: the palette
> rows had no click handler, the drag-handle icon was on the list you *can't*
> drag, and the one line of instructional text was at 1.6:1 contrast. I fixed
> those three, and here's the before/after."

That reads as an engineer who instruments reality. The version where you leave
it out reads as someone who has never shipped to a stranger. **The finding is
worth more to you than the feature it exposed.**

One condition: the beat only lands if the fix exists. Until §2's two evenings
are done, the story is an anecdote about a bug you still have.

### 1.5 The single change that most moves the verdict

Make `pnpm install && pnpm dev` work from a clean clone, and add the eight-line
CI job that proves it stays working. Everything else in this report is
downstream of that.

---

## 2. The boot failure: the correct fix, and the trap in the obvious one

### 2.1 What actually happens

`trpc-to-openapi` requires every procedure carrying `.meta({ openapi })` to
declare `.output()`. Verified counts in this checkout:

| Router | `.meta({openapi})` | `.output()` |
|---|---|---|
| `auth.ts` | 6 | 0 |
| `forms.ts` | 13 | 3 |
| `fields.ts` | 3 | 0 |
| `responses.ts` | 4 | 1 |
| `analytics.ts` | 7 | 1 |
| **Total** | **33** | **4** |

Two independent fatal call sites: `generateOpenApiDocument` at
`apps/api/src/trpc/router.ts:19` and `createOpenApiExpressMiddleware` at
`apps/api/src/app.ts:96`. Fixing one still leaves the other.

The proximate cause is commit `70d2336`, "docs(api): openapi meta annotations
for all procedures," which took annotations from 4/33 to 33/33 without touching
output schemas. Before it, the 4 annotated procedures were exactly the 4 with
output schemas, and the API ran.

But the deeper cause is a document. `AGENTS.md:621-635` says:

> Every tRPC procedure must have `.meta({ openapi: { method, path, tags,
> description } })`. ... All 33 procedures across 5 routers are annotated.

It states the rule that breaks the build and **never mentions `.output()` at
all**. Neither does `ARCHITECTURE.md` — I grepped all 2,978 lines of it for
`.output(` and got zero hits. So: **135KB of documentation across two files,
neither of which describes the one API constraint that determines whether the
product runs.** That is the clearest available measure of what those documents
are worth.

### 2.2 The trap

The obvious fix is "write real output schemas for all 33 procedures." I tested
what that actually does, because `.output()` in tRPC is not documentation — it
is a **runtime response filter**. Results from a probe harness against this
repo's installed `@trpc/server@11.8.1`:

```
strict    -> OK    data keys = [id, title]
loose     -> OK    data keys = [id, title, createdAt, viewCount, passwordHash]
mismatch  -> THROW Output validation failed
```

Read that first line carefully. The service returned five fields. The
hand-written schema listed two. **Three fields were silently deleted from the
response** — no error, no warning, no log. The client just receives an object
with `viewCount` missing and renders `undefined`.

You have **zero tests covering any tRPC router.** All four test files are unit
tests of services and schemas. So if you spend an evening hand-writing 29 output
schemas, the failure mode is not "it doesn't compile" — it is that
`forms.byId` quietly stops returning `responseCount`, the dashboard shows blanks,
and you spend a week finding it. You would have traded one loud crash for up to
29 silent ones.

### 2.3 The fix I actually recommend

**Tonight (~30 min), restore boot with zero behavioural change.** Verified: any
`.output()` satisfies the generator.

```
FAIL  no .output() at all       -> [mutation.p] - Output parser expects a Zod validator
PASS  .output(z.unknown())
PASS  .output(envelope(z.unknown()))
PASS  .output(envelope(real))
PASS  no meta, no output                 (procedure simply isn't exposed as REST)
```

**There is also a first-class opt-out you should know about**, which the library
documents and which I had not expected to find: `meta({ openapi: { …,
enabled: false } })` keeps the annotation and skips the output requirement
entirely. It is a typed field on `OpenApiMeta` and is checked at
`src/utils/procedure.ts:61` upstream. The caveat is that it removes the
procedure from the REST adapter as well as from the document — the tRPC endpoint
is unaffected.

That makes the triage cleaner than "29 schemas or bust." Split the 29:

| Procedure kind | Treatment |
|---|---|
| Genuinely public REST (`forms.bySlug`, `responses.submit`, `forms.explore`) | Real `.output()` schema — mostly already done |
| Everything behind auth that no external caller will ever hit — all 6 `auth.*`, all 7 `analytics.*`, all 3 `fields.*` | **`enabled: false`.** They are internal tRPC calls; publishing them as REST was never the intent |
| The remainder | `looseEnvelope` now, tighten later with a test |

Sixteen of the 29 are plausibly `enabled: false`, which means the real
hand-written-schema debt is closer to a dozen than to 29.

`successEnvelope` already exists — but it is defined **twice, verbatim**, at
`forms.ts:20` and `responses.ts:6`. Lift it into `packages/shared`, add a
permissive sibling, and apply it to the 29 procedures that lack one:

```ts
// packages/shared/src/schemas/envelope.ts
export const successEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), message: z.string(), data });

/** Boot-safe placeholder. Passes payloads through untouched.
 *  Tighten per-procedure, one at a time, each with a test. */
export const looseEnvelope = successEnvelope(z.unknown());
```

`z.unknown()` strips nothing and throws on nothing — verified above. The app
boots, `/docs` renders, and no response shape changes.

The existing comment at `forms.ts:19` says *"Explicit output envelope to avoid
z.any()"* — you were right to prefer explicit schemas, and you should still get
there. Just not in one commit across 29 endpoints with no tests. Tighten one
procedure per sitting, with a test that asserts the real payload survives.

**Then add the eight lines that make this impossible to reship.** This is the
higher-value half of the fix:

```yaml
      - name: Boot smoke test
        run: |
          node --import tsx apps/api/src/index.ts &
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/health && exit 0
            sleep 1
          done
          echo "API failed to become healthy" && exit 1
```

`/health` already exists (`app.ts:~105`). What this class of test would have
caught, beyond this bug: every import-time throw, every missing required env
var, every bad middleware order, every Drizzle schema/migration mismatch — the
entire family of "builds fine, dies on start" failures, which is exactly the
family that killed the deployment.

### 2.4 The option worth arguing: delete the OpenAPI layer entirely

**The case for deleting it.** Apply the deletion test: if you removed
`trpc-to-openapi`, where would the complexity go? Nowhere. It would vanish.
The web app talks to the API over tRPC (`apps/web/trpc/client.ts`), not REST.
Nothing in this repository consumes `/api/v1`. The REST surface exists solely to
populate the Scalar `/docs` page. That page has never had a user, and the layer
that generates it has now cost you a dead deployment, a dead demo, and every
screener who cloned the repo since June. Deleting 33 `.meta()` blocks and two
call sites removes the entire failure class permanently — no output schemas, no
smoke test needed for *this* bug, no drift between two API shapes.

**The case against.** A generated, interactive API doc is a genuinely good
signal — it says you think about consumers, not just screens. It is also the
only part of the project that gestures at "platform" rather than "app," which is
the gesture the Believer's §6 wedges depend on. And it is nearly working: four
procedures already do it properly. Deleting it is deleting a differentiator to
avoid an evening of work.

**Verdict: keep it, fix it cheaply, but demote it.** The against-case wins on
signal value, and `looseEnvelope` makes the cost genuinely small. But be clear
with yourself that it is a *portfolio artefact*, not a product feature — so it
gets `looseEnvelope` and a smoke test, and it does not get 29 hand-written
schemas until something actually consumes the REST API. If you find yourself
spending a second evening on it, take the deletion instead.

---

## 3. First-run cognitive walkthrough

The centrepiece. Reconstructed from the nine committed screenshots plus source.
I have ranked every stall point by one question: **would fixing this have saved
the reviewer on the stream?**

### 3.0 The path, end to end

`/` (blocked by a boot animation) → signup → `/dashboard` (empty) → **New Form**
→ `/dashboard/forms/[id]/builder` (five empty panels) → *drag* → inspector →
Save → Play → Publish.

Nine stalls. The stream died at stall 5.

---

### Stall 1 — A fake boot sequence stands between the visitor and the pitch

`BootScreen.tsx` renders a full-screen overlay at `zIndex: 200` (line 139),
`isVisible` initialised to `true` (line 66), and it does not go away on its own.
It waits for a keypress or click (lines 116-124), and the prompt to press
anything doesn't appear until `PROMPT_DELAY = 2540`ms (line 53).

So the first ~2.5 seconds of every new session are spent watching fabricated
progress lines — one of which is literally **"Seeding the database"**
(line 24) — before the value proposition is reachable.

**And it is the "1 Issue."** The Next.js dev overlay warning in
`landing-page-02.png` is a hydration mismatch, and I confirmed it in a real
Chromium session against `next dev`. React's own diff:

```
<LandingPage>
  <BootScreen>
    ...
      <span style={{color:"#9c..."}}>
+       Calibrating the drag system
-       Unpacking the field types
```

`pickBootLines()` (line 41) calls `shuffle()` (line 30), which calls
`Math.random()` (line 33), during render, inside a `useMemo`. The server picks
five lines, the client picks five different lines, hydration fails, and React
throws away and re-renders the tree.

There is a joke here that is not funny: the line the client picked, and the
server didn't, is **"Calibrating the drag system."**

*Case for keeping it:* it is atmospheric, it is on-brand, and a boot sequence is
a legitimately charming touch on a game-engine-themed product.
*Case against:* it delays the pitch by 2.5s, requires an interaction to clear,
advertises seed data, and is the sole cause of the only error on your landing
page.
**Verdict: delete it.** If you cannot bear to, make it dismiss automatically
after 1.2s and move the shuffle into `useEffect` so it only ever runs on the
client. But the honest read is that it is a 320-line component whose entire
function is to stand between visitors and your product.

**Would it have saved the stream?** No. Ranked first only because it is the
first thing that happens and it costs one deletion.

---

### Stall 2 — The hero shows a builder that does not exist

`landing-page-01.png` shows a mockup with a `HIERARCHY` panel containing three
populated fields. Compare it to `02-builder-new-empty.png`, the real first
builder.

The mockup **has no `COMPONENT PALETTE`.** The single UI element a new user must
use is absent from the picture selling the product. The mockup also shows a
`[INFO] 2s ago New response on "samurai-oath"` console line, implying live
traffic.

So the visitor forms a mental model — "fields appear in a hierarchy on the left"
— and then meets an empty five-panel IDE. The one instruction that would bridge
the gap does exist, at `FeaturesSection.tsx:20`:

> "Every field is a GameObject. Drag it onto the canvas, click it, configure it
> in the Inspector panel."

That is the correct instruction, and it is **on the marketing page, below the
fold, where nobody who has already signed up will ever return to read it.**

**Would it have saved the stream?** Partially — a reviewer who read that line
would have known. Most don't.

---

### Stall 3 — The dashboard empty state uses three labels for one button

From `01-dashboard-empty.png` and `dashboard/page.tsx:496`:

- Sub-header: *"Scene is empty. Press **[+ New Form]** to instantiate your first
  GameObject."*
- Top-right button: **"+ New Form"**
- Centre button: **"+ Instantiate Form"**

Two buttons fire the identical mutation with different labels, and the helper
text names one of them in brackets as though it were a keyboard shortcut. A
reader has to work out that "New Form," "Instantiate Form," and "GameObject" are
the same thing.

**Would it have saved the stream?** No — the reviewer got past this. But it is
the first sample of the vocabulary problem, at the cheapest possible place to
fix.

---

### Stall 4 — Five panels of chrome, zero content

`02-builder-new-empty.png`. On arrival the new user sees `PROJECT HIERARCHY`
(empty), `COMPONENT PALETTE` (ten rows), `SCENE EDITOR` (empty), `INSPECTOR`
(empty), `CONSOLE` (one line). Four of five regions contain nothing but a
message about their own emptiness.

Note also the `CONSOLE` header shows a pulsing green dot and the word **LIVE**
(`ConsolePanel.tsx:77-89`). Nothing is live; it is a local array of strings
(`builder/page.tsx:103-111`).

**Would it have saved the stream?** No, but it set the conditions: with four
empty panels competing for attention, the one panel that matters has no
prominence at all.

---

### Stall 5 — **This is where the stream died**

Three independent defects, each sufficient on its own, all in the first
interaction.

**5a. Clicking a palette row does nothing.**

`FieldPalette.tsx:34-60`:

```tsx
<div
  ref={setNodeRef}
  {...listeners}
  {...attributes}
  className="... cursor-grab active:cursor-grabbing ..."
  onMouseEnter={...}
  onMouseLeave={...}
>
```

There is no `onClick`. There is no `onKeyDown`. There is a hover highlight,
which teaches the user the row is interactive, and then the interaction they
attempt is unhandled. **The first natural action fails silently.** A user who
clicks "Short Text" three times and sees a hover state and nothing else
concludes the app is broken — which is the correct inference from the evidence
available to them.

*Case against fixing it:* click-to-append conflicts with drag-to-position, and a
palette that both drags and clicks has two mental models.
*Rebuttal:* it doesn't conflict here, because **drop position is already ignored.**
`builder/page.tsx:186` appends unconditionally: `setFields(prev => [...prev,
{...newField, order: prev.length}])`. You cannot drop a field between two
existing fields today. Drag and click would do *exactly* the same thing, which
makes click strictly additive.
**Verdict: add `onClick`. It is the highest-value line of code in this report.**

**5b. The grip icon is on the wrong list.**

| Component | Draggable? | Grip icon? |
|---|---|---|
| `FieldPalette.tsx` — the palette | **Yes** (`useDraggable`, :26) | **No** |
| `HierarchyPanel.tsx` — the left list | **No** (`<button onClick>`, :49) | **Yes** (:119) |
| `FieldCard.tsx` — canvas cards | Yes (`useSortable`, :46) | Yes (:100) |

Two of the three lists show a drag handle. The only one without a handle is the
only one that starts the workflow. The Hierarchy grip is purely decorative — its
items are `<button onClick={() => onSelect(field.id)}>` and cannot be dragged at
all.

So the app draws the "you can drag me" symbol on a thing you can't drag, and
omits it from the thing you must. **This is a stronger explanation for the
stream failure than "the hint was too faint," because it is not a missing
signal — it is an actively misleading one.**

And where a grip does exist and is functional, it is invisible too.
`FieldCard.tsx:98` sets the `GripVertical` to `#3c3c3c`:

| Grip `#3c3c3c` on | Ratio | WCAG 2.2 SC 1.4.11 (3:1 for UI components) |
|---|---|---|
| card `#252526` | **1.39:1** | fail |
| hover `#2d2d30` | **1.24:1** | fail |
| selected `#094771` | **1.13:1** | fail |

`cursor-grab` only reveals the affordance once the pointer is already sitting on
a 14px target the user cannot see. So *every* drag affordance in this builder is
either absent, misplaced, or below the contrast floor — there is no path by
which a first-time user discovers dragging from the interface alone.

**5c. The instruction is below the visibility floor.**

Measured contrast ratios (WCAG 2.1 relative luminance, computed from the literal
hex values in source):

| Text | Colour | On | Ratio | Passes AA (4.5:1)? |
|---|---|---|---|---|
| "Scene is empty." (`BuilderCanvas.tsx:63`) | `#4b5563` | `#1e1e1e` | **2.21:1** | No |
| **"Drag a component from the palette."** (`:73`) | `#374151` | `#1e1e1e` | **1.57:1** | No |
| "No assets in scene." (`HierarchyPanel.tsx:25`) | `#4b5563` | `#252526` | 2.03:1 | No |
| **"Drag a field to instantiate."** (`:28`) | `#374151` | `#252526` | **1.44:1** | No |
| "Nothing selected." (`InspectorPanel.tsx:~50`) | `#4b5563` | `#252526` | 2.03:1 | No |
| **"Click a field to inspect."** (`:~60`) | `#374151` | `#252526` | **1.44:1** | No |
| Chart empty states (`AnalyticsComponents.tsx:53`) | `#374151` | `#141414` | 1.74:1 | No |

The pattern is exact and it is systematic: **every status line is `#4b5563`;
every actionable instruction is `#374151`.** The app renders the sentence that
tells you what to do *less* legibly than the sentence that tells you there is
nothing there. Four times, in four different components, with the value
hard-coded each time because there is no token for it.

At 1.44:1 on a laptop screen, in a bright room, on a stream compressed to
1080p — that text is not "faint." It is **not present.**

**Would fixing 5a/5b/5c have saved the stream? Yes. Any one of the three,
probably. All three, near-certainly.** This is the whole report's answer.

---

### Stall 6 — Four nouns for one concept, on one screen

On `02-builder-new-empty.png` alone, the same object is called:

| Word | Where | Source |
|---|---|---|
| **component** | "Drag a **component** from the palette" | `BuilderCanvas.tsx:77` |
| **field** | "Drag a **field** to instantiate" | `HierarchyPanel.tsx:29` |
| **asset** | "No **assets** in scene" | `HierarchyPanel.tsx:26` |
| **asset** | `[INFO] Asset "Short Answer" added to scene` | `builder/page.tsx:189` |
| **GameObject** | "instantiate your first **GameObject**" | `dashboard/page.tsx:496` |

This is not a metaphor. A metaphor is consistent. This is four vocabularies
overlapping, and the user's job is to infer that "component," "field," "asset,"
and "GameObject" all denote the same thing — while also being told to "drag" it
by text they cannot read, from a list with no drag handle.

Meanwhile `form-settings.png` is plain English with a helper sentence under
every single label ("Show respondents how far through the form they are"), and
the form-level nav reads `Dashboard · Overview · Builder · Responses · Settings`.
**The same application speaks two languages, and the jargon one guards the front
door while the plain one guards the settings page nobody gets stuck on.**

---

### Stall 7 — The save model can lose work, and there is no guard

From `03-builder-left-palette.png` and source:

- The `UNSAVED` badge is top-right of the **Inspector** (`FieldInspector.tsx:211`).
- The `SAVE CHANGES` button is `position: fixed; bottom: …; right: 296px`
  (`builder/page.tsx:472-481`) — 296px is the 280px inspector width plus 16px,
  so it is pinned to the bottom of the **centre** column.
- They are in diagonally opposite corners of two different panels, roughly 500px
  apart, and the button **does not exist until `isDirty` is true** (`:471`) —
  so it appears only after you have already made a change you could lose.

The brief anticipated that `isDirty` tracking was never done. It was — it is
local `useState` at `builder/page.tsx:101`, not Zustand. But:

```
$ grep -rn "beforeunload" apps packages
NONE FOUND
```

**There is no unload guard anywhere in the codebase.** So the real first-run
data-loss path is: drag a field → edit its label, placeholder, description,
required flag, and visibility rules in the Inspector → the only "you have
unsaved work" signal is a 9px badge in a different panel → close the tab or hit
back → **everything is gone, with no prompt.**

The mitigating factor is genuine: `handlePlay` (`:322`) refuses to preview while
dirty and offers a Save action, so the specific path builder→preview is
protected. But tab-close, browser-back, and clicking `Dashboard` in the nav are
not.

`window.addEventListener('beforeunload', …)` gated on `isDirty` is about six
lines and closes the whole class.

---

### Stall 8 — Zero keyboard path, with an ARIA promise the app doesn't keep

```
$ grep -rn "KeyboardSensor\|sortableKeyboardCoordinates" apps
NONE FOUND
```

`builder/page.tsx:156-158` registers only `PointerSensor`. `@dnd-kit`'s
`useDraggable` still spreads `attributes` onto the palette rows
(`FieldPalette.tsx:38`), which sets `role="button"`, `tabIndex={0}` and
`aria-roledescription="draggable"`, and wires `aria-describedby` to dnd-kit's
default screen-reader instructions — which say to press space to pick the item
up.

So a keyboard or screen-reader user is told, by the app, that the element is
draggable and that space will pick it up. Pressing space does nothing, because
no `KeyboardSensor` is registered. **That is worse than being inaccessible; it
is inaccessible while announcing that it isn't.**

Net effect: **there is no way to add a field to a form without a mouse.** The
core action of the product is mouse-only.

This is one import and one line (`useSensor(KeyboardSensor, { coordinateGetter:
sortableKeyboardCoordinates })`) — but note that the click handler from 5a
solves the practical half of it immediately, which is another reason 5a ranks
first.

---

### Stall 9 — The first analytics view is six empty panels and two wrong charts

Covered in §4 with source traces. Worth noting here only that the form in
`analytics-01.png` is marked `DRAFT` — it has never been published, so it
*cannot* have responses — and the app still renders seven analytics panels, four
zero-valued stat tiles, and two charts displaying incorrect numbers.

---

### 3.10 The strategic question: does the game-engine metaphor survive?

I was asked to argue this properly in both directions. Here is the honest
version.

**The case for keeping it.** It is the only reason anyone remembers this
project. A screener sees a dozen form builders a season; they see one
game-engine form builder. The execution is real design work — the VS Code
palette (`#1e1e1e`/`#252526`/`#569cd6`), the 24px panel headers, the monospace
grid, `PLAY` for preview and `PUBLISH` for ship, a console that logs your
mutations. Strip it and you have a competent, forgettable Tally clone, which for
the stated goal is strictly worse than a memorable flawed thing. The landing
page's wedge — "you already use a game engine to build worlds, why are you
building forms in a spreadsheet clone?" — is a real positioning instinct, and
positioning instinct is rare in intern portfolios.

**The case for killing it.** It failed, on camera, in front of a real person,
at the first interaction. Everything downstream of that failure — the empty
analytics, the save model, the accessibility — never got evaluated, because
nobody got there. A distinctive thing nobody can operate is not an asset; it is
a costume.

**The resolution, and I hold this with high confidence: the aesthetic and the
vocabulary are separable, and only the vocabulary failed.**

The evidence is in your own repo. `form-settings.png` is *equally* dark,
monospace, panelled and on-brand — and it is plain English with a helper line
under every label. Nobody has ever reported getting stuck on the settings page.
The reviewer did not say "this is ugly" or "this is too dark." They said they
could not work out what to do. That is a *semantic* failure, not a *visual* one.

And the vocabulary isn't even doing the metaphor's work, because it isn't
consistent — four nouns for one object (Stall 6). Nobody looks at a dark
five-panel IDE with a hierarchy, an inspector and a live console and fails to
think "game engine." The word **GameObject** contributes nothing to that
recognition and subtracts comprehension from every new user.

**So: keep the chrome, kill the nouns.** Concretely:

| Keep — costs nothing, carries the brand | Rename — costs nothing, unblocks users |
|---|---|
| `#1e1e1e` panels, JetBrains Mono, the 24px headers | `COMPONENT PALETTE` → **`FIELDS`** |
| The five-panel layout itself | `PROJECT HIERARCHY` → **`FORM OUTLINE`** |
| `PLAY` / `PUBLISH` verbs | `SCENE EDITOR` → **`CANVAS`** (or keep — it's harmless) |
| The `CONSOLE` panel (drop the fake `LIVE` dot) | `INSPECTOR` → **keep** (correct in both languages) |
| The `[OK]`/`[INFO]` log format | "instantiate your first GameObject" → **"Create your first form"** |
| The whole colour system | `Asset "X" added to scene` → **`Added "X"`** |

The line to hold: **the metaphor may name the room, never the object.** Panels
can be Scene and Inspector. The thing the user drags is a **field**, everywhere,
without exception.

Kept that way, the metaphor is an asset again — and you can say in an interview
that you kept a distinctive interface *and* fixed its comprehension failure,
which is a much better story than either "I built a cool UI" or "I gave up and
made it look like everything else."

---

## 4. Analytics: three defects, three different causes

The brief asked me to classify each. They are genuinely three different kinds of
bug, which is itself the interesting finding — this isn't one careless moment.

### 4.1 The 100% bar on a form with zero responses — **guard bug, in SQL**

`analytics.service.ts:77-80`:

```sql
CASE
  WHEN prev_count IS NULL THEN 100.0
  ELSE ROUND((response_count::numeric / NULLIF(prev_count, 0)) * 100, 2)
END AS retention_pct
```

`prev_count` is `LAG(response_count) OVER (ORDER BY field_order)`, so it is
**always NULL for the first field**. The first field therefore reports 100%
retention unconditionally — including when `response_count` is 0. The chart is
faithfully rendering what the API told it: *100% of the people who reached
question 1 continued past it*, computed over zero people.

Fix — the base case needs to ask whether anyone arrived:

```sql
WHEN prev_count IS NULL THEN CASE WHEN response_count > 0 THEN 100.0 ELSE NULL END
```

**There is a second, worse bug hiding in the same expression.**
`NULLIF(prev_count, 0)` makes `retention_pct` **NULL** for every field after one
with zero answers. That NULL then flows into `getFormStats:364-368`:

```ts
fieldDropoffs.slice(1).reduce((sum, f) => sum + (1 - f.retention_pct / 100), 0)
```

In JavaScript `null / 100 === 0`, so each NULL contributes `1 - 0 = 1` — a
**100% drop-off** — to `avgDropoffRate`. That feeds `computeFormHealthScore:33`
(`dropoffScore = max(100 - 100, 0) = 0`), which carries a 20% weight. The
all-zero case is caught by the null guard at `:17`, but a form with a handful of
responses and one unanswered optional field will silently lose up to 20 points
of health score for no reason. **That one is invisible today and will be
confusing later.**

### 4.2 The `105%` axis tick — **chart-domain bug**

`AnalyticsComponents.tsx:125`: `domain={[0, 105]}`.

Hard-coded, and I can see why: the `<Bar>` at `:145-149` has
`label={{ position: 'right' }}`, so the domain was padded to stop the label
clipping. But recharts derives ticks from the domain, so a percentage axis
ends at 105%.

The margin already reserves the space (`margin={{ right: 48 }}`, `:121`). Fix:

```tsx
domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
```

### 4.3 The same sentence twice on one screen — **layering bug, not a copy bug**

This one is misdiagnosed by looking at the screenshot alone. `AI INSIGHTS` is
**not** showing an empty state — note in `analytics-01.png` that it renders in a
bordered alert box with an ⓘ icon, whereas `FORM HEALTH SCORE` renders as
centred monospace. Two different components, two different treatments, one
identical sentence.

The cause is `analytics.service.ts:165-171`:

```ts
if (score === null) {
  return [{ type: 'neutral', icon: 'bar-chart-2',
            message: 'Not enough data to calculate form health. Share your form to start collecting responses.' }];
}
```

The **insight generator is speaking on behalf of the health-score panel.** It
returns a populated, valid insight whose text belongs to a different component.
`InsightCards` does exactly what it's told.

Two consequences worth noting:

1. `InsightCards`' own empty message — *"Collect more responses to unlock
   insights."* (`AnalyticsComponents.tsx:365`) — is **dead code.**
   `generateFormInsightsSummary` cannot return an empty array: the `score ===
   null` branch returns one item, and the `>= 80 / < 50 / else` chain at
   `:209-227` is exhaustive. That string can never render.
2. The icon contract is broken and unenforced. The service emits
   `icon: 'bar-chart-2'` (`:167`, `:224`); `INSIGHT_ICONS`
   (`AnalyticsComponents.tsx:343-350`) has no such key, so it silently falls
   back to `Info` via `?? Info` at `:370`. The screenshot confirms the ⓘ. A
   stringly-typed seam between service and component with no type to catch it.

Fix: return `[]` when `score === null` and let `InsightCards` show its own empty
state. Then type `FormInsight['icon']` as a union of the six real keys so the
compiler catches the next one.

### 4.4 The 0–4 axis on `FIELD RESPONSE COUNTS` — **the same guard bug again**

`AnalyticsComponents.tsx:424` guards `data.length === 0`. But `data` is
`DropoffRow[]` — **one row per field, not per response.** A form with one field
and zero responses has `data.length === 1`, so the guard passes and recharts
renders a chart whose only datum is `0`, picking its default 0–4 domain.

`DropoffFunnel` has the identical mistake at `:114`.

**Both guards ask "do we have fields?" when the question is "do we have
responses?"** That is one shared root cause, and it explains two of the four
visible defects. The fix is one predicate, used in both:

```tsx
const hasResponses = data.some(r => Number(r.response_count) > 0);
if (!hasResponses) return <ChartEmpty message="No responses yet." />;
```

### 4.5 The whole-page problem

Counting `analytics-01.png` and `analytics-02.png` together, a new user's first
analytics view is: four stat tiles reading `0`, `0`, `0%`, `0 / 1`, and seven
panels of which six are empty and two of those six are *wrong*. On a form
badged `DRAFT`, which by definition cannot have responses.

The page should not exist in this state. `status === 'draft'` is known at render
time — one branch replaces the entire screen with "Publish this form to start
collecting responses," plus the share link. That is one condition and it deletes
six empty panels, two incorrect charts, and the duplicated sentence at a stroke.

---

## 5. Architecture: what to delete

Vocabulary per the brief: *module, interface, depth, seam, adapter, leverage,
locality.* A module is **deep** when a simple interface hides substantial
implementation, **shallow** when the interface costs about as much as the body.
The **deletion test**: if this module went away, would complexity concentrate
somewhere sensible, or merely scatter?

### 5.1 The deep modules — these are your good ones, leave them alone

- **`buildFieldZodSchema`** (`packages/shared/src/utils/`, 169 lines). Interface:
  a field config in, a Zod schema out. Body: per-type validation, constraint
  mapping, error messages. Consumed by both apps. This is the deepest module in
  the repo and the reason client and server cannot disagree about validity.
  11 tests. **Genuine leverage.**
- **`resolveVisibleFieldGraph`** (`conditionalLogic.ts`, 87 lines). Interface:
  fields + answers → visible fields. Hides the dependency-graph resolution, and
  crucially runs **server-side** at `responses.service.ts:74`, so a respondent
  cannot submit to a hidden field. Small interface, real invariant.
- **`FormRenderer`** (`components/form/`, 522 lines). One component serving both
  preview and live modes via a `mode` prop (`builder/page.tsx:382-397`,
  `f/[slug]/page.tsx`). **Two adapters, so this is a real seam, not a
  hypothetical one** — and it is why preview cannot drift from production.

### 5.2 The shallow ones

- **`GameEngineShell`** (130 lines) takes five `ReactNode` props and arranges
  them. The interface is five slots; the body is five slots' worth of flexbox.
  Shallow — but correctly so. A layout component *should* be shallow. Keep.
- **`successEnvelope`** — defined **twice, byte-identical** (`forms.ts:20`,
  `responses.ts:6`). Locality failure. One line to fix, and §2.3 needs it moved
  anyway.
- **`InspectorPanel`** (78 lines) exists to choose between `FieldInspector` and
  an empty state. Its whole body is a ternary. Fold the empty state into
  `FieldInspector` and delete the file — complexity concentrates, doesn't
  scatter.

### 5.3 Deletion candidates, ranked by (lines removed ÷ value lost)

| Delete | Lines | The case against deleting | Verdict |
|---|---|---|---|
| **`/pricing`** | 314 | Shows product thinking; "what would I charge?" is a real question | **Delete.** Three plans at $0/$12/$49 with "Start free trial." There is no billing code anywhere (`grep -i 'stripe\|razorpay\|billing'` → nothing), and `/signup` **ignores `?plan=`** entirely — I checked. A screener who clicks Pro, signs up, and gets a free account has caught you selling something that doesn't exist. Costs more credibility than it earns. |
| **`BootScreen`** | 321 | Atmospheric, on-brand | **Delete.** §3 Stall 1. It delays your pitch, needs a click to clear, and is the sole cause of your only landing-page error. |
| **5 of 8 themes** | ~180 | Demonstrates the theme engine | **Cut to 3.** Keep `default`, `minimal`, and one showpiece. "Ghost of Tsushima," "Jujutsu Kaisen," and "Karan Aujla" are your personal fandoms shipped as product features, and they are the *only* content on `/explore`. Keeping the engine while cutting the catalogue proves the same capability without the reviewer wondering whether you know the difference between a portfolio and a mood board. |
| **`AI INSIGHTS` panel** | ~40 | It's the only "intelligent" surface | **Rename, don't delete.** §1.2. The rules are fine; the label is the problem. |
| **`ARCHITECTURE.md`** | 2,978 | Thoroughness | **Delete or cut to 200 lines.** 106KB. Contains zero occurrences of `.output(` — it could not have prevented, and does not describe, the defect that killed the product. Documentation that large is write-only. |
| **`/explore`** | 461 | A public directory is a real product surface | **Keep, but empty-guard it.** It is a directory of three fandom forms. Low cost to keep; do not invest further. |
| **`packages/ui`** | ~10 | Monorepo hygiene | **Delete.** It exports almost nothing; `apps/web/components/ui` is the real component library. An empty package is a signpost to nowhere. |

**Net: roughly 4,300 lines removable with no capability lost.** For a solo
developer with evenings, the surface you delete is worth more than the surface
you add, because every remaining line is one you have to keep correct.

### 5.4 `CONTEXT.md` and `docs/adr/` — are they worth creating?

Neither exists. I was asked to say whether they should.

**`docs/adr/`: no.** ADRs pay off when a future reader needs to know why a
past team chose something. You are the team, the project is four months old, and
you have nine evenings of appetite. It would be ceremony.

**`CONTEXT.md`: yes — but not as documentation. As the fix for §3 Stall 6.**

The single most consequential defect class in this repo is that one object has
four names. That is exactly what a domain glossary prevents, and it is the
narrowest possible version of the document:

```md
# Vocabulary

**field** — one question on a form. Always "field" in user-facing copy.
  Never "component", "asset", "GameObject", or "element".
**form** — a collection of fields. Never "scene" or "project" in user copy.
**response** — one person's completed submission.
**answer** — one field's value within a response.

The game-engine metaphor may name *panels* (Scene, Inspector, Hierarchy,
Console). It may never name the *objects* inside them.
```

Twelve lines. It is worth more than `ARCHITECTURE.md`'s 2,978, because it is the
only document here that would have prevented an observed failure.

---

## 6. The Believer: is there a product?

### 6.1 First, the honest baseline

**A generic form builder is dead on arrival, and you should believe this.**
Tally is free with unlimited forms and responses. Google Forms is free and
already installed at every organisation on earth. Typeform owns "beautiful
forms." Fillout owns integrations. Formbricks owns open-source. There is no
feature you can add in evenings that changes any of that.

So the only question worth asking is whether FormForge does something
*structurally* hard for those five, not something *better* than them.

### 6.2 Wedge zero: "the game engine for forms" — **rejected**

This deserves a real hearing because it is your current positioning
(`landing-page-01.png`) and because the brief flagged it as either a sharp wedge
or a fatal narrowing.

**For:** Game developers genuinely need forms — playtest signups, alpha-key
requests, bug reports, post-playtest surveys, Discord onboarding. They have
taste, they are underserved by enterprise-grey SaaS, and they are reachable
(itch.io, r/gamedev, Discord, game jams). "Forms that look like your editor" is
a message that would actually get retweeted by that audience.

**Against, and this is decisive:** the game-engine framing is a **skin, not a
capability.** Nothing about FormForge is better at a playtest signup than Google
Forms. It just looks like Unity. Wedges are things competitors structurally
cannot copy; an aesthetic is the single most copyable thing in software — Tally
could ship a dark monospace theme in a sprint if it ever mattered.

Two further problems. The audience is small (indie game devs who run
playtests *and* care enough about form aesthetics to migrate). And the
positioning is precisely what broke your demo: `landing-page-01.png` presumes
the visitor already uses a game engine, and the builder presumes they know what
a GameObject is — which is exactly what the stream reviewer did not know. **You
have already run the experiment on whether this framing narrows your audience,
and the result was that it narrowed it to zero.**

**Verdict: keep the aesthetic (§3.10), drop the market positioning.** "The game
engine for forms" is a great tagline for a portfolio project and a bad thesis
for a company.
**Kill criterion, if you disagree:** ask ten indie devs running playtests what
they use and what they hate about it. If not one names a pain that Google Forms
plus a Discord bot doesn't solve, it is dead. I expect zero.

### 6.3 Wedge one — self-hosted, data-resident forms

**The pitch:** every SaaS form builder puts respondent PII on someone else's
infrastructure, usually American. FormForge is MIT-licensed, Dockerfile-ready,
and Postgres-backed. The form data never leaves your database.

**First user you can name:** a seed-stage Indian fintech or healthtech doing
customer onboarding or KYC pre-screening, for whom India's DPDP Act makes
"respondent PII sits in a US SaaS's database" an actual blocker, not a
preference. Concretely: the compliance-conscious 10-50 person startups in
Bangalore and Gurgaon that already self-host Metabase and Plausible for the same
reason.

**Why you can win it:** you are in that market and can talk to those teams. The
codebase is already a clean self-hostable unit (`Dockerfile`, Neon/Postgres,
env-driven config, no proprietary services in the critical path). And the
server-side conditional-logic validation (§5.1) is genuinely the right shape for
regulated intake, where "the client hid that field" is not an acceptable
explanation.

**Kill criterion:** talk to five such teams. If three or more say they already
use self-hosted Formbricks or Typebot and are content, **stop** — Formbricks is
well funded, open-source, and further along, and you will not out-build them in
evenings. This is the risk I rate highest.

### 6.4 Wedge two — forms where the branching logic is enforced server-side

**The pitch:** most form builders evaluate conditional logic in the browser.
That is fine when branching is a UX nicety and unacceptable when it is an
eligibility decision. FormForge resolves the visibility graph and validates
answers **on the server** (`responses.service.ts:74-96`), so a respondent cannot
submit an answer to a question they were never eligible to see.

**First user you can name:** whoever runs eligibility pre-screening where a
wrong branch is a compliance event rather than an annoyance — a clinical-trial
site coordinator doing patient pre-screening, a scholarship or grant
administrator, a lender's pre-qualification flow. These people currently use
Google Forms plus a spreadsheet and manually re-check eligibility, or they pay
for something enterprise.

**Why you can win it:** you already built the hard part, and it is the part
nobody builds first. The `buildFieldZodSchema` + `resolveVisibleFieldGraph`
pairing means the eligibility rule is expressed once and enforced in both
places. That is a real invariant, and it is the kind of thing that is genuinely
awkward to bolt onto a client-side-first architecture.

**Kill criterion:** if the first three prospects say they cannot adopt anything
that doesn't integrate with their existing system of record (Salesforce, an EHR,
a loan-origination system), **stop.** Integrations are the actual product in
that market and they are multi-year work. This is the likelier killer of the
two.

### 6.5 What I would actually do, given your constraints

I gave you two wedges with kill criteria because the brief asked. Now the part
the brief also asked for, which is what I'd honestly do:

**Pursue neither, for the next three months.**

Your stated goal is internships, starting now, with limited evenings. Both
wedges above require customer development — five to ten conversations before you
write any code — and neither pays off inside your window. A half-pursued wedge
produces a project that is neither a clean portfolio piece nor a real business.

The highest-return move available to you is not a market wedge. It is this:
**finish FormForge as the artefact that proves you can ship, observe, and
correct.** Concretely — make it boot, fix the first-run path, publish the
before/after, and write up the stream failure honestly. That is a *better*
internship application than any of the three wedges above, because it
demonstrates the one thing every YC-shaped company screens for and almost no
intern portfolio can evidence: **contact with a real user, and a diff in
response.**

The wedges are worth keeping in a file. They are not worth your September.

---

## 6.6 Two security items that fell out of the stack research

Neither is exploitable in the code as written today. Both should be fixed
because they are one careless commit away from being exploitable, and because
each is a version bump rather than a code change. Full citations are in
`2026-09-09-stack-research.md`.

**`drizzle-orm@0.39.3` — CVE-2026-39356 / GHSA-gpj5-g38j-94v9, HIGH (CVSS 7.5).**
SQL injection via improperly escaped SQL identifiers. Patched in **0.45.2**.

The at-risk APIs are `sql.identifier()`, `.as()`, `sql.raw()`, and dynamic
sorting or alias construction built from user input. I grepped for all of them:

```
$ grep -rn "sql\.identifier\|sql\.raw\|\.as(" apps packages
NO MATCHES
```

So **you are not exercising the vulnerable path.** It is a latent footgun that
arms itself the moment anyone adds sortable columns to the responses table —
which is a natural next feature. Bump to `0.45.2`; read the `0.41.0` changelog
note about Postgres array types first, since it changes returned value shapes
for `numeric[]`/`timestamp[]` columns.

**`trpc-to-openapi@3.1.0` ships a vulnerable pinned `h3`.** Your lockfile
resolves `h3@1.15.1`, which carries path-traversal, SSE-injection and
request-smuggling advisories. `trpc-to-openapi@3.3.0` relaxes the pin to
`^1.15.5` and resolves a patched h3. It is a **non-major bump with no behavioural
change** — the OpenAPI generator's compiled output is byte-identical between
3.1.0 and 3.3.0, so the output-schema requirement in §2 is unchanged either way.

Do both in the same commit as the §2 boot fix; they are `pnpm up` and a lockfile
diff.

---

## 7. The theme running through all of it

The brief asked me to carry one meta-lesson through the report, and the evidence
supports it more strongly than I expected.

Commit `70d2336` — the commit that killed the product — has a message saying it
was made to satisfy an AI judge that flagged "sparse annotations." It took
OpenAPI annotations from 4/33 to 33/33 and shipped. The rubric was satisfied.
The application stopped starting. Nobody noticed for roughly three months,
because CI checks typecheck, build and test, and **not one of those three runs
the program.**

The same mechanism produced "Distributed Mutex Lock" over a sha256 hash, "Dead
Letter Queue" over a `.catch(log)`, "AI Insights" over an if/else chain, and
`AGENTS.md`'s "Required Verbatim Comments" section — a document instructing that
specific impressive-sounding strings be present in specific files. That section
even contradicts the code it governs (§1.2), which tells you the mandate was
never checked against reality either.

And the same mechanism produced `landing-page-02.png`: *"These are real forms
with real seeded data."* Both halves of that sentence are trying to score, and
together they say **"no real users"** to the only reader who matters.

The pattern is one habit, and it is worth naming precisely because it is *not*
laziness — every one of these took effort:

> **Optimising the description of the work instead of the behaviour of the
> work.**

The correction is a single principle, and it is also the last CI job I
recommended in §2.3:

> **Nothing counts as done until something automated has actually run it.**

Not typechecked it. Not built it. **Run it.** That one job is eight lines, and
it is the difference between the version of you that ships and the version that
scores well on a rubric while the product is dead.

---

## 8. Notes on method and limits

- **What I ran:** `pnpm install --frozen-lockfile`, `pnpm turbo run typecheck`
  (7/7 pass), `pnpm turbo run test` (24/24 pass), `node --import tsx
  apps/api/src/index.ts` (crashes as quoted in §0), `pnpm --filter @repo/web dev`
  (serves HTTP 200), and headless Chromium against the running landing page to
  capture the hydration error verbatim in §3.
- **Probe harnesses** for §2.2/§2.3 were run against this repo's installed
  `@trpc/server@11.8.1` and `trpc-to-openapi@3.1.0` in a scratch directory
  outside `apps/` and `packages/`, and deleted afterwards. Nothing under `apps/`
  or `packages/` was modified.
- **Contrast ratios** in §3 Stall 5c were computed from the literal hex values
  in source using the WCAG 2.1 relative-luminance formula, not estimated from
  the screenshots.
- **Tools that did not exist here,** as the brief requires me to state plainly:
  the `gh` CLI, the `Artifact` tool, and the `mattpocock-skills:*` and
  `superpowers:*` skill plugins. I used the distilled methods from §5a of the
  brief instead — parallel primary-source sub-agents for the stack research, the
  module/depth/seam/deletion-test vocabulary for §5, and the questionnaire
  structure for the companion document.
- **What I could not verify:** anything about the deployed environment (the API
  is a 404 and the Neon project behind it is out of quota), and the runtime
  behaviour of the builder end-to-end, because the API does not boot and I was
  not permitted to modify `apps/` to make it. §3's builder findings are from
  source plus the committed screenshots, both of which I have cited by line and
  by file. Anything I could not stand behind is marked UNVERIFIED where it
  appears.

---

## 9. Where to start tomorrow

The ordered list is in `2026-09-09-tickets.md`. The first two tickets are the
two fixes in §0. The decisions only you can make are in
`2026-09-09-questionnaire.md` — answer that over coffee before starting ticket 3.
