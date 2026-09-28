# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a form creator on their first visit.** They arrive at the live site,
sign up or log in, and want to build a form, publish it and open its public
link, without being taught first. During the current portfolio phase, this
creator is most often an evaluator (a recruiter, hiring manager or reviewer
opening the live link cold, with little time and no one to guide them). They
judge the product by how quickly the builder makes sense and how good the
result looks. Design for that first visit before anything a returning power
user needs.

**Second: the respondent.** Someone following a shared link to answer a form,
often on a phone, with no account and no interest in the tool itself. They
want to finish quickly and to feel the form was made with care.

## Product Purpose

FormForge lets someone build a form, publish it with a theme, collect
responses and see how the form performed. Right now it is mainly a portfolio
piece for UI/UX and product-minded roles, and it may become a real product;
that product question is parked, not dropped.

Success means a first-time creator gets from arriving to a published form they
can open, unaided and without a tutorial, and the respondent experience is good
enough that it is the thing people remember.

## Positioning

Two things set FormForge apart from Tally, Typeform and Google Forms:

1. **Respondent craft.** One question at a time, focused and minimal, with
   themes and effects that make filling in a form feel good rather than feel
   like paperwork.
2. **Honest analytics.** Showing where respondents really drop off. This is a
   committed direction, **not a current capability**: today only "viewed" and
   "submitted" are measured for real, and the per-question drop-off and
   "started"/"halfway" funnel stages are derived from submitted responses. Until
   respondent telemetry exists, no surface may claim true drop-off tracking.

## Operating Context

- Creators work on desktop in the dashboard: form list, builder, responses,
  analytics and settings. The builder is the core surface.
- Respondents mostly open public forms at `/f/[slug]` from a shared link or QR
  code, often on mobile.
- Evaluators often reach the site from a resume or portfolio link and decide
  within the first minute.
- A live-streamed hackathon review is the defining evidence: the reviewer
  could not tell that fields had to be dragged from the palette onto the
  canvas. First-run clarity is the standing quality bar.

## Capabilities and Constraints

- 10 field types, conditional show/hide logic, multi-step one-question-at-a-time
  rendering, themes with animated backgrounds, QR sharing, response limits and
  expiry, password-protected forms, and analytics (health score, funnels,
  per-field and per-option breakdowns, time series, rule-based insights).
- Click to add fields, with drag as an alternative. Drag must never be the only
  way to place or reorder anything.
- One shared `FormRenderer` powers both the builder preview and the live form.
- Deployed on Vercel (Hobby) and Neon (Free). Serverless cold starts are real
  and must be designed around, not hidden.
- **Decided:** no product tour. Guidance lives in the interface: an empty
  canvas that teaches, starter templates, one-time hints at the point of use,
  info affordances, a `/` insert menu and keyboard reordering.
- **Decided:** the game-engine framing ("Game Engine Inspector", "GameObject")
  is being removed from the product. The builder keeps a dark, crafted feel but
  becomes calmer, with fewer panels.
- **Decided:** the hackathon fandom themes are being replaced with generic,
  customisable themes that keep the effects (cherry blossom, disco and so on)
  as options. Which themes: undecided until the public-form work.
- **Undecided:** the product name (see Brand Commitments) and the niche or
  buyer, if FormForge becomes a real product.
- Deeper engines come after the visible surfaces, in this order: respondent
  telemetry and an experiment loop, then an AI trust/review layer, then an
  API-first platform.

## Brand Commitments

- Name: "FormForge" for now. It is under review and will be revisited before
  the landing-page redesign.
- Voice: plain and honest. Name things for what they actually do. No inflated
  terminology ("AI insights" for rule-based checks, "distributed mutex" for a
  dedup hash) in any new or edited copy.
- Live site: https://formforge.jdevs.codes.

## Evidence on Hand

- A live, working deployment with seeded demo forms and 750 seeded responses.
  The seed data is synthetic and must never be presented as real usage.
- The recording of the hackathon review (owned by Preet), usable as a
  before/after story.
- Research reports on onboarding, builder UX and the market (kept locally, not
  in the repo).
- **Absent, and never to be fabricated:** real users, customers, testimonials,
  usage numbers, press, benchmarks or pricing. `/pricing` exists but is a
  mockup and must be labelled as one.
- No demo credentials, demo passwords or "try the demo account" prompts on any
  public surface.

## Product Principles

1. **Get to a published form fast.** Every builder decision is judged by time
   to first published form for someone who has never seen the product.
2. **Teach through the interface, not a tour.** Guidance appears where it is
   needed, when it is needed, and can be dismissed.
3. **The respondent's experience is the showpiece.** Delight is welcome there
   only when it is cheap, optional and respects reduced motion.
4. **Claim only what is real.** Analytics, copy and marketing describe what the
   product actually measures and does today.
5. **Every interaction has a non-drag path.** Click and keyboard come first,
   drag is extra.

## Accessibility & Inclusion

WCAG 2.2 AA across the product. Every theme and effect must meet contrast
requirements and respect `prefers-reduced-motion`. Public forms must be fully
usable with a keyboard and a screen reader, and on small touch screens.
