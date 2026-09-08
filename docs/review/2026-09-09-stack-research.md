# FormForge — Stack Staleness Audit

**Research date:** 2026-09-08 · **Rule:** primary sources only — official docs,
official changelogs, published package source, security advisories, specs.
No blog posts, tutorials, or StackOverflow. Every claim carries the URL it came
from. Anything I could not establish from a primary source is marked
**UNVERIFIED** rather than guessed at.

Versions below are the **resolved** versions from `pnpm-lock.yaml`, not the
caret ranges in `package.json`. Where they differ, the resolved one is what you
are actually running.

---

## 0. The short version

Two items are urgent, and neither is the one `AGENTS.md` worries about.

| Item | Installed | Latest | Verdict |
|---|---|---|---|
| **`drizzle-orm`** | 0.39.3 | 0.45.2 | 🔴 **HIGH-severity SQLi CVE.** Not currently exercised; fix anyway |
| **`trpc-to-openapi`** | 3.1.0 | 3.3.0 | 🔴 Ships vulnerable pinned `h3@1.15.1`. Non-major bump, zero behaviour change |
| **`@sentry/nextjs` / `@sentry/node`** | 8.55.2 | 10.73.0 | 🟠 Two majors behind, **does not declare Next 16 support**, and is the reason for a build flag whose justification is dead |
| **`recharts`** | 2.15.4 (pinned) | 3.10.1 | 🟠 **npm-deprecated branch.** No further fixes, ever |
| **`react` / `react-dom`** | 19.2.0 | 19.2.8 | 🟠 Misses Server-Actions DoS hardening. Near-zero-risk patch bump |
| **`@neondatabase/serverless`** | 0.10.4 | 1.1.0 | 🟠 A major behind, and it is the wrong driver for your deployment shape |
| `next` | 16.1.0 | 16.3.4 | 🟡 Two minors, large free perf wins |
| `framer-motion` | 11.18.2 | 13.2.0 (as `motion`) | 🟡 Package renamed; cheap |
| `@trpc/*` | 11.8.1 | 11.18.0 | 🟡 No deprecations |
| `tailwindcss` | 4.1.18 (+4.3.0 transitive) | 4.3.3 | 🟢 Additive only; dedupes the lockfile |
| `zod` | 4.3.5 | 4.5.4 | 🟢 Barely stale |
| `@dnd-kit/core` | 6.3.1 | 6.3.1 | 🟢 **Current** — but frozen since 2024-12; the real problems are your code, not the version |
| `express` / `express-rate-limit` / `helmet` | 5.2.1 / 7.5.1 / 8.2.0 | 5.2.1 / 8.7.0 / 8.3.0 | 🟢 **Healthiest part of the stack.** Nothing to do |

**If you only do one thing from this document:** bump `drizzle-orm` to 0.45.2 and
`trpc-to-openapi` to 3.3.0 in the same commit as the boot fix. Both are lockfile
changes.

---

## 1. The `AGENTS.md` §19 question: is the Sentry/Turbopack claim still true?

The brief asked me to verify this specifically. **It is false, and it has been
false for about eleven months.**

The claim, at `AGENTS.md:641-642` and enforced by `apps/web/package.json:8`
(`"build": "next build --webpack"`):

> `@sentry/nextjs` v8 does not support Turbopack. Production builds must use
> `next build --webpack`.

citing `getsentry/sentry-javascript#8105`.

### 1.1 The cited issue is closed

https://github.com/getsentry/sentry-javascript/issues/8105 — **state: closed**.
Closed by maintainer `chargome` on **2025-09-22** with, verbatim:

> "Update:
> - We just released `10.13.0` of the SDK which will enable automatic sourcemap
>   uploads for turbopack builds (minimum next version is `15.4.1`).
> - Keep in mind that we're leveraging an after production compile hook for
>   injecting debugIds and uploading sourcemaps
> - Vercel is working on adding native debugId support in turbopack, we'll make
>   use of this as soon as they release it.
> - Sentry docs being updated atm
> - React Component Name Annotations will unlikely be supported in turbopack for
>   the time being
> - Errors thrown in Route Handlers are currently not reported to Sentry, this
>   will be fixed once Vercel releases `next@15.5.4`
>
> I will close this issue so we can better keep track of things."

