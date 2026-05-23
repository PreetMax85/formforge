let _accessToken: string | null = null;

export const setAccessToken = (t: string) => { _accessToken = t; };
export const getAccessToken = () => _accessToken;
export const clearAccessToken = () => { _accessToken = null; };

export async function initAuth(): Promise<boolean> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/trpc/auth.refresh?input=${encodeURIComponent(JSON.stringify({ "0": { json: null } }))}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const json = await res.json() as {
      result?: { data?: { success?: boolean; data?: { accessToken: string } } };
    };
    const token = json.result?.data?.data?.accessToken;
    if (token) {
      setAccessToken(token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
