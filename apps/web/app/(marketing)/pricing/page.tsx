'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

// Metadata kept in the marketing layout / root — this page is interactive
// (hover handlers on plan CTAs) so it must be a client component, and
// `export const metadata` isn't allowed in client components.

const PLANS = [
  {
    name:        'Free',
    price:       '$0',
    period:      'forever',
    badge:       null,
    highlighted: false,
    description: 'For people trying things out.',
    features: [
      '3 active forms',
      '100 responses / month',
      'All 10 field types',
      'Public and unlisted forms',
      'Basic analytics',
      'QR code sharing',
    ],
    cta: { label: 'Start for free',   href: '/signup'           },
  },
  {
    name:        'Pro',
    price:       '$12',
    period:      '/ month',
    badge:       'Most Popular',
    highlighted: true,
    description: 'For builders who are serious.',
    features: [
      'Unlimited forms',
      '10,000 responses / month',
      'Advanced analytics + health score',
      'Conditional logic',
      'All themes',
      'CSV export',
      'Email notifications',
      'Custom form slugs',
      'Form clone and archive',
    ],
    cta: { label: 'Start free trial', href: '/signup?plan=pro'  },
  },
  {
    name:        'Business',
    price:       '$49',
    period:      '/ month',
    badge:       null,
    highlighted: false,
    description: 'For teams collecting at scale.',
    features: [
      'Everything in Pro',
      'Unlimited responses',
      'Admin dashboard',
      'Priority support',
      'API access via Scalar docs',
      'Password-protected forms',
      'Response filtering',
      'Custom thank-you pages',
    ],
    cta: { label: 'Contact sales',    href: '/signup'           },
  },
] as const;

export default function PricingPage() {
  return (
    <main
      style={{
        background:  '#0e0e0e',
        color:       '#d4d4d4',
        minHeight:   '100vh',
        paddingTop:  '56px', // navbar offset
      }}
    >
      {/* ── Nav spacer ─────────────────────────────────────────── */}
      <div style={{ height: '80px' }} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '11px',
              color:         '#569cd6',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom:  '20px',
            }}
          >
            // Pricing
          </p>
          <h1
            style={{
              fontFamily:   "'Space Grotesk', sans-serif",
              fontSize:     'clamp(32px, 5vw, 52px)',
              fontWeight:   700,
              color:        '#d4d4d4',
              lineHeight:   1.1,
              marginBottom: '20px',
            }}
          >
            Pay for what you use.
            <br />
            Stop when you want.
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '16px',
              color:      '#9ca3af',
              lineHeight: 1.65,
            }}
          >
            All plans include public and unlisted forms, 10 field types, and real
            analytics. No paywalled basics.
          </p>
        </div>
      </section>

      {/* ── Plans grid ─────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            maxWidth: '1000px',
            margin:   '0 auto',
            gap:      '0',
            border:   '1px solid #2a2a2a',
          }}
        >
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              style={{
                background:  plan.highlighted ? '#0d1117' : '#141414',
                borderRight: i < PLANS.length - 1 ? '1px solid #2a2a2a' : 'none',
                border:      plan.highlighted ? '1px solid #569cd6' : undefined,
                padding:     '40px 32px',
                position:    'relative',
                marginTop:   plan.highlighted ? '-1px' : '0',
                marginBottom:plan.highlighted ? '-1px' : '0',
                zIndex:      plan.highlighted ? 1 : 0,
              }}
            >
              {/* Most Popular badge */}
              {plan.badge && (
                <div
                  style={{
                    position:      'absolute',
                    top:           '-1px',
                    left:          '50%',
                    transform:     'translateX(-50%)',
                    background:    '#569cd6',
                    color:         '#0e0e0e',
                    fontFamily:    "'JetBrains Mono', monospace",
                    fontSize:      '10px',
                    fontWeight:    700,
                    padding:       '3px 12px',
                    letterSpacing: '0.06em',
                    whiteSpace:    'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <p
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '11px',
                  color:         '#6b7280',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom:  '12px',
                  marginTop:     plan.badge ? '20px' : '0',
                }}
              >
                {plan.name}
              </p>

              {/* Price */}
              <div className="flex items-end gap-2" style={{ marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize:   '44px',
                    fontWeight: 700,
                    color:      '#d4d4d4',
                    lineHeight: 1,
                  }}
                >
                  {plan.price}
                </span>
                <span
                  style={{
                    fontFamily:   "'Inter', sans-serif",
                    fontSize:     '14px',
                    color:        '#6b7280',
                    paddingBottom:'6px',
                  }}
                >
                  {plan.period}
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily:   "'Inter', sans-serif",
                  fontSize:     '14px',
                  color:        '#6b7280',
                  marginBottom: '28px',
                }}
              >
                {plan.description}
              </p>

              {/* CTA */}
              <Link
                href={plan.cta.href}
                style={{
                  display:       'block',
                  textAlign:     'center',
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '14px',
                  fontWeight:    600,
                  textDecoration:'none',
                  padding:       '10px 0',
                  marginBottom:  '28px',
                  background:    plan.highlighted ? '#569cd6' : 'transparent',
                  border:        `1px solid ${plan.highlighted ? '#569cd6' : '#3c3c3c'}`,
                  color:         plan.highlighted ? '#0e0e0e' : '#9ca3af',
                  transition:    'opacity 0.15s, border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  if (plan.highlighted) {
                    el.style.opacity = '0.88';
                  } else {
                    el.style.borderColor = '#5c5c5c';
                    el.style.color = '#d4d4d4';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.opacity = '1';
                  if (!plan.highlighted) {
                    el.style.borderColor = '#3c3c3c';
                    el.style.color = '#9ca3af';
                  }
                }}
              >
                {plan.cta.label}
              </Link>

              {/* Divider */}
              <div style={{ height: '1px', background: '#2a2a2a', marginBottom: '24px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3"
                    style={{ marginBottom: '10px' }}
                  >
                    <Check
                      size={13}
                      style={{
                        color:     plan.highlighted ? '#569cd6' : '#4ec9b0',
                        flexShrink:0,
                        marginTop: '3px',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize:   '13px',
                        color:      '#9ca3af',
                        lineHeight: 1.5,
                      }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p
          style={{
            textAlign:  'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '11px',
            color:      '#374151',
            marginTop:  '32px',
            maxWidth:   '600px',
            margin:     '32px auto 0',
          }}
        >
          Real payment integration not included in this demo.
          This is a hackathon submission — but the plans are real if we ship.
        </p>
      </section>
    </main>
  );
}