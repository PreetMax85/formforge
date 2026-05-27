'use client';

import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Explore Forms', href: '/explore'  },
  { label: 'Pricing',       href: '/pricing'  },
  { label: 'API Docs',      href: process.env.NEXT_PUBLIC_API_URL
                              ? `${process.env.NEXT_PUBLIC_API_URL}/docs`
                              : '/docs',
    external: true },
] as const;

export default function Footer() {
  return (
    <footer
      style={{
        borderTop:  '1px solid #2a2a2a',
        background: '#0a0a0a',
        padding:    '64px 24px 32px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-12"
        style={{ maxWidth: '1152px', margin: '0 auto' }}
      >
        {/* ── Brand col ───────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '13px',
              fontWeight:    700,
              color:         '#d4d4d4',
              letterSpacing: '0.06em',
              marginBottom:  '12px',
            }}
          >
            FORMFORGE
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
            A form builder that respects your craft.
          </p>
        </div>

        {/* ── Product col ─────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '10px',
              color:         '#569cd6',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom:  '14px',
            }}
          >
            // Product
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRODUCT_LINKS.map((link) => {
              const isExternal = 'external' in link && link.external;
              return (
                <li key={link.label}>
                  {isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth:    '1152px',
          margin:      '48px auto 0',
          paddingTop:  '24px',
          borderTop:   '1px solid #1a1a1a',
          textAlign:   'center',
          fontFamily:  "'JetBrains Mono', monospace",
          fontSize:    '11px',
          color:       '#4b5563',
          letterSpacing: '0.04em',
        }}
      >
        &copy; 2025 FormForge
      </div>
    </footer>
  );
}
