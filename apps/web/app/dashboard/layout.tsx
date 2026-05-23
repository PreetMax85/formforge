import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token');

  if (!refreshToken) {
    redirect('/login');
  }

  // Forward cookies to API to validate the refresh token
  try {
    const res = await fetch(`${API_URL}/trpc/auth.refresh`, {
      method: 'GET',
      headers: {
        Cookie: `refresh_token=${refreshToken.value}`,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      redirect('/login');
    }
  } catch {
    redirect('/login');
  }

  return <>{children}</>;
}
