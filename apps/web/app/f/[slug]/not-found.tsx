import Link from 'next/link';

/**
 * Shown when a public form link points at a slug that doesn't exist.
 * Styled like the page's "form unavailable" state rather than Next's default.
 */
export default function PublicFormNotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 min-h-screen px-6 text-center"
      style={{ background: '#1e1e1e', fontFamily: "'JetBrains Mono', monospace" }}
    >
      <p style={{ fontSize: '14px', color: '#9ca3af' }}>
        This form doesn&apos;t exist. Check the link, or ask whoever shared it.
      </p>
      <Link href="/" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'underline' }}>
        Go to FormForge
      </Link>
    </div>
  );
}