The ❌ status table in that issue's *body* — which is what `AGENTS.md` is
effectively quoting — is dated **2025-05-05** and was superseded by the closing
comment. A follow-up on 2025-10-01 moved remaining tracking to
[#17841](https://github.com/getsentry/sentry-javascript/issues/17841) and noted
*"In the meantime, sourcemap uploads will still work out of the box."*

### 1.2 Turbopack is now Sentry's documented default; webpack is the fallback

From the changelog at
https://raw.githubusercontent.com/getsentry/sentry-javascript/develop/CHANGELOG.md:

| SDK version | Change | PR |
|---|---|---|
| 10.10.0 | `_experimental.useRunAfterProductionCompileHook` — first source-map upload for `next build --turbopack` | [#17352](https://github.com/getsentry/sentry-javascript/pull/17352) |
| **10.13.0** | **Default-ON for Turbopack builds → automated source-map uploads.** The "works out of the box" release | [#17722](https://github.com/getsentry/sentry-javascript/pull/17722) |
| **10.20.0** | Native debugIds in Turbopack; **Next.js 16 peer dependency added** | [#17925](https://github.com/getsentry/sentry-javascript/pull/17925) |
| **10.30.0** | **Deprecates the top-level webpack options** | [#18343](https://github.com/getsentry/sentry-javascript/pull/18343) |
| 10.43.0 | React component-name annotation on Turbopack — the last remaining ❌ in the old #8105 table | [#19604](https://github.com/getsentry/sentry-javascript/pull/19604) |

The docs now invert the relationship:

- https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/ — *"With
  Turbopack (Next.js 15+ default), source maps upload after the build completes.
  Requires `@sentry/nextjs@10.13.0+` and `next@15.4.1+`."* — with *"Using
  Webpack?"* as a separate section below it.
- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/ — *"This
  guide covers manual setup for **Next.js 15+ with Turbopack** and App Router.
  For other setups, see… Webpack Setup — For applications not using Turbopack."*

> ⚠️ **One conflicting source, flagged honestly.** A fetch of the Sentry Next.js
> landing page (`/platforms/javascript/guides/nextjs/`) returned an older
> callout claiming Turbopack production builds aren't fully supported. That text
> contradicts the sourcemaps and manual-setup pages fetched in the same session
> and describes a pre-Next-16 world. It is very likely a stale cached snapshot,
> but `docs.sentry.io` was egress-blocked for a second fetch route, so this one
> page is **UNVERIFIED**. The changelog and PR numbers above are not in doubt.

### 1.3 Worse: your Sentry version does not support Next 16 at all

From https://registry.npmjs.org/@sentry/nextjs:

```
8.55.2   peerDependencies.next = "^13.2.0 || ^14.0 || ^15.0.0-rc.0"                 ← no 16
10.73.0  peerDependencies.next = "^13.2.0 || ^14.0 || ^15.0.0-rc.0 || ^16.0.0-0"
```

Next 16 support arrived in SDK **10.20.0** ([#17925](https://github.com/getsentry/sentry-javascript/pull/17925)),
alongside an e2e test ([#17922](https://github.com/getsentry/sentry-javascript/pull/17922)).
**Sentry has never run CI against Next 16 on the v8 line.**

`pnpm-lock.yaml:8145` shows the install resolving
`@sentry/nextjs@8.55.2(…)(next@16.1.0(…))(webpack@5.107.1)` — an unsatisfied peer
that pnpm was configured to tolerate.

> **UNVERIFIED:** I found no issue documenting a concrete *runtime* failure of
> `@sentry/nextjs` v8 on Next 16. The claim here is precisely
> "declared-unsupported and never tested," not "known-broken." That distinction
> matters, and the practical risk is the nasty kind: instrumentation gaps show
> up as *missing errors*, not as build failures.

### 1.4 What this costs, and what to do

The `--webpack` flag is not itself deprecated — https://nextjs.org/docs/app/api-reference/cli/next
still lists it for `next dev` and `next build` with no deprecation marker, and
the Next 16 upgrade guide explicitly documents `"build": "next build --webpack"`
as a supported opt-out. So nothing is on fire. What you are paying:

1. An **unsupported Sentry/Next pairing** in the one place where failure is silent.
2. **Permanently slower builds** — you are opting out of Turbopack's 2–5× faster
   production builds (https://nextjs.org/blog/next-16) and disk-cached `next build`
   (up to 5.5× on CI, https://nextjs.org/blog/next-16-3).
3. **Drift toward a deprecated configuration** — Sentry deprecated the top-level
   webpack options in 10.30.0.

**Fix:** upgrade `@sentry/nextjs` and `@sentry/node` to `^10` together (same
release train), delete `--webpack` from `apps/web/package.json:8`, and delete
the three `AGENTS.md` passages. Migration guides:
[v8→v9](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v8-to-v9/) ·
[v9→v10](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/).
For this codebase's Sentry surface (`withSentryConfig`, `instrument.ts`,
`captureException`, `global-error.tsx`) the real work is the `sendDefaultPii`
IP-collection behaviour change and moving `sentry.client.config.ts` →
`instrumentation-client.ts`.

> **UNVERIFIED:** `@sentry/nextjs@11.0.0-beta.1` exists on the `next` dist-tag,
> but no v10→v11 migration guide is published. Do not plan against v11.

---

## 2. `trpc-to-openapi` — the boot crash, and the escape hatches

### 2.1 The requirement is real, and it is in the source

The throwing line, `src/generator/paths.ts:105-110`
(https://github.com/mcampa/trpc-to-openapi/blob/master/src/generator/paths.ts#L105-L110):

```ts
if (!instanceofZodType(outputParser)) {
  throw new TRPCError({
    message: 'Output parser expects a Zod validator',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
```

The `[mutation.auth.signup]` prefix is added at `paths.ts:187`.

The asymmetry that causes this is deliberate — `src/utils/procedure.ts:21-38`
gives **input** a default and gives **output** none:

```ts
const output = procedure._def.output as ZodObject | undefined;   // L23
...
} else {
  inputParser = z.object({});                                    // L31 — input falls back
}
```

Confirmed in the README's Requirements section
(https://github.com/mcampa/trpc-to-openapi#requirements): *"For a procedure to
support OpenAPI the following must be true: … An `output` parser is present AND
uses `Zod` validation."*

Note this is a **generation-time** throw, not an import-time one in the library
sense. It presents as an import crash here because `router.ts:19` calls
`generateOpenApiDocument` at module top level.

### 2.2 There are five escape hatches, and two are first-class

All five verified by execution against this project's exact resolved versions
(`trpc-to-openapi@3.1.0`, `@trpc/server@11.8.1`, `zod@4.3.5`, `zod-openapi@5.4.5`):

```
FAIL  no .output()                 TRPCError: [mutation.x] - Output parser expects a Zod validator
PASS  meta enabled:false           paths=[]      200schema=undefined
PASS  filter=>false                paths=[]      200schema=undefined
PASS  output z.unknown()           paths=["/x"]  200schema={}
PASS  output z.any()               paths=["/x"]  200schema={}
PASS  output z.looseObject({})     paths=["/x"]  200schema={"type":"object",...}
PASS  output z.void()              paths=["/x"]  200schema={}
```

**1. `enabled: false` — the documented per-procedure opt-out that keeps the meta.**
Checked at `src/utils/procedure.ts:61`
(https://github.com/mcampa/trpc-to-openapi/blob/master/src/utils/procedure.ts#L61):

```ts
if (meta?.openapi && meta.openapi.enabled !== false) {
```

It is a typed field on `OpenApiMeta['openapi']` (`enabled?: boolean`) and is in
the README's meta-options table
(https://github.com/mcampa/trpc-to-openapi#openapi-meta-options), default `true`.
**Caveat:** it removes the procedure from the REST adapter as well as the
document. The tRPC endpoint is unaffected.

**2. `filter` on `generateOpenApiDocument`** — a config-level predicate,
documented at https://github.com/mcampa/trpc-to-openapi#filtering-procedures-in-openapi-output.
Unlike `enabled: false`, it affects only the document, not the adapter.

**3–5. Permissive output schemas.** The guard is deliberately loose
(`src/utils/zod.ts`):

```ts
export const instanceofZodType = (type: any): type is $ZodTypes =>
  !!type?._zod?.def?.type;
```

Any Zod v4 schema has `_zod.def.type`, so `z.unknown()`, `z.any()`, `z.void()`,
`z.looseObject({})` and `z.record()` all satisfy it. `z.unknown()`/`z.any()` emit
`{}` in the spec — valid OpenAPI meaning "anything," which documents nothing.

### 2.3 🚨 The trap: `.output()` is a runtime filter, not an annotation

This is the most important sentence in this document. tRPC's `.output()`
**parses and strips the response at runtime.** Documented at
https://trpc.io/docs/server/validators#output-validators. Verified:

```
strict  .output(z.object({id}))          -> {"id":"1"}                                // secret & extra SILENTLY DROPPED
loose   .output(z.unknown())             -> {"id":"1","secret":"LEAK","extra":2}
dates   .output(z.object({d: z.date()})) -> {"d":"1970-01-01T00:00:00.000Z"}          // Date coerced to string
mismatch                                 -> THROW  Output validation failed
```

Adding 29 hand-written object schemas will silently change your API responses,
and you have **zero tests covering any tRPC router** to catch it. See §2 of the
main report for the recommended sequencing.

### 2.4 Version status, and a free security win

- **Latest: `3.3.0`** (2026-05-22). Yours: `3.1.0` (2025-10-07). https://registry.npmjs.org/trpc-to-openapi
- **The output requirement has not changed.** I byte-diffed the published
  `dist/` of both: `generator/paths.mjs` is **identical**. Upgrading does not fix
  the crash and does not change generation behaviour.
- Real changes 3.1.0 → 3.3.0: imports moved `zod` → `zod/v4`; peer widened to
  `zod: ^3.25.0 || ^4.0.0`; `unwrapZodType` handles `prefault` and `.transform()`
  pipes; a try/catch fallback for *"Zod 4 throws on `.omit()` for schemas with
  refinements"*; `contact`/`license` options; 402 and 428 status codes; and —
  the important one — **`h3` moved from pinned `1.15.1` to `^1.15.5`**.

> 🚨 **`trpc-to-openapi` 2.2.0–3.2.0 is flagged MODERATE by `npm audit`** because
> it pins vulnerable `h3`. Your lockfile resolves **`h3@1.15.1`**
> (`pnpm-lock.yaml:4240`). Advisories against h3 ≤1.15.8 include path traversal
> ([GHSA-wr4h-v87w-p3r7](https://github.com/advisories/GHSA-wr4h-v87w-p3r7),
> [GHSA-72gr-qfp7-vwhw](https://github.com/advisories/GHSA-72gr-qfp7-vwhw)), SSE
> injection ([GHSA-4hxc-9384-m385](https://github.com/advisories/GHSA-4hxc-9384-m385),
> [GHSA-22cc-p3c6-wpvm](https://github.com/advisories/GHSA-22cc-p3c6-wpvm)) and
> TE.TE request smuggling ([GHSA-mp2g-9vg9-f4cg](https://github.com/advisories/GHSA-mp2g-9vg9-f4cg)).
> **3.3.0 is a non-major fix.** Take it.

> ⚠️ The repo has **no GitHub Releases and no CHANGELOG** —
> https://github.com/mcampa/trpc-to-openapi/releases is empty. Version history
> has to be read from npm and commits.

### 2.5 Which package is maintained, and a third option

- **`trpc-openapi` (jlalmes) is archived and dead.** Its README says so verbatim:
  *"Repo is archived due to not having maintainers… look at
  https://www.npmjs.com/package/trpc-to-openapi for an alternative"*
  (https://github.com/jlalmes/trpc-openapi). Last version 1.2.0, peers
  `@trpc/server` v10 and `zod ^3.14.4` — unusable here.
- **`trpc-to-openapi` (mcampa) is the maintained successor.** Community, not
  official. It relaxed the *input* requirement and kept the *output* one.
- 🆕 **There is now an official option: `@trpc/openapi` (alpha)**, and it
  directly removes your problem. From https://trpc.io/docs/openapi:
  > *"**No output types needed** — unlike other OpenAPI tools, `.output()`
  > schemas are optional. The generator infers return types from your
  > implementation automatically."*

  Latest `11.18.0-alpha` (2026-06-17); peers `@trpc/server: 11.18.0` **exactly**.
  https://registry.npmjs.org/@trpc/openapi

  ⚠️ **Not a drop-in.** It documents tRPC's *native RPC protocol*
  (`GET /procedure.path`, input as `?input=`) and ships **no REST HTTP adapter** —
  it will not produce `/api/v1/forms/{id}` from `meta.openapi.path`. If you want
  a spec for Scalar and nothing else, it deletes all 29 schemas at a stroke. If
  you want real REST routes, you still need `trpc-to-openapi`.
  **UNVERIFIED:** I confirmed the "output optional" claim from the official docs
  but did not execute it, since it requires pinning `@trpc/server` to 11.18.0.

### 2.6 Zod v4 compatibility

**Verified working, not merely declared.** Real documents generated on
`zod@4.3.5` + `zod-openapi@5.4.5` + `@trpc/server@11.8.1`. `3.1.0`'s peers are
`zod: ^4.0.0`, `zod-openapi: ^5.0.1`; its internals are genuinely v4-native
(`_zod.def.type`, `.meta()`, `type: 'pipe' | 'prefault'`).

⚠️ **Do not bump `zod-openapi` to 6.x.** Latest is `6.0.2` (2026-08-31), but both
3.1.0 (`^5.0.1`) and 3.3.0 (`^5.4.4`) cap it at 5.x.
https://registry.npmjs.org/zod-openapi

---

## 3. Deriving output schemas from Drizzle — `drizzle-zod`

The answer to "must I hand-write a dozen schemas?" is: **no, derive them.**

| Fact | Value | Source |
|---|---|---|
| Latest `drizzle-zod` | **0.8.3** (2025-08-06) | https://registry.npmjs.org/drizzle-zod |
| Zod v4 | **Yes** — peer `zod: ^3.25.0 \|\| ^4.0.0` | same |
| drizzle-orm compat | peer `>=0.36.0` → your 0.39.3 works | same |
| Docs | https://orm.drizzle.team/docs/zod | — |

`createSelectSchema(table)` is documented as *"the shape of data queried from the
database — can be used to validate API responses"* — precisely the `.output()`
use case. `createInsertSchema` and `createUpdateSchema` cover the other two.

**Verified end to end** on `drizzle-orm@0.39.3` + `drizzle-zod@0.8.3` +
`zod@4.3.5`, including passing the result through `trpc-to-openapi@3.1.0` — both
a raw `createSelectSchema` and a refined one produced valid OpenAPI, with
`format: uuid` derived automatically from `pg.uuid()`. `.omit({ passwordHash: true })`
works as expected.

**Two caveats worth knowing before you start:**

1. ⚠️ **The docs page now documents the drizzle-orm 1.0 RC**, where the package
   was folded in (`import { createSelectSchema } from 'drizzle-orm/zod'`). On
   0.39.x you must import from the standalone `drizzle-zod` package. The API and
   the data-type reference table still apply.
2. ⚠️ **`timestamp()` maps to `z.date()`**, and Zod's own `z.toJSONSchema()`
   throws on it (`Error: Date cannot be represented in JSON Schema`).
   `zod-openapi` degrades gracefully to `{"type":"string"}` so generation won't
   break, but you lose `format: date-time`. Fix with the documented refinement
   parameter — `createSelectSchema(users, { createdAt: z.iso.datetime() })`
   produces `{"type":"string","format":"date-time"}` — or
   `createSchemaFactory({ coerce: { date: true } })`.

> 🚨 Re-read §2.3 before doing this. Swapping in `createSelectSchema` for a
> procedure whose handler returns joined or computed fields **will silently drop
> them.** Derive, then `.extend()`. Do not just paste.

---

## 4. `drizzle-orm` 0.39.3 → the security item

| | Installed | Latest |
|---|---|---|
| `drizzle-orm` | **0.39.3** | **0.45.2** (2026-03-27) |
| `drizzle-kit` | **0.30.6** | **0.31.10** (2026-03-17) |

https://registry.npmjs.org/drizzle-orm · https://registry.npmjs.org/drizzle-kit
A `1.0.0-rc.5` exists on the `rc` tag, so a 1.0 major is imminent.

> 🚨 **HIGH severity. `drizzle-orm < 0.45.2` is vulnerable. Yours is in range.**
>
> **CVE-2026-39356 / [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)** —
> *"Drizzle ORM has SQL injection via improperly escaped SQL identifiers."*
> CVSS **7.5** (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`). Affects PostgreSQL.
> Patched in **0.45.2**. Cause: *"embedded identifier delimiters were not escaped
> before the identifier was wrapped in quotes or backticks."*
> At-risk APIs: `sql.identifier()`, `.as()`, dynamic sorting on user input,
> dynamic alias/CTE construction.

✅ **Mitigating fact, verified in this checkout.** Grepping the whole codebase
excluding `node_modules`:

```
$ grep -rn "sql\.identifier\|sql\.raw\|\.as(" apps packages
NO MATCHES
```

Every `db.execute(sql\`…\`)` call in `analytics.service.ts` interpolates
**values** (which Drizzle parameterises), never identifiers. So you are not
exercising the vulnerable path today. It becomes live the moment someone adds
sortable columns to the responses table.

**Notable changes 0.40 → 0.45**, from the official changelogs at
https://github.com/drizzle-team/drizzle-orm/tree/main/changelogs/drizzle-orm:

- **0.40.0** — Gel dialect. No breaking changes.
- **0.41.0** — ⚠️ **the one most likely to bite.** Removed in-driver mapping for
  Postgres types `1231` (numeric[]), `1115` (timestamp[]), `1185`
  (timestamptz[]), `1187` (interval[]), `1182` (date[]), *"preventing precision
  loss and data/type mismatches"*, plus `bigint`/`number` modes for
  `decimal`/`numeric`. **If you store arrays of timestamps or numerics, returned
  JS value shapes change.**
- **0.42.0** — removed duplicated exports (fixes `does not provide an export
  named 'eq'` under custom loaders); `pgEnum` accepts TS enums.
- **0.43.0** — cross/lateral joins; ⚠️ removed unsupported `fullJoin` from the
  MySQL API.
- **0.44.0** — `DrizzleQueryError` wrapping driver errors with SQL, params and
  original stack (genuinely useful); opt-in `cache` module, `global: false` by
  default.
- **0.45.0/0.45.1** — `$onUpdate` handles `SQL` values; pg-native Pool detection.
- **0.45.2** — the SQLi fix.

**Neon interaction:** nothing in 0.40–0.45 breaks the Neon drivers.
`drizzle-orm@0.45.2`'s peer for `@neondatabase/serverless` is `>=0.10.0`, so
upgrading Drizzle does **not** force a Neon driver bump.

⚠️ **Migrations need a direct connection.** Neon explicitly lists *"Schema
migrations (Prisma Migrate, **Drizzle Kit**, django-admin migrate)"* as requiring
a direct, non-pooled connection, not the `-pooler` host
(https://neon.com/docs/connect/choose-connection). `packages/db/drizzle.config.ts`
feeds a single `DATABASE_URL` to both runtime and `db:migrate`. Split it.

---

## 5. `@neondatabase/serverless` 0.10.4 — and the driver you should be using

| | |
|---|---|
| Installed | **0.10.4** (2024-11-25) |
| Latest | **1.1.0** (2026-04-17) — a full major behind |

https://registry.npmjs.org/@neondatabase/serverless

**Breaking change in 1.0.0** (2025-03-25): the HTTP template function *"can now
only be called as a template function, not as a conventional function"* —
`sql('SELECT … $1', [id])` is now both a type and a runtime error; use
`sql.query()` or `sql.unsafe()`. **Minimum Node is now v19.** 1.1.0 inlines type
declarations and drops the `@types/pg` re-exports.
https://github.com/neondatabase/serverless/blob/main/CHANGELOG.md

✅ **This break does not affect you** — `packages/db/src/index.ts` uses
`new Pool(...)` (the WebSocket path), not the `neon()` HTTP template. But note
your root `package.json:22` declares `"node": ">=18"`, which is **below** the ≥19
floor that 1.x requires.

### 5.1 The architectural finding: you are using the wrong driver

Neon's own decision guide is unambiguous, and it describes your deployment
exactly (https://neon.com/docs/connect/choose-connection):

> **"Running on a long-lived server (JS/TS)?** If you deploy a JavaScript or
> TypeScript app to Railway, Render, a VPS, Docker, or any self-hosted
> environment with persistent processes, **use a standard TCP driver with
> connection pooling**. Your server can maintain a connection pool across
> requests, making TCP the fastest and most efficient option. **Recommended
> drivers: `pg` (node-postgres), `postgres.js`, or `Bun.SQL`.**"

Their quick-reference table maps `@neondatabase/serverless` only to Cloudflare
Workers, Netlify and Deno Deploy — platforms *without* persistent processes.

You ship a `Dockerfile` and a long-running Express 5 server, and
`packages/db/src/index.ts` does:

```ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString, max: 20, idleTimeoutMillis: 30_000 });
```

You picked the *correct half* of the serverless driver — WebSockets, because you
need sessions and transactions (https://neon.com/docs/serverless/serverless-driver
recommends HTTP only for *"single, non-interactive transactions… one-shot
queries"*). So it is functional. It just pays WebSocket framing overhead where
plain TCP would be faster and simpler.

⚠️ **Watch for double pooling.** You set a client-side `max: 20`. If
`DATABASE_URL` also points at a `-pooler` host, you have two pools stacked —
Neon lists *"debugging double-pooling"* as a reason to read
https://neon.com/docs/connect/connection-pooling. Whether it does is
env-dependent and **UNVERIFIED** from the repo.

**Two separable fixes:** (1) bump to 1.1.0 — low risk since you don't use the
HTTP template, but raise `engines.node` to ≥19; (2) the bigger optional win,
switch to `pg` + `drizzle-orm/node-postgres`. Neither is urgent.

---

## 6. Next.js 16.1.0

**Not current.** Latest **16.3.4** (2026-08-31); 16.1.0 shipped **2025-12-18** —
about nine months and two minors behind. https://registry.npmjs.org/next

**What Next 16 changed vs 15**, from https://nextjs.org/blog/next-16 and
https://nextjs.org/docs/app/guides/upgrading/version-16:

- **Turbopack stable and default** for `next dev` and `next build`. Notably:
  *"If your project has a custom `webpack` configuration and you run `next build`
  (which now uses Turbopack by default), the build will fail to prevent
  misconfiguration issues."*
- **Cache Components** — `"use cache"` + PPR; `experimental.ppr` removed.
  `revalidateTag()` now takes a `cacheLife` profile as a second argument
  (single-arg deprecated); new `updateTag()` and `refresh()`.
- **Async request APIs, fully breaking** — synchronous access to `cookies`,
  `headers`, `draftMode`, `params`, `searchParams` is *removed* (15 had a
  temporary shim).
- **`middleware.ts` → `proxy.ts`**, Node runtime; `middleware.ts` deprecated.
- **Removals:** AMP entirely; `next lint` (`next build` no longer lints).
- **Requirements:** Node 20.9+, TypeScript 5.1+, Chrome/Edge/Firefox 111+,
  Safari 16.4+.

**Is `--webpack` deprecated or removed? No.**
https://nextjs.org/docs/app/api-reference/cli/next lists it for both `next dev`
and `next build` with no deprecation marker, and the upgrade guide documents
`"build": "next build --webpack"` as a supported opt-out while recommending
Turbopack. **So §1's cost is lost performance and an unsupported Sentry pairing,
not an imminent break.**

What 16.2/16.3 would give you free: ~87% faster `next dev` startup and 25–60%
faster server rendering (https://nextjs.org/blog/next-16-2); up to 90% less dev
RAM, disk-cached builds, 22% more requests/sec via native Node streams, and
TypeScript 7 type-checking support (https://nextjs.org/blog/next-16-3). 16.2
alone landed *"over 200 Turbopack fixes."*

**Verdict:** mildly stale, low risk, high free upside.

---

## 7. React 19.2.0

**Same minor, eight patches behind.** Latest **19.2.8** (2026-07-21); 19.2.0
shipped 2025-10-01. https://registry.npmjs.org/react ·
https://github.com/facebook/react/releases

There is nothing newer than 19.2 as stable — Next ships `19.3.0-canary-*`, so
there is no 19.3 or 20 to chase.

**What matters in 19.2.0 → 19.2.8** — every patch is React Server Components or
Server Actions, and several are security hardening
(https://raw.githubusercontent.com/facebook/react/main/CHANGELOG.md):

- 19.2.1 (2025-12-03) — RSC fixes brought to Server Actions
- 19.2.2 / 19.2.3 (2025-12-11) — Promise-cycle and loop protection in Server Functions
- **19.2.4 (2026-01-26) — "Add more DoS mitigations to Server Actions, and harden
  Server Components"** ([#35632](https://github.com/facebook/react/pull/35632))
- 19.2.5 (2026-03-18) — more cycle protections
- 19.2.6 (2026-05-06) — type hardening; **19.2.7 (2026-06-01) fixes a `FormData`
  regression that 19.2.6 introduced** — so land on ≥19.2.7, not 19.2.6
- 19.2.8 (2026-07-21) — RSC decode performance

**Verdict:** stale in a way that matters for a Server-Actions-heavy App Router
app, and a patch bump within 19.2.x carries essentially zero API risk. Do it.

> **UNVERIFIED:** 19.2.8's release note is thin ("performance improvements when
> decoding") and the `main` CHANGELOG had not been updated past 19.2.7 when read;
> 19.2.8's content comes from the GitHub releases page.

---

## 8. recharts 2.15.4 — pinned, and formally dead

Three findings in ascending order of importance.

**Recharts 3.x is out.** Latest **3.10.1** (2026-07-25); 3.0.0 landed 2025-06-23;
22 stable 3.x releases. **2.15.4 is the last 2.x ever published.**
https://registry.npmjs.org/recharts

**🚨 Recharts 2.x is marked deprecated on npm.** The registry carries a
`deprecated` field on every 2.x version, verbatim:

> *"1.x and 2.x branches are no longer active. Bump to Recharts v3 to receive
> latest features and bugfixes. See
> https://github.com/recharts/recharts/wiki/3.0-migration-guide"*

`pnpm install` is printing that warning today.

**The pin is not a React 19 workaround.** `recharts@2.15.4` declares
`peerDependencies.react: "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"` — React 19
entered the peer range in **2.15.0, published 2024-12-12**, before this
project's pin. Recharts 3.x declares the same. So React 19 gives you no reason
to sit on 2.15.4 and no reason to avoid 3.x.
**UNVERIFIED:** what the exact pin was originally for. No code comment or
lockfile note explains it. My read is that it is a snapshot pin, not a
compatibility constraint.

**What breaks 2 → 3** (https://github.com/recharts/recharts/wiki/3.0-migration-guide) —
the state management was rewritten. Relevant to your charts:

- **`activeIndex` removed** from `Scatter`/`Bar`/`Pie` — the most likely to bite.
- `CategoricalChartState` gone; `Customized` children no longer receive internal
  state props.
- **Z-index is now pure SVG render order** — put `Tooltip` before `Legend` in JSX
  or overlap changes.
- `accessibilityLayer` now defaults to **true**; keyboard events no longer flow
  through `onMouseMove`.
- `TooltipProps` → `TooltipContentProps` for custom tooltip `content` — **you use
  a custom `DarkTooltip`** (`AnalyticsComponents.tsx:63`), so this one applies
  directly.
- `CartesianGrid` gains `x/yAxisId`; with a non-default axis id, grid lines
  silently stop rendering.
- Multiple `YAxis` render alphabetically by `yAxisId`, not JSX order.
- `Area` with `connectNulls` treats `null` as 0; `Pie.blendStroke`,
  `alwaysShow`, `isFront` removed.

**Verdict:** the stalest non-Sentry item. You are on an npm-deprecated package
that will receive no fixes, ever. Your usage (Bar/Line/Pie) is squarely in the
migration guide's "should mostly just work" zone; the real risks are
`activeIndex`, your custom tooltip's typing, and tooltip/legend layering. Budget
a real afternoon with visual diffs. **Do not let an agent do this one blind** —
it is exactly the kind of change where everything compiles and the charts are
subtly wrong.

---

## 9. framer-motion 11.18.2 — renamed

**Confirmed: renamed to `motion`, announced 2024-11-11.** Primary source:
https://motion.dev/magazine/framer-motion-is-now-independent-introducing-motion —
*"With Framer's blessing and support, Framer Motion is now completely
independent."* (Matt Perry.) The repo moved `framer/motion` →
`motiondivision/motion`.

Migration, from https://motion.dev/docs/react-upgrade-guide: *"To upgrade to
Motion for React, uninstall `framer-motion` and install `motion`… Then simply
swap imports from `"framer-motion"` to `"motion/react"`."* And: *"There are no
breaking changes in Motion for React in version 12."*

**Is framer-motion 11 maintained? No — but the package name is.**
https://registry.npmjs.org/framer-motion:

- **11.18.2 (2025-01-20) is the final 11.x.** 12.0.0 shipped 23 minutes later.
- The `framer-motion` name is still published — **13.2.0 on 2026-09-02**, in
  lockstep with `motion@13.2.0` (identical versions and timestamps). It is a
  maintained legacy alias, not an abandoned package.
- 13.0.0 (2026-08-05) is the only breaking change since 11: it removes the
  optional `@emotion/is-prop-valid` dependency in favour of explicit
  `<MotionConfig isValidProp={isPropValid}>`. **Irrelevant to you** — no
  Styled Components or Emotion in this repo.
- Peers have declared `react: "^18.0.0 || ^19.0.0"` since 11.18.2.

**Verdict:** stale but the cheapest fix here. Either bump `framer-motion` to
`^13` and change nothing else, or do the proper rename
(`pnpm remove framer-motion && pnpm add motion`, then `framer-motion` →
`motion/react` in the six files that import it). Cost of leaving it: 20 months of
animation-performance work and an import path the upstream docs no longer
describe.

---

## 10. tRPC 11.8.1

| | |
|---|---|
| Installed | 11.8.1 |
| Latest 11.x | **11.18.0** (2026-06-17) — 10 minors behind |
| v12 | **None released or announced** |

https://registry.npmjs.org/@trpc/server · https://trpc.io/blog

The last major announcement is v11 (2025-03-21):
https://trpc.io/blog/announcing-trpc-v11. **No breaking changes or deprecations
documented across 11.9.0 → 11.18.0.** Peer `typescript: >=5.7.2` (you have 5.9.2).

Adds relevant to you: 11.13.2 "Support OpenAPI json generation for any tRPC
appRouter", 11.16.0 "OpenAPI Cyclic Types support" + `z.lazy` via Standard
Schema, 11.18.0 OpenAPI server URL support — these are the supporting changes for
the `@trpc/openapi` alpha in §2.5.

> **UNVERIFIED:** the GitHub releases page rendered *years* as 2024 for these
> tags, contradicting npm's publish timestamps. I used the registry timestamps
> and treat the release-page dates as unreliable.

**Verdict:** mildly stale, low risk, no deprecations to action. The one reason to
bump is that `@trpc/openapi` requires exactly 11.18.0.

---

## 11. Zod 4.3.5

Latest **4.5.4** (2026-08-29). https://registry.npmjs.org/zod

- v4 has been **stable since mid-2025** — *"After a year of active development:
  Zod 4 is now stable!"* https://zod.dev/v4. Breaking-change list:
  https://zod.dev/v4/changelog
- Entrypoints: `zod` (a.k.a. `zod/v4`) is the flagship; **`zod/v4-mini`** is the
  tree-shakable variant — *"If you have uncommonly strict constraints around
  bundle size, consider Zod Mini."* https://zod.dev/packages/mini
- v3 remains reachable at `zod/v3` for incremental migration. **You are fully on
  v4 already**, so there is no migration work.
- One deprecation in the current API: **`.superRefine()` is deprecated — use
  `.check()`.** https://zod.dev/packages/zod

**Verdict:** two minors behind, no action needed. Just don't take `zod-openapi`
6.x while pinned to `trpc-to-openapi` 3.x (§2.6).

---

## 12. Tailwind CSS 4.1.18

Latest **4.3.3** (2026-07-16); 4.1.18 shipped 2025-12-11. `@tailwindcss/postcss`
tracks in lockstep. https://registry.npmjs.org/tailwindcss

⚠️ Your lockfile contains **both** `tailwindcss@4.1.18` (`:5698`) and
`tailwindcss@4.3.0` (`:5701`) — a transitive dependency already pulls 4.3.0, so
you ship two copies of the engine.

From https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/CHANGELOG.md:

- **4.2.0** (2026-02-18) — mauve/olive/mist/taupe palettes; `@tailwindcss/webpack`
  plugin; logical-property utilities (`pbs-*`, `mbs-*`, `border-bs-*`,
  `inline-*`/`block-*` sizing, `inset-s-*`/`inset-e-*`); `font-features-*`.
  **Deprecated: `start-*` and `end-*`** in favour of `inset-s-*`/`inset-e-*` —
  the only deprecation in this window, worth a grep.
- **4.3.0** (2026-05-08) — `@container-size`; `scrollbar-*` utilities; `zoom-*`;
  `tab-*`; `@variant` with stacked and compound variants; `--default(…)` inside
  `--value(…)`/`--modifier(…)`.

**Verdict:** stale but cheap and low-risk — all additive within v4, and there is
no `tailwind.config.ts` to migrate since you are already `@theme`-based. The real
nudge is deduping the engine.

---

## 13. Express 5.2.1, express-rate-limit, helmet

**This is the healthiest part of your stack. Nothing to do.**

**Express** — `dist-tags: { latest: "5.2.1", "latest-4": "4.22.2" }`. 5.x holds
`latest`; 4.x is maintenance-tagged. Published 2025-12-01. **You are exactly
current.** https://registry.npmjs.org/express

**express-rate-limit** — resolved **7.5.1**. Express 5 explicitly supported
(7.4.0 declared `express: "4 || 5 || ^5.0.0-beta.1"`; 7.5.1 broadened to
`>= 4.11`). Latest is 8.7.0.

> 🟢 **Good news for staying on 7.x.** Advisory
> [GHSA-46wh-pxpv-q5gq](https://github.com/express-rate-limit/express-rate-limit/security/advisories/GHSA-46wh-pxpv-q5gq)
> (High, CVSS 7.5 — *"IPv4-mapped IPv6 addresses bypass per-client rate limiting
> on servers with dual-stack network"*) affects **8.0.0–8.2.1 only. 7.x is not
> affected.** If you do move to 8.x, land on **≥8.5.2**.

**helmet** — resolved **8.2.0**; latest 8.3.0 (2026-07-12). **Zero runtime
dependencies and no `express` peer dependency at all** — it is plain
`(req, res, next)` middleware, so it is framework-version-agnostic.
https://registry.npmjs.org/helmet · https://helmetjs.github.io/

---

## 14. @dnd-kit — current version, broken usage

### 14.1 Versions

| | |
|---|---|
| `@dnd-kit/core` **6.3.1** | ✅ **is `latest`** — but published **2024-12-05** |
| `@dnd-kit/sortable` **10.0.0** | ✅ **is `latest`** — published 2024-12-04 |

https://registry.npmjs.org/@dnd-kit/core · https://registry.npmjs.org/@dnd-kit/sortable

**Not abandoned — superseded.** The maintainer moved to a ground-up rewrite in
the same repo: **`@dnd-kit/react` 0.5.0** (2026-06-11) on `@dnd-kit/dom` +
`@dnd-kit/abstract`, with betas as recent as **2026-09-05**.
https://registry.npmjs.org/@dnd-kit/react · https://next.dndkit.com/react

The old docs are now explicitly labelled **"Legacy"** —
https://docs.dndkit.com/api-documentation/sensors/keyboard renders as *"Keyboard
— Legacy"* and states: *"This legacy page documents the older `@dnd-kit/core`
keyboard sensor behavior."*

⚠️ It is a **breaking API rewrite**, not an upgrade: `useDraggable` returns
`{ref}` and you use `<DragDropProvider>` — there is no `attributes`/`listeners`/
`setNodeRef`. And it is still **0.x**. **Do not migrate now.** Note it as a
6–12 month watch item.

**React 19:** `@dnd-kit/core@6.3.1` declares `react: ">=16.8.0"`, satisfying your
19.2.0, and the lockfile resolves cleanly.
**UNVERIFIED:** no primary source either affirming or denying React-19-specific
issues in 6.3.1 (GitHub issue search was blocked this session). "Satisfies the
peer range and installs" is the strongest supportable claim.

### 14.2 What dnd-kit gives you for free — and what it doesn't

From https://docs.dndkit.com/guides/accessibility and
https://docs.dndkit.com/api-documentation/sensors:

1. **KeyboardSensor is on by default.** *"By default, `DndContext` uses the
   Pointer and Keyboard sensors."* Defaults: `start: ['Space','Enter']`,
   `cancel: ['Escape']`, `end: ['Space','Enter']`; `useSortable` overrides arrow
   keys to hop between sortable items.
2. **`useDraggable` sets `tabindex="0"`**, so custom `div`s can receive focus.
3. **Default ARIA:** `role="button"`, `aria-roledescription="draggable"`,
   `aria-describedby` — supplied via the `attributes` object.
4. **Built-in screen-reader instructions and live-region announcements.**
5. ❗ **dnd-kit does NOT provide cursor or contrast styling.** Visual affordance
   is entirely the author's job. This is the crux.

### 14.3 🚨 Two defects in this codebase, not in the library

**(i) Keyboard drag-and-drop is completely disabled.**
`apps/web/app/dashboard/forms/[id]/builder/page.tsx:156-158`:

```ts
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
);
```

Passing `sensors` **replaces** the defaults — the KeyboardSensor is gone. The
official docs list every sensor explicitly for exactly this reason. Consequences:
no keyboard reordering, no keyboard field creation, and dnd-kit's default
screen-reader instructions now describe an interaction that does not exist.

Fix: add `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })`
(imported from `@dnd-kit/sortable`).

**(ii) The drag handle is below the contrast floor.**
`apps/web/components/builder/FieldCard.tsx:98` renders `GripVertical` at
`color: '#3c3c3c'`:

| Grip `#3c3c3c` on | Ratio | WCAG 2.2 SC 1.4.11 (3:1) |
|---|---|---|
| card `#252526` | **1.39:1** | fail |
| hover `#2d2d30` | **1.24:1** | fail |
| selected `#094771` | **1.13:1** | fail |

SC 1.4.11 requires 3:1 for *"visual information required to identify user
interface components"*, and warns that *"particularly thin lines and shapes… may
be rendered by user agents with a much fainter color than the actual color
defined in the underlying CSS"* — precisely a 14px grip glyph.
https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html

✅ **Credit where due:** both `FieldCard.tsx` and `FieldPalette.tsx` correctly
spread `{...attributes}` alongside `{...listeners}`, so the `role`,
`aria-roledescription` and `tabindex` defaults *are* present. The accessibility
foundation is there; the sensor config and the contrast throw it away.

**Verdict:** versions are current but frozen. **Cost of leaving the versions:
low. Cost of leaving the two defects: high** — and neither fix depends on any
dependency upgrade.

---

## 15. Honest gaps

Stated plainly, per the brief's rule that a named gap is a finding and a silent
omission is a defect.

- **GitHub's REST API and the GitHub MCP tool were repo-scoped** to
  `preetmax85/formforge` this session, so I could not search the issue trackers
  of `trpc-to-openapi`, `@dnd-kit` or others. Where I would normally have cited
  an issue search, I substituted **published-package-source inspection**
  (downloading and reading the actual npm tarballs), **raw changelog fetches**,
  and **executing probes against the project's exact resolved versions**. Any
  "no known issue with X" claim about an issue tracker is **UNVERIFIED**.
- `docs.sentry.io` was egress-blocked for `WebFetch`, so the one contradictory
  Sentry landing page (§1.2) could not be re-fetched by a second route.
- **No v10→v11 Sentry migration guide exists** yet, despite an 11.0.0-beta.1 on
  the `next` tag.
- **No documented runtime failure of `@sentry/nextjs` v8 on Next 16.** The claim
  is "declared-unsupported and never CI-tested," not "known-broken."
- **Why recharts is pinned exactly** is unexplained in the repo, and the React 19
  compatibility theory is contradicted by the peer deps.
- **Whether `DATABASE_URL` uses a `-pooler` host** (double-pooling, §5.1) is
  environment-dependent and not determinable from the repo.
- **`@trpc/openapi` was not executed** — its "output optional" claim is verified
  from official docs only, since running it requires pinning `@trpc/server` to
  exactly 11.18.0.
- tRPC's **GitHub release dates contradicted npm's** publish timestamps; I used
  the registry.
