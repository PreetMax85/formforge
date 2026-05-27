'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ThemeCard {
  slug:        string;
  badge:       string;
  title:       string;
  description: string;
  responses:   number;
  accent:      string;
  bg:          string;
  textColor:   string;
  swatches:    readonly string[];
}

const THEMES: readonly ThemeCard[] = [
  {
    slug:        'samurai-oath',
    badge:       'Ghost of Tsushima',
    title:       'The Samurai Oath',
    description: 'Which path do you walk — honor or survival? 200 warriors have answered.',
    responses:   200,
    accent:      '#C68B9D',
    bg:          '#1C1C1C',
    textColor:   '#EBE8E8',
    swatches:    ['#1C1C1C', '#C68B9D', '#EBE8E8'],
  },
  {
    slug:        'jjk-sorcerer-registration',
    badge:       'Jujutsu Kaisen',
    title:       'Sorcerer Registration',
    description: 'Declare your cursed technique. Sign the binding vow. 250 sorcerers enrolled.',
    responses:   250,
    accent:      '#7c3aed',
    bg:          '#0d0b1a',
    textColor:   '#e8e0ff',
    swatches:    ['#0d0b1a', '#7c3aed', '#e8e0ff'],
  },
  {
    slug:        'aujla-vip-backstage',
    badge:       'Karan Aujla Concert',
    title:       'VIP Backstage Pass',
    description: 'One night. One stage. Which song hits different? 300 fans have spoken.',
    responses:   300,
    accent:      '#f59e0b',
    bg:          '#1a0f00',
    textColor:   '#fef3c7',
    swatches:    ['#1a0f00', '#f59e0b', '#fef3c7'],
  },
];

export default function ThemesSection() {
  return (
    <section
      style={{
        background: '#0e0e0e',
        padding:    '96px 24px',
      }}
    >
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        <p
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#569cd6',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom:  '16px',
          }}
        >
          // Live forms
        </p>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize:   'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color:      '#d4d4d4',
            lineHeight: 1.15,
            marginBottom: '56px',
            letterSpacing: '-0.01em',
            maxWidth:   '640px',
          }}
        >
          Three forms. Three worlds.
          <br />
          <em style={{ fontStyle: 'italic', color: '#9ca3af' }}>Zero login required.</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '16px' }}>
          {THEMES.map((t) => (
            <Link
              key={t.slug}
              href={`/f/${t.slug}`}
              style={{
                textDecoration: 'none',
                display:        'block',
                background:     t.bg,
                border:         `1px solid ${t.accent}30`,
                padding:        '28px 24px',
                transition:     'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${t.accent}80`;
                e.currentTarget.style.transform   = 'translateY(-3px)';
                e.currentTarget.style.boxShadow   = `0 10px 30px ${t.accent}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${t.accent}30`;
                e.currentTarget.style.transform   = 'translateY(0)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
            >
              {/* Badge */}
              <span
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '10px',
                  color:         t.accent,
                  background:    `${t.accent}18`,
                  border:        `1px solid ${t.accent}40`,
                  padding:       '2px 8px',
                  letterSpacing: '0.06em',
                  display:       'inline-block',
                  marginBottom:  '20px',
                }}
              >
                {t.badge}
              </span>

              {/* Title */}
              <h3
                style={{
                  fontFamily:   "'Space Grotesk', sans-serif",
                  fontSize:     '22px',
                  fontWeight:   700,
                  color:        t.textColor,
                  marginBottom: '10px',
                  lineHeight:   1.2,
                }}
              >
                {t.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily:   "'Inter', sans-serif",
                  fontSize:     '13px',
                  color:        t.textColor,
                  opacity:      0.7,
                  lineHeight:   1.55,
                  marginBottom: '20px',
                  minHeight:    '60px',
                }}
              >
                {t.description}
              </p>

              {/* Swatches + LIVE indicator */}
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div className="flex gap-1">
                  {t.swatches.map((swatch) => (
                    <span
                      key={swatch}
                      style={{
                        display:     'inline-block',
                        width:       '14px',
                        height:      '14px',
                        background:  swatch,
                        border:      '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    style={{
                      display:    'inline-block',
                      width:      '6px',
                      height:     '6px',
                      background: '#4caf50',
                      borderRadius: '50%',
                      animation:  'pulse-live 1.4s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontFamily:    "'JetBrains Mono', monospace",
                      fontSize:      '10px',
                      color:         t.textColor,
                      opacity:       0.7,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {t.responses} responses
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div
                className="flex items-center gap-1"
                style={{
                  fontFamily:    "'JetBrains Mono', monospace",
                  fontSize:      '12px',
                  color:         t.accent,
                  letterSpacing: '0.06em',
                  paddingTop:    '14px',
                  borderTop:     `1px solid ${t.accent}20`,
                }}
              >
                Fill this form
                <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>

        <p
          style={{
            textAlign:  'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '11px',
            color:      '#4b5563',
            marginTop:  '40px',
            maxWidth:   '500px',
            margin:     '40px auto 0',
            lineHeight: 1.6,
          }}
        >
          These are real forms with real seeded data.
          The analytics dashboard has actual charts.
        </p>
      </div>
    </section>
  );
}
