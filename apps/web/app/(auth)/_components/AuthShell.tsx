'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthShellProps {
  readonly title:    string;    // e.g. "FormForge.Auth.Login"
  readonly children: ReactNode; // form fields
  readonly footer:   ReactNode; // bottom link row
}

// ─── Static mockup data (deterministic — no Math.random) ────────────────────

const MOCK_FORMS = [
  { slug: 'samurai-oath',        active: true  },
  { slug: 'jjk-sorcerer',       active: false },
  { slug: 'aujla-vip-backstage', active: false },
] as const;

const MOCK_FIELDS = [
  { label: 'Your warrior name',     type: 'short_text',    accent: '#569cd6' },
  { label: 'Chosen fighting style', type: 'single_select', accent: '#4ec9b0' },
  { label: 'Rate your proficiency', type: 'rating',        accent: '#ff9800' },
] as const;

const MOCK_PROPS = [
  { key: 'type',        val: 'short_text',    color: '#4ec9b0' },
  { key: 'required',    val: 'true',          color: '#569cd6' },
  { key: 'minLength',   val: '2',             color: '#b5cea8' },
  { key: 'placeholder', val: '"Enter name…"', color: '#ce9178' },
] as const;

const MOCK_LOGS = [
  { level: 'INFO',    col: '#4fc3f7', time: '2s', msg: 'New response: samurai-oath (respondent: "Arjun")' },
  { level: 'SUCCESS', col: '#66bb6a', time: '1m', msg: "Form 'samurai-oath' published — visibility: public" },
] as const;

// ─── Builder mockup — decorative, aria-hidden ────────────────────────────────

/**
 * Atmospheric CSS-only simulation of the Game Engine Inspector.
 * Rendered at low opacity behind the auth form on desktop.
 * No interaction, no JS, no cost.
 */
