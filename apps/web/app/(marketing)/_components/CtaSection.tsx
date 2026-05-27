'use client';

import Link from 'next/link';

export default function CtaSection() {
  return (
    <section
      style={{
        background: '#141414',
        borderTop:  '1px solid #2a2a2a',
        padding:    '88px 24px',
        textAlign:  'center',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize:   'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color:      '#d4d4d4',
            lineHeight: 1.15,
            marginBottom: '14px',
            letterSpacing: '-0.01em',
          }}
        >
          Your forms are embarrassing you.
        </h2>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '17px',
            color:      '#9ca3af',
            lineHeight: 1.5,
            marginBottom: '36px',
          }}
        >
          Fix that in sixty seconds.
        </p>

        <Link
          href="/signup"
          style={{
            display:        'inline-block',
            fontFamily:     "'Inter', sans-serif",
            fontSize:       '15px',
            fontWeight:     600,
            background:     '#569cd6',
            color:          '#0e0e0e',
            padding:        '14px 32px',
            textDecoration: 'none',
            border:         '1px solid #569cd6',
            transition:     'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Open the Builder →
        </Link>

        <p
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#4b5563',
            marginTop:     '24px',
            letterSpacing: '0.04em',
          }}
        >
          No credit card. No onboarding flow. No sales call.
        </p>
      </div>
    </section>
  );
}
