import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token');

  if (!refreshToken) redirect('/login');

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    });

    if (!res.ok) redirect('/login');
  } catch {
    redirect('/login');
  }

  return <>{children}</>;
}