function BuilderMockup() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:         0,
        opacity:       0.3,
        overflow:      'hidden',
        pointerEvents: 'none',
        userSelect:    'none',
        display:       'flex',
        flexDirection: 'column',
        fontFamily:    'var(--font-mono)',
        fontSize:      '11px',
      }}
    >
      {/* ── Menubar ───────────────────────────────────────────────────── */}
      <div style={{
        height:       '28px',
        flexShrink:   0,
        background:   '#1e1e1e',
        borderBottom: '1px solid #3c3c3c',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 14px',
        gap:          '18px',
        color:        '#9ca3af',
      }}>
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '13px',
          fontWeight:    700,
          color:         '#d4d4d4',
          letterSpacing: '-0.01em',
        }}>
          FORMFORGE
        </span>
        {(['File', 'Edit', 'View', 'Build', 'Help'] as const).map(item => (
          <span key={item}>{item}</span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '10px' }}>
          <span style={{ color: '#66bb6a' }}>▶ PLAY</span>
          <span style={{ color: '#ff9800' }}>⚡ PUBLISH</span>
        </div>
      </div>

      {/* ── Panels row ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Hierarchy panel */}
        <div style={{
          width:       '178px',
          flexShrink:  0,
          background:  '#252526',
          borderRight: '1px solid #3c3c3c',
          padding:     '8px 0',
        }}>
          <div style={{ padding: '2px 12px 6px', fontSize: '9px', color: '#9ca3af', letterSpacing: '0.1em' }}>
            PROJECT HIERARCHY
          </div>
          <div style={{ padding: '3px 12px', color: '#9ca3af' }}>
            <span style={{ marginRight: '6px' }}>▾</span>My Forms
          </div>
          {MOCK_FORMS.map(f => (
            <div key={f.slug} style={{
              padding:    '3px 12px 3px 28px',
              color:      f.active ? '#d4d4d4' : '#9ca3af',
              background: f.active ? '#094771' : 'transparent',
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
            }}>
              <span style={{ color: '#4caf50', fontSize: '7px' }}>●</span>
              {f.slug}
            </div>
          ))}
        </div>

        {/* Scene / canvas */}
        <div style={{
          flex:          1,
          background:    '#1e1e1e',
          padding:       '12px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          overflow:      'hidden',
        }}>
          <div style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '0.1em', marginBottom: '2px' }}>
            SCENE: samurai-oath
          </div>
          {MOCK_FIELDS.map((field, i) => (
            <div key={i} style={{
              background:     '#252526',
              border:         '1px solid #3c3c3c',
              borderLeft:     `3px solid ${field.accent}`,
              padding:        '8px 12px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#d4d4d4' }}>{field.label}</span>
              <span style={{
                fontSize:   '9px',
                color:      '#9ca3af',
                background: '#1e1e1e',
                padding:    '2px 6px',
                border:     '1px solid #3c3c3c',
              }}>
                {field.type}
              </span>
            </div>
          ))}
        </div>

        {/* Inspector panel */}
        <div style={{
          width:      '192px',
          flexShrink: 0,
          background: '#252526',
          borderLeft: '1px solid #3c3c3c',
          padding:    '8px 0',
        }}>
          <div style={{ padding: '2px 12px 6px', fontSize: '9px', color: '#9ca3af', letterSpacing: '0.1em' }}>
            INSPECTOR
          </div>
          {MOCK_PROPS.map((prop, i) => (
            <div key={i} style={{
              padding:        '4px 12px',
              display:        'flex',
              justifyContent: 'space-between',
              background:     i % 2 === 0 ? '#1e1e1e' : '#252526',
            }}>
              <span style={{ color: '#9ca3af' }}>{prop.key}</span>
              <span style={{ color: prop.color }}>{prop.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Console ──────────────────────────────────────────────────── */}
      <div style={{
        height:     '68px',
        flexShrink: 0,
        background: '#1e1e1e',
        borderTop:  '1px solid #3c3c3c',
        padding:    '6px 12px',
        fontSize:   '10px',
      }}>
        <div style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '0.1em', marginBottom: '5px' }}>
          CONSOLE
        </div>
        {MOCK_LOGS.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px', overflow: 'hidden' }}>
            <span style={{ color: log.col, flexShrink: 0 }}>[{log.level}]</span>
            <span style={{ color: '#4b5563', flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {log.msg}
            </span>
          </div>
        ))}
      </div>

      {/* ── Gradient: mockup visible left, fades out before form panel ── */}
      <div style={{
        position:      'absolute',
        inset:         0,
        background:    'linear-gradient(to right, transparent 22%, #080808 68%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Corner bracket accents ──────────────────────────────────────────────────

/**
 * Four small L-shaped brackets in accent blue (#569cd6) at each corner of the
 * inspector panel — Unity inspector aesthetic, pure CSS.
 */
function CornerBrackets() {
  const base = { position: 'absolute' as const, width: '14px', height: '14px' };
  const line = '2px solid #569cd6';
  return (
    <>
      <div style={{ ...base, top: -1, left:  -1, borderTop:    line, borderLeft:  line }} />
      <div style={{ ...base, top: -1, right: -1, borderTop:    line, borderRight: line }} />
      <div style={{ ...base, bottom: -1, left:  -1, borderBottom: line, borderLeft:  line }} />
      <div style={{ ...base, bottom: -1, right: -1, borderBottom: line, borderRight: line }} />
    </>
  );
}

// ─── AuthShell ───────────────────────────────────────────────────────────────

/**
 * Shared visual wrapper for /login and /signup.
 *
 * Desktop: Game Engine Inspector mockup bleeds in from the left at low opacity,
 *          fading into the dark background where the form panel sits on the right.
 * Mobile:  Mockup hidden, form panel centred full-width.
 *
 * All auth logic (mutations, handlers, state) lives in the page components —
 * AuthShell is presentation only.
 */
export default function AuthShell({ title, children, footer }: AuthShellProps) {
  return (
    <>
      {/* Responsive: hide mockup on narrow screens */}
      <style>{`
        @media (max-width: 767px) {
          .auth-mockup { display: none !important; }
          .auth-panel  { margin-right: auto !important; margin-left: auto !important; }
        }
      `}</style>

      {/* Full-viewport container */}
      <div style={{
        position:        'fixed',
        inset:           0,
        background:      '#080808',
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize:  '32px 32px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'flex-end',
        overflow:        'hidden',
      }}>

        {/* Builder mockup — full bleed background, desktop only */}
        <div className="auth-mockup" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <BuilderMockup />
        </div>

        {/* Form panel — slides in from right on mount */}
        <motion.div
          className="auth-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.48, ease: 'easeOut' }}
          style={{
            position:      'relative',
            zIndex:        10,
            width:         '100%',
            maxWidth:      '440px',
            marginRight:   '7vw',
            display:       'flex',
            flexDirection: 'column',
            gap:           '14px',
          }}
        >
          {/* FORMFORGE wordmark — links back to landing */}
          <Link
            href="/"
            style={{
              fontFamily:     'var(--font-display)',
              fontSize:       '18px',
              fontWeight:     700,
              color:          '#d4d4d4',
              letterSpacing:  '-0.02em',
              textDecoration: 'none',
              display:        'block',
            }}
          >
            FORMFORGE
          </Link>

          {/* Inspector panel — position: relative for corner brackets */}
          <div style={{ position: 'relative', border: '1px solid #3c3c3c', background: '#0e0e0e' }}>
            <CornerBrackets />

            {/* Panel header */}
            <div style={{
              background:     '#1e1e1e',
              borderBottom:   '1px solid #3c3c3c',
              padding:        '10px 16px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '9px',
                  color:         '#9ca3af',
                  letterSpacing: '0.1em',
                  marginBottom:  '3px',
                }}>
                  INSPECTOR
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#569cd6' }}>
                  {title}
                </div>
              </div>

              {/* Live indicator — reuses pulse-live keyframe from globals.css */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   '#4caf50',
                  display:      'inline-block',
                  animation:    'pulse-live 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '9px',
                  color:         '#4caf50',
                  letterSpacing: '0.08em',
                }}>
                  LIVE
                </span>
              </div>
            </div>

            {/* Form content area */}
            <div style={{ padding: '24px 20px' }}>
              {children}
            </div>

            {/* Footer row */}
            <div style={{
              borderTop:      '1px solid #2a2a2a',
              padding:        '13px 20px',
              background:     '#0a0a0a',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
            }}>
              {footer}
            </div>
          </div>

          {/* Engine version tag */}
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '10px',
            color:         '#242424',
            letterSpacing: '0.08em',
          }}>
            FORMFORGE ENGINE v1.0.0 — ChaiCode Hackathon 2025
          </div>
        </motion.div>
      </div>
    </>
  );
}