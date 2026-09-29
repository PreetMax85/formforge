// Seed stub env vars before any service module loads.
// env.ts process.exit(1)s on missing required vars, so this runs before
// vitest auto-imports any test file. Mirrors the env block in
// .github/workflows/ci.yml so CI and local tests use the same fixture.
// Integration tests run only against a disposable Neon branch passed as
// TEST_DATABASE_URL, never against DATABASE_URL (which points at production
// in local .env).
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL       ??= 'postgresql://stub:stub@stub/stub';
process.env.JWT_ACCESS_SECRET  ??= 'stub-secret-minimum-thirty-two-characters-xx';
process.env.JWT_REFRESH_SECRET ??= 'stub-secret-minimum-thirty-two-characters-xx';
process.env.APP_URL            ??= 'https://formforge.jdevs.codes';
process.env.RESEND_API_KEY     ??= '';
