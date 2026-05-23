import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token');

  if (!refreshToken) redirect('/login');

  return <>{children}</>;
}
