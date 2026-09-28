import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// Own file, so these requests start from fresh in-memory limiter counts.
vi.mock('./common/db/index', () => ({
  db:      { execute: vi.fn() },
  closeDb: vi.fn(),
}));

const { createApp } = await import('./app');

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** POST with no refresh cookie: answered 401 without touching the database. */
const refresh = () =>
  fetch(`${baseUrl}/trpc/auth.refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    '{}',
  }).then((r) => r.status);
/** POST with an invalid body: answered 400 by input validation. */
const login = () =>
  fetch(`${baseUrl}/trpc/auth.login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    '{}',
  }).then((r) => r.status);

describe('global rate limit', () => {
  it('allows 200 requests per window, since every dashboard page load costs several', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('ratelimit-limit')).toBe('200');
  });
});

describe('auth rate limits', () => {
  it('lets refresh, which every dashboard page load calls, run 60 times per window', async () => {
    const statuses = [];
    for (let i = 0; i < 60; i++) statuses.push(await refresh());
    expect(statuses).not.toContain(429);
    expect(await refresh()).toBe(429);
  });

  it('keeps login on its own budget, unspent by refreshes', async () => {
    expect(await login()).not.toBe(429);
  });
});
