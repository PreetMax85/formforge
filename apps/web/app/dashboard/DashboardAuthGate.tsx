'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '~/components/shared/LoadingScreen';
import { initAuth } from '~/lib/auth';

interface DashboardAuthGateProps {
  children: ReactNode;
}

/**
 * Restores the in-memory access token before dashboard children mount.
 * This keeps deep-linked dashboard routes from firing protected queries too early.
 */
export default function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    void initAuth().then((ok) => {
      if (!isActive) return;
      if (!ok) {
        router.replace('/login');
        return;
      }
      setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!isReady) {
    return <LoadingScreen variant="fullscreen" message="Opening dashboard..." />;
  }

  return children;
}
