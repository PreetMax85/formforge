import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardAuthGate from './DashboardAuthGate';
import { SERVER_API_URL } from '~/lib/api-url';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token');

  if (!refreshToken) {
    redirect('/login');
  }

  // Validate session without rotating the refresh token.
  // auth.validate does not revoke or create new cookies — safe for SSR.
  try {
    const res = await fetch(`${SERVER_API_URL}/trpc/auth.validate`, {
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

  return <DashboardAuthGate>{children}</DashboardAuthGate>;
}
