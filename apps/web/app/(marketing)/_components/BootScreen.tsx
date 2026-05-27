'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface BootLineData {
  readonly id:     number;
  readonly text:   string;
  readonly delay:  number;
  readonly isLast?: boolean;
}

const BOOT_LINE_POOL: readonly string[] = [
  'Forging the workspace',
  'Spinning up the builder',
  'Priming the engine',
  'Mounting the inspector',
  'Unpacking the field types',
  'Warming up the terminal',
  'Polishing the pixels',
  'Loading the arena',
  'Calibrating the drag system',
  'Seeding the database',
  'Waking',
] as const;

const LINE_DELAYS: readonly number[] = [380, 730, 1110, 1500, 1860];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

function pickBootLines(): BootLineData[] {
  const selected = shuffle(BOOT_LINE_POOL).slice(0, 5);
  return [
    ...selected.map((text, i) => ({
      id: i,
      text,
      delay: LINE_DELAYS[i] as number,
    })),
    { id: 5, text: 'Scene ready', delay: 2200, isLast: true },
  ];
}

const PROMPT_DELAY = 2540;
const AUTO_DISMISS = 3900;
const EXIT_MS      = 650;

/**
 * Full-screen boot sequence overlay shown once per browser session.
 *
 * - Space Grotesk  (--font-display) for the FORMFORGE title
 * - JetBrains Mono (--font-mono)    for terminal lines
 * - framer-motion handles the fade-out exit
 * - Dismissed by keypress, click, or auto-timeout at ~3.9 s
 * - sessionStorage prevents re-showing on the same tab session
 */
export default function BootScreen(): React.JSX.Element | null {
  const [isVisible,    setIsVisible]    = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [linesShown,   setLinesShown]   = useState(0);
  const [checksShown,  setChecksShown]  = useState(0);
  const [showPrompt,   setShowPrompt]   = useState(false);
  const dismissedRef = useRef(false);
  const bootLines = useMemo(() => pickBootLines(), []);

  /** Triggers the fade-out animation then removes the overlay from the DOM. */
  const dismiss = useCallback((): void => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsDismissing(true);
    setTimeout(() => {
      try { sessionStorage.setItem('formforge-intro-seen', 'true'); } catch { /* noop */ }
      setIsVisible(false);
    }, EXIT_MS);
  }, []);

  // On mount: check sessionStorage, schedule all line reveals
  useEffect(() => {
    try {
      if (sessionStorage.getItem('formforge-intro-seen')) return;
    } catch {
      // sessionStorage blocked (private browsing etc.) — skip boot screen
      return;
    }

    setIsVisible(true);
    const timers: ReturnType<typeof setTimeout>[] = [];

    bootLines.forEach((line, i) => {
      // Reveal line text
      timers.push(setTimeout(() => setLinesShown(i + 1), line.delay));
      // Reveal checkmark 200 ms after the line (not for "Scene ready")
      if (!line.isLast) {
        timers.push(setTimeout(() => setChecksShown(i + 1), line.delay + 210));
      }
    });

    timers.push(setTimeout(() => setShowPrompt(true), PROMPT_DELAY));
    timers.push(setTimeout(() => dismiss(), AUTO_DISMISS));

    return () => timers.forEach(clearTimeout);
  }, [dismiss]);

  // Attach dismiss listeners once the prompt is visible
  useEffect(() => {
    if (!showPrompt) return;
    window.addEventListener('keydown', dismiss, { once: true });
    window.addEventListener('click',   dismiss, { once: true });
    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('click',   dismiss);
    };
  }, [showPrompt, dismiss]);

  if (!isVisible) return null;

  const progress = Math.round((linesShown / bootLines.length) * 100);
  const allShown = linesShown >= bootLines.length;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isDismissing ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000, ease: 'easeInOut' }}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          200,          // above Navbar's z-50
        background:      '#080808',
        // Subtle engineering grid — reinforces game-engine aesthetic
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '32px 32px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      {/* ─── Center panel ────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: '560px', padding: '0 32px' }}>

        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.08, ease: 'easeOut' }}
        >
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'clamp(30px, 5.5vw, 48px)',
            fontWeight:    700,
            color:         '#d4d4d4',
            letterSpacing: '-0.025em',
            lineHeight:    1,
            margin:        0,
          }}>
            FORMFORGE
          </p>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '12px',
            color:         '#569cd6',
            letterSpacing: '0.12em',
            margin:        '8px 0 0',
          }}>
            ENGINE v1.0.0
          </p>
        </motion.div>

        {/* Top divider — slides in left-to-right */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.42, delay: 0.3, ease: 'easeOut' }}
          style={{
            height:          '1px',
            background:      '#2a2a2a',
            margin:          '28px 0',
            transformOrigin: 'left center',
          }}
        />

        {/* Boot lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {bootLines.map((line, i) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{
                opacity: linesShown > i ? 1 : 0,
                x:       linesShown > i ? 0 : -6,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                fontFamily:     'var(--font-mono)',
                fontSize:       '13px',
                lineHeight:     1.4,
              }}
            >
              {/* Prompt char + line text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#569cd6', userSelect: 'none' }}>
                  {line.isLast ? '$' : '>'}
                </span>
                <span style={{ color: line.isLast ? '#66bb6a' : '#9ca3af' }}>
                  {line.text}
                  {!line.isLast && '...'}
                </span>
              </div>

              {/* Checkmark — pops in 200 ms after line text */}
              {!line.isLast && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: checksShown > i ? 1   : 0,
                    scale:   checksShown > i ? 1   : 0.4,
                  }}
                  transition={{ duration: 0.22, ease: 'backOut' }}
                  style={{
                    color:      '#66bb6a',
                    fontSize:   '13px',
                    flexShrink: 0,
                    marginLeft: '16px',
                    userSelect: 'none',
                  }}
                >
                  <Check size={13} />
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom divider — appears after all lines shown */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: allShown ? 1 : 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          style={{
            height:          '1px',
            background:      '#2a2a2a',
            margin:          '28px 0',
            transformOrigin: 'left center',
          }}
        />

        {/* "Press any key" prompt
            Outer motion.div handles the fade-in opacity.
            Inner span holds the CSS blink so they don't conflict. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showPrompt ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <span
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              color:         '#4b5563',
              letterSpacing: '0.18em',
              // cursor-blink is already defined in globals.css
              animation:     showPrompt ? 'cursor-blink 1.4s step-end infinite' : 'none',
            }}
          >
            [ PRESS ANY KEY TO ENTER THE BUILDER ]
          </span>
        </motion.div>
      </div>

      {/* ─── Progress bar ─────────────────────────────────────────── */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: '#111',
      }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ height: '100%', background: '#569cd6' }}
        />
      </div>

      {/* ─── Status badge (top-right) ─────────────────────────────── */}
      <div style={{
        position:      'absolute',
        top:           '20px',
        right:         '22px',
        fontFamily:    'var(--font-mono)',
        fontSize:      '10px',
        color:         '#2d2d2d',
        letterSpacing: '0.1em',
        userSelect:    'none',
      }}>
        {allShown ? 'READY' : 'LOADING...'}
      </div>


    </motion.div>
  );
}