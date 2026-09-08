# FormForge — Questions Only You Can Answer

## Purpose

The adversarial pass produced a ranked plan (`2026-09-09-tickets.md`). Tickets 1
and 2 are unconditional — they get done regardless of how you answer anything
here. **Everything from ticket 3 onward depends on decisions I am not entitled to
make for you**: how much of the game-engine identity survives, what gets cut,
whether this is a portfolio artefact or a product attempt, and how much time you
actually have.

Answer this and the rest of the plan resolves. Leave it unanswered and I have
guessed at your intent, which is the main way a review like this goes wrong.

## Context

You have limited evenings and you are applying to startups and YC companies now.
That constraint shaped every recommendation in the report, and it is also the
thing I am least sure I have calibrated correctly. Several questions below exist
only to check that.

A note on tone, because one section is uncomfortable: the stream failure is
treated throughout as evidence, not as a mistake. It is the most valuable
artefact in the repository. The questions about it are about *presentation*, not
about blame.

## How to answer

- Type under the `>` line. Anything you skip, I will treat as "no strong view"
  and default to the report's recommendation.
- **Partial answers are useful.** "Somewhere between A and B, leaning A" tells me
  more than a confident wrong answer.
- **"I don't know" is a real answer** and often the most useful one — it tells me
  where the plan needs to stay reversible rather than commit.
- Rough numbers beat precise guesses. "Maybe 6 hours a week?" is fine.

---

## 1. The identity question

This is the one that changes the most downstream work. The report's verdict is:
**keep the visual chrome, rename the objects** — panels may be Scene and
Inspector, but the thing the user drags is a *field*, everywhere, without
exception. Everything below tests whether you agree.

### 1.1 Does the game-engine aesthetic stay?

The dark panels, monospace type, the console, PLAY/PUBLISH. Not the vocabulary —
just the look.

>

### 1.2 Are you willing to rename `COMPONENT PALETTE` to `FIELDS`?

*Why this matters: this single rename is, in my estimation, the highest-value
copy change in the project — it sits directly on the path where the stream
reviewer stalled.*

>

### 1.3 Does the word "GameObject" ever appear in the UI again?

>

### 1.4 Was the game-engine framing a design idea, or a market thesis?

*Why this matters: if it was a market thesis, §6.2 of the report is arguing
against something you actually believe, and I'd want to hear the counter-case
before you act on the rest.*

>

### 1.5 If you had to keep exactly one of these, which — the aesthetic, or "the game engine for forms" as positioning?

>

---

## 2. What this project is for

### 2.1 Is FormForge a portfolio artefact, or a product you might really pursue?

>

### 2.2 If a strong internship offer landed next month, would you keep working on FormForge?

*Why this matters: it distinguishes "make it defensible and stop" from "make it a
foundation," and those are genuinely different plans.*

>

### 2.3 Roughly how many hours a week do you actually have for this?

>

### 2.4 How many weeks before your applications go out?

>

### 2.5 Is there a specific company or application deadline driving this?

>

---

## 3. The cut list

The report proposes removing roughly 4,300 lines with no capability lost. Each of
these is independent — say yes, no, or "not yet" to each.

### 3.1 Delete the `/pricing` page?

Three plans at $0/$12/$49 with "Start free trial," no billing code anywhere, and
`/signup` ignores `?plan=`.

>

### 3.2 Delete `BootScreen`?

321 lines, delays the landing page ~2.5s, needs a click to dismiss, and is the
sole cause of the hydration error on your landing page.

>

### 3.3 Cut the eight themes down to three?

The report suggests keeping `default`, `minimal`, and one showpiece, and dropping
"Ghost of Tsushima," "Jujutsu Kaisen" and "Karan Aujla."

>

### 3.4 Is there a reason the fandom themes need to stay that I have not accounted for?

*Why this matters: I read them as personal taste shipped as product. If they are
deliberate — a specific audience, a specific story you tell about them — that
changes my recommendation, and I would rather hear it than be wrong.*

>

### 3.5 Delete `ARCHITECTURE.md`, or cut it to ~200 lines?

2,978 lines. It contains zero mentions of `.output(`, so it could not have
prevented and does not describe the defect that killed the product.

>

### 3.6 Is there anything on the cut list you would fight for?

>

---

## 4. The stream failure

### 4.1 Are you willing to talk about it in interviews?

>

### 4.2 Do you have the recording, or a clip of the moment they gave up?

*Why this matters: if a clip exists, the strongest possible artefact is a
before/after — the failure next to the fixed build. If it doesn't, the written
version still works.*

>

### 4.3 Do you know what they said, verbatim, at the point they gave up?

>

### 4.4 Did anything else in that session confuse them, beyond not finding the drag?

*Why this matters: I reconstructed the failure from source and screenshots. You
watched it. If they stumbled somewhere I ranked low, your memory outranks my
analysis.*

>

### 4.5 Would you be willing to run one more session with a stranger after the fixes land?

>

---

## 5. Scope of the fix

### 5.1 Do you want the OpenAPI/`/docs` layer kept, or deleted?

The report argues to keep it — it is a genuine signal — but concedes that
deleting `trpc-to-openapi` removes the entire failure class permanently.

>

### 5.2 Has anything ever consumed `/api/v1`, or is it only there for the docs page?

>

### 5.3 Are you willing to add a CI job that boots the API and hits `/health`?

*Why this matters: this is the single change that makes the class of bug that
killed the project impossible to reship. Everything else is a one-time fix; this
is the one that holds.*

>

### 5.4 Would you accept `.output(z.unknown())` as a temporary placeholder on ~13 procedures?

It is honest but uninformative in the spec, and the alternative is silently
stripping response fields with no tests to catch it.

>

### 5.5 Do you want to fix the analytics empty-state bugs, or hide analytics on draft forms?

The report recommends both, but the second one is a single condition and removes
six empty panels and two wrong charts at a stroke.

>

---

## 6. Things I could not determine from the repo

Short factual gaps. One line each is plenty.

### 6.1 Why is `recharts` pinned to an exact version with no caret?

*Why this matters: I could not find a compatibility reason — recharts 2.15.0
added React 19 support before your pin — so I have assumed it was a snapshot pin.
If there was a real reason, the upgrade advice changes.*

>

### 6.2 Does your `DATABASE_URL` point at a Neon `-pooler` host?

*Why this matters: you also set a client-side `max: 20`, so if it does, you have
two connection pools stacked.*

>

### 6.3 Was `AGENTS.md` written for you, or for an AI agent to follow?

>

### 6.4 Do you remember what the AI judge said when it flagged "sparse annotations"?

*Why this matters: that feedback led to the commit that killed the product. The
exact wording is genuinely interesting, and it belongs in the write-up.*

>

### 6.5 Has anyone other than you and the stream reviewer ever used FormForge?

>

---

## 7. The uncomfortable one

### 7.1 Do you agree that the naming in the code is inflated?

Specifically: "Distributed Mutex Lock" over a sha256 hash, "Dead Letter Queue"
over a `.catch(log)`, "AI Insights" over an if/else chain.

>

### 7.2 If you agree — where did that come from?

*Why this matters: the report's thesis is that it came from optimising for a
grader rather than a user, and that the same habit produced the commit that broke
the build. If that reading is wrong, I want to know, because a lot of section 7
rests on it.*

>

### 7.3 Are you willing to rename them to the plain versions?

The report argues the inflation is costing you credit for genuinely good work —
particularly the race-safe conditional increment that sits fifteen lines below
the "Distributed Mutex Lock" comment.

>

---

## 8. Anything we did not ask

### 8.1 What is the question I should have asked and didn't?

>

### 8.2 Is there anything in the report that is simply wrong?

*Everything is cited by file and line, so it should be checkable. If something is
wrong, it likely means I misread a constraint you were working under, and the
rest of that section probably needs revisiting too.*

>

### 8.3 What are you most proud of in this project?

*Why this matters: the report names three things as your strongest signals. If
the thing you are proudest of isn't among them, either I missed it or it isn't
legible from the code — and both of those are worth fixing before a screener
reads it.*

>
