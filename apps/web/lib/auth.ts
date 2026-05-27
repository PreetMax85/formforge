let _accessToken: string | null = null;
let _refreshPromise: Promise<boolean> | null = null;

export const setAccessToken = (t: string) => { _accessToken = t; };
export const getAccessToken = () => _accessToken;
export const clearAccessToken = () => { _accessToken = null; };

async function fetchWithRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, opts);
      if (res.ok) return res;
      if (res.status >= 500 && i < retries - 1) throw new Error('Server error');
      return res;
    } catch {
      if (i === retries - 1) throw new Error('Max retries exceeded');
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Refresh the access token using the HTTP-only refresh cookie.
 * Promise-deduplicated: concurrent calls share the same in-flight request
 * so React Strict Mode double-mounts cannot rotate the token twice.
 */
export async function initAuth(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/trpc/auth.refresh`;
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "0": { json: null } }),
        credentials: 'include',
      });
      if (!res.ok) return false;
      const json = await res.json() as unknown;
      // Defensive parse: tRPC may return a single object or a batch array
      const result = (Array.isArray(json) ? (json as Array<unknown>)[0] : json) as {
        result?: { data?: { success?: boolean; data?: { accessToken: string } } };
      } | undefined;
      const token = result?.result?.data?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}
