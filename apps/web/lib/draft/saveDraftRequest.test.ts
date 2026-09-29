import { describe, it, expect, vi } from 'vitest';
import { saveDraftRequest } from './saveDraftRequest';

const content = { title: 'T', description: null, theme: 'default' as const, thankYouTitle: null, thankYouMessage: null, fields: [] };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('saveDraftRequest', () => {
  it('returns the new revision on success', async () => {
    const fetchImpl = vi.fn(async () => json(200, { result: { data: { success: true, data: { revision: 5 } } } }));
    await expect(saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh: async () => true }))
      .resolves.toEqual({ kind: 'saved', revision: 5 });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.keepalive).toBe(true);
  });

  it('maps 409 to conflict', async () => {
    const fetchImpl = vi.fn(async () => json(409, { error: { message: 'x' } }));
    await expect(saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh: async () => true }))
      .resolves.toEqual({ kind: 'conflict' });
  });

  it('refreshes the token once on 401 and retries', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(json(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(json(200, { result: { data: { success: true, data: { revision: 5 } } } }));
    const refresh = vi.fn(async () => true);
    await expect(saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh }))
      .resolves.toEqual({ kind: 'saved', revision: 5 });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reports signed out when refresh fails', async () => {
    const fetchImpl = vi.fn(async () => json(401, { error: { message: 'expired' } }));
    await expect(saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh: async () => false }))
      .resolves.toEqual({ kind: 'rejected', message: 'Signed out. Log in again to keep saving.' });
  });

  it('maps a thrown fetch and 5xx to network', async () => {
    const thrower = vi.fn(async () => { throw new TypeError('offline'); });
    await expect(saveDraftRequest('f', content, 4, { fetchImpl: thrower, token: () => 't', refresh: async () => true }))
      .resolves.toEqual({ kind: 'network' });
    const five = vi.fn(async () => json(503, {}));
    await expect(saveDraftRequest('f', content, 4, { fetchImpl: five, token: () => 't', refresh: async () => true }))
      .resolves.toEqual({ kind: 'network' });
  });

  it('maps 400 to rejected with the server message', async () => {
    const fetchImpl = vi.fn(async () => json(400, { error: { message: 'Invalid draft' } }));
    await expect(saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh: async () => true }))
      .resolves.toEqual({ kind: 'rejected', message: 'Invalid draft' });
  });

  it('keeps saving after the access token expires mid-session: sends the refreshed token on retry', async () => {
    let current = 'old';
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new'
        ? json(200, { result: { data: { success: true, data: { revision: 9 } } } })
        : json(401, { error: { message: 'expired' } });
    });
    const refresh = vi.fn(async () => { current = 'new'; return true; });
    await expect(saveDraftRequest('f', content, 8, { fetchImpl, token: () => current, refresh }))
      .resolves.toEqual({ kind: 'saved', revision: 9 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('sends the raw tRPC input as the body', async () => {
    const fetchImpl = vi.fn(async () => json(200, { result: { data: { success: true, data: { revision: 5 } } } }));
    await saveDraftRequest('f', content, 4, { fetchImpl, token: () => 't', refresh: async () => true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/trpc\/drafts\.save$/);
    expect(JSON.parse(init.body as string)).toEqual({ formId: 'f', baseRevision: 4, content });
  });

  it('drops keepalive for bodies over the 60 000 byte cap (counted in bytes, not characters)', async () => {
    const fetchImpl = vi.fn(async () => json(200, { result: { data: { success: true, data: { revision: 5 } } } }));
    // 25 000 three-byte characters: under 60 000 UTF-16 units, over 60 000 UTF-8 bytes.
    const big = { ...content, description: '€'.repeat(25_000) };
    await saveDraftRequest('f', big, 4, { fetchImpl, token: () => 't', refresh: async () => true });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.keepalive).toBe(false);
  });
});
