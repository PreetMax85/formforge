'use client';

import { useEffect, useRef } from 'react';
import { API_URL } from '~/lib/api-url';

/**
 * Records one view of a public form, from the visitor's browser.
 *
 * This used to be a server-side fetch in page.tsx. From the server, every view
 * came from the same IP, so all visitors shared one viewLimiter bucket, and a
 * fire-and-forget request can be cut off once a serverless response is sent.
 * It also means bots that don't run JavaScript no longer count as views.
 */
export default function ViewCounter({ slug }: { slug: string }) {
  // React Strict Mode runs effects twice in development; count once.
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void fetch(`${API_URL}/api/v1/forms/${encodeURIComponent(slug)}/view`, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({}),
      keepalive: true,
    }).catch(() => {
      // Non-critical — a missed view only affects analytics.
    });
  }, [slug]);

  return null;
}
