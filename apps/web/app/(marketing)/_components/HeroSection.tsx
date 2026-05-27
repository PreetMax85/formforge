'use client';

import Link from 'next/link';
import { Type, ListChecks, Star, Terminal, Layers } from 'lucide-react';

const HERO_STATS = [
  { value: '750+',   label: 'responses seeded' },
  { value: '10',     label: 'field types'       },
  { value: '< 60s',  label: 'to publish a form' },
] as const;

/* ── Mockup field cards inside the hero visual ───────────────────── */
const MOCK_FIELDS = [
  { type: 'short_text',    label: 'Your warrior name',       color: '#569cd6', icon: Type        },
  { type: 'single_select', label: 'Chosen fighting style',   color: '#4ec9b0', icon: ListChecks  },
  { type: 'rating',        label: 'Sword proficiency',       color: '#ff9800', icon: Star        },
] as const;

export default function HeroSection() {
  return (
    <section
      style={{
        background: '#0e0e0e',
        padding:    '96px 24px 64px',
        position:   'relative',
        overflow:   'hidden',
      }}
    >
      {/* Ambient glow behind the mockup */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top:      '20%',
          right:    '-8%',
          width:    '480px',
          height:   '480px',
          background: 'radial-gradient(circle, rgba(86,156,214,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
        style={{ maxWidth: '1152px', margin: '0 auto', alignItems: 'center', position: 'relative' }}
      >
        {/* ── Copy column ─────────────────────────────────────── */}
        <div>
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
            // The Game Engine for Forms
          </p>

          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize:   'clamp(40px, 6vw, 72px)',
              fontWeight: 700,
              color:      '#d4d4d4',
              lineHeight: 1.05,
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}
          >
            Forms deserve
            <br />
            better tooling.
            <span
              aria-hidden
              style={{
                display:        'inline-block',
                width:          '4px',
                height:         '0.85em',
                background:     '#569cd6',
                marginLeft:     '6px',
                verticalAlign:  '-12%',
                animation:      'cursor-blink 1s steps(2, start) infinite',
              }}
            />
          </h1>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '17px',
              color:      '#9ca3af',
              lineHeight: 1.6,
              maxWidth:   '480px',
              marginBottom: '36px',
            }}
          >
            You already use a game engine to build worlds.
            Why are you still building forms in a spreadsheet clone?
          </p>

          {/* Stats row */}
          <div
            className="flex items-center gap-6"
            style={{ marginBottom: '36px' }}
          >
            {HERO_STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize:   '22px',
                      fontWeight: 600,
                      color:      '#d4d4d4',
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize:   '11px',
                      color:      '#6b7280',
                      marginTop:  '4px',
                    }}
                  >
                    {s.label}
                  </p>
                </div>
                {i < HERO_STATS.length - 1 && (
                  <div style={{ width: '1px', height: '32px', background: '#2a2a2a' }} />
                )}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              style={{
                fontFamily:     "'Inter', sans-serif",
                fontSize:       '14px',
                fontWeight:     600,
                background:     '#569cd6',
                color:           '#0e0e0e',
                padding:        '12px 22px',
                textDecoration:  'none',
                border:          '1px solid #569cd6',
                letterSpacing:  '0.01em',
                transition:     'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Start Building — it&apos;s free
            </Link>

            <Link
              href="/f/samurai-oath"
              style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '14px',
                background:    'transparent',
                color:         '#9ca3af',
                padding:       '12px 22px',
                textDecoration:'none',
                border:        '1px solid #3c3c3c',
                transition:    'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5c5c5c';
                e.currentTarget.style.color = '#d4d4d4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3c3c3c';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              See a live form ↗
            </Link>
          </div>
        </div>

        {/* ── Mockup column ───────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            transform: 'rotate(-1deg)',
            position:  'relative',
          }}
        >
          <div
            style={{
              background:   '#1e1e1e',
              border:       '1px solid #3c3c3c',
              boxShadow:    '0 10px 60px rgba(86,156,214,0.15), 0 4px 20px rgba(0,0,0,0.6)',
              fontFamily:   "'JetBrains Mono', monospace",
              fontSize:     '11px',
              color:        '#d4d4d4',
              overflow:     'hidden',
            }}
          >
            {/* Menubar */}
            <div
              className="flex items-center justify-between"
              style={{
                height:       '28px',
                background:   '#252526',
                borderBottom: '1px solid #3c3c3c',
                padding:      '0 10px',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#569cd6', fontWeight: 600 }}>FORMFORGE</span>
                <span style={{ color: '#3c3c3c' }}>›</span>
                <span style={{ color: '#9ca3af' }}>samurai-oath</span>
                <span style={{ color: '#3c3c3c' }}>›</span>
                <span style={{ color: '#d4d4d4' }}>Builder</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#4ec9b0', fontSize: '10px', border: '1px solid #3c3c3c', padding: '1px 6px' }}>▶ PLAY</span>
                <span style={{ background: '#569cd6', color: '#0e0e0e', fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}>⚡ PUBLISH</span>
              </div>
            </div>

            {/* Body: 3-pane layout */}
            <div className="grid" style={{ gridTemplateColumns: '120px 1fr 140px', minHeight: '240px' }}>
              {/* Hierarchy */}
              <div style={{ background: '#252526', borderRight: '1px solid #3c3c3c', padding: '8px 6px' }}>
                <p style={{ color: '#6b7280', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '8px' }}>HIERARCHY</p>
                <div className="flex items-center gap-1" style={{ color: '#569cd6', marginBottom: '4px' }}>
                  <Layers size={9} /> samurai-oath
                </div>
                <div className="flex items-center gap-1" style={{ color: '#6b7280', marginBottom: '4px', paddingLeft: '12px' }}>
                  jjk-sorcerer
                </div>
                <div className="flex items-center gap-1" style={{ color: '#6b7280', paddingLeft: '12px' }}>
                  aujla-vip
                </div>
              </div>

              {/* Canvas */}
              <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOCK_FIELDS.map((f) => (
                  <div
                    key={f.type}
                    className="flex items-center gap-2"
                    style={{
                      background:   '#252526',
                      borderLeft:   `3px solid ${f.color}`,
                      padding:      '8px 10px',
                      fontSize:     '11px',
                    }}
                  >
                    <f.icon size={11} style={{ color: f.color }} />
                    <span style={{ color: '#d4d4d4' }}>{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Inspector */}
              <div style={{ background: '#252526', borderLeft: '1px solid #3c3c3c', padding: '8px 8px' }}>
                <p style={{ color: '#6b7280', fontSize: '9px', letterSpacing: '0.12em', marginBottom: '8px' }}>INSPECTOR</p>
                <p style={{ color: '#6b7280', fontSize: '9px', marginBottom: '2px' }}>LABEL</p>
                <p style={{ color: '#d4d4d4', fontSize: '10px', marginBottom: '8px' }}>Your warrior name</p>
                <p style={{ color: '#6b7280', fontSize: '9px', marginBottom: '2px' }}>REQUIRED</p>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: '20px', height: '10px', background: '#569cd6' }} />
                  <span style={{ color: '#d4d4d4', fontSize: '10px' }}>Yes</span>
                </div>
              </div>
            </div>

            {/* Console */}
            <div
              style={{
                background:   '#1e1e1e',
                borderTop:    '1px solid #3c3c3c',
                padding:      '6px 10px',
                fontSize:     '10px',
              }}
            >
              <div className="flex items-center gap-2">
                <Terminal size={10} style={{ color: '#4fc3f7' }} />
                <span style={{ color: '#4fc3f7' }}>[INFO]</span>
                <span style={{ color: '#6b7280' }}>2s ago</span>
                <span style={{ color: '#9ca3af' }}>New response on &quot;samurai-oath&quot;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
