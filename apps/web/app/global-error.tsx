'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — catches React render errors that error.tsx
 * cannot, including errors in the root layout. Reports to Sentry.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: '32px', background: '#0e0e0e', color: '#d4d4d4', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', marginBottom: '8px' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          {error?.message ?? 'Unexpected error'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            background: '#569cd6',
            color: '#0e0e0e',
            border: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
