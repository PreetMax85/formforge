import { useEffect, useRef, useState } from 'react';

/**
 * Delayed loading indicator — only flips to `true` after `delayMs` of
 * continuous `isLoading`. Prevents flash-of-loading-screen on fast pages.
 *
 * @param isLoading   Raw loading state from tRPC / fetch
 * @param delayMs     Milliseconds to wait before showing (default 2000)
 */
export function useDelayedLoading(isLoading: boolean, delayMs = 2000) {
  const [showLoading, setShowLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShowLoading(true), delayMs);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowLoading(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, delayMs]);

  return showLoading;
}
