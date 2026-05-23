let _accessToken: string | null = null;

export const setAccessToken = (t: string) => { _accessToken = t; };
export const getAccessToken = () => _accessToken;
export const clearAccessToken = () => { _accessToken = null; };

export async function initAuth(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      { method: 'POST', credentials: 'include' }
    );
    if (!res.ok) return false;
    const { data } = (await res.json()) as { data: { accessToken: string } };
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}
