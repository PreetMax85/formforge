'use client';

/**
 * LoadingScreen — FormForge Game Engine Inspector aesthetic.
 *
 * Two variants:
 *   'fullscreen' — fixed overlay z-200, used for route-level loading (loading.tsx files)
 *   'inline'     — contained block, used inside dashboard panels and cards
 *
 * All animations use framer-motion. No raw CSS animation strings.
 * Boot message pool is sampled once on mount via useMemo.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadingScreenProps {
  readonly variant:          'fullscreen' | 'inline';
  readonly message?:         string;
  readonly subMessage?:      string;
  readonly showProgressBar?: boolean;
}

// ─── Boot message pool ────────────────────────────────────────────────────────

const BOOT_POOL = [
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
  'Compiling shaders',
  'Initializing the renderer',
  'Loading form schema',
  'Syncing field registry',
  'Preparing response pipeline',
  'Calculating analytics',
  'Hydrating UI components',
] as const;

const SCENE_READY = 'Scene ready' as const;

/**
 * Picks `count` unique items from the pool using Fisher-Yates on a copy.
 * Called once inside useMemo — safe to use Math.random() here because this
 * is purely cosmetic UI randomisation with no data or seed implications.
 */
function samplePool(count: number): readonly string[] {
  const copy = [...BOOT_POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

// ─── Timing constants ─────────────────────────────────────────────────────────

const LINE_INTERVAL_MS  = 200; // gap between each line appearing
const CHECK_DELAY_MS    = 200; // checkmark appears this long after its line
const SCENE_READY_DELAY = 5;   // which "step" index triggers Scene ready

// ─── Indeterminate progress bar ───────────────────────────────────────────────

/**
 * Fully framer-motion-driven indeterminate bar.
 * A 35%-wide pill slides from left-edge to right-edge and loops.
 * No CSS @keyframes needed.
 */
function IndeterminateBar() {
  return (
    <div
      style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: '#111',
        overflow:   'hidden',
      }}
    >
      <motion.div
        animate={{ left: ['-35%', '100%'] }}
        transition={{
          duration:   1.6,
          repeat:     Infinity,
          ease:       'easeInOut',
          repeatType: 'loop',
        }}
        style={{
          position:   'absolute',
          top:        0,
          width:      '35%',
          height:     '100%',
          background: '#569cd6',
        }}
      />
    </div>
  );
}

// ─── Determinate progress bar ─────────────────────────────────────────────────

/** Simple left-to-right fill driven by a 0-100 `pct` value. */
function DeterminateBar({ pct }: { readonly pct: number }) {
  return (
    <div
      style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        height:     '2px',
        background: '#111',
      }}
    >
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ height: '100%', background: '#569cd6' }}
      />
    </div>
  );
}

// ─── Single boot line ─────────────────────────────────────────────────────────

interface BootLineProps {
  readonly text:      string;
  readonly isVisible: boolean;
  readonly hasCheck:  boolean;
  readonly isLast:    boolean;
}

function BootLine({ text, isVisible, hasCheck, isLast }: BootLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        fontFamily:     'var(--font-mono)',
        fontSize:       '12px',
        lineHeight:     1.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: isLast ? '#66bb6a' : '#569cd6', userSelect: 'none' }}>
          {isLast ? '$' : '>'}
        </span>
        <span style={{ color: isLast ? '#66bb6a' : '#9ca3af' }}>
          {text}{!isLast ? '...' : ''}
        </span>
      </div>

      {/* Checkmark — only for non-final lines */}
      {!isLast && (
        <motion.span
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: hasCheck ? 1 : 0, scale: hasCheck ? 1 : 0.3 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }} // backOut approximation
          style={{
            color:      '#66bb6a',
            fontSize:   '12px',
            flexShrink: 0,
            marginLeft: '14px',
            userSelect: 'none',
          }}
        >
          <Check size={12} color="#66bb6a" />
        </motion.span>
      )}
    </motion.div>
  );
}

// ─── Corner brackets ──────────────────────────────────────────────────────────

/** L-shaped brackets at all four corners — Unity inspector aesthetic. */
function CornerBrackets() {
  const s = '2px solid #569cd6';
  const base: React.CSSProperties = { position: 'absolute', width: 12, height: 12 };
  return (
    <>
      <div style={{ ...base, top: -1, left:    -1, borderTop:    s, borderLeft:   s }} />
      <div style={{ ...base, top: -1, right:   -1, borderTop:    s, borderRight:  s }} />
      <div style={{ ...base, bottom: -1, left:  -1, borderBottom: s, borderLeft:   s }} />
      <div style={{ ...base, bottom: -1, right: -1, borderBottom: s, borderRight:  s }} />
    </>
  );
}

// ─── Inner content (shared between variants) ──────────────────────────────────

interface InnerProps {
  readonly lines:          readonly string[];
  readonly linesVisible:   number;
  readonly checksVisible:  number;
  readonly message?:       string;
  readonly subMessage?:    string;
  readonly showProgressBar: boolean;
  readonly progressPct:    number;
  readonly isIndeterminate: boolean;
}

function BootContent({
  lines,
  linesVisible,
  checksVisible,
  message,
  subMessage,
  showProgressBar,
  progressPct,
  isIndeterminate,
}: InnerProps) {
  const allLines    = [...lines, SCENE_READY] as const;
  const totalLines  = allLines.length; // 6
  const sceneReady  = linesVisible >= totalLines;

  return (
    <div style={{ width: '100%', maxWidth: '520px', padding: '0 28px' }}>

      {/* ── Title block ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.44, delay: 0.06, ease: 'easeOut' }}
      >
        <p style={{
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(26px, 4.5vw, 38px)',
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
          fontSize:      '11px',
          color:         '#569cd6',
          letterSpacing: '0.12em',
          margin:        '7px 0 0',
        }}>
          ENGINE v1.0.0
        </p>
      </motion.div>

      {/* ── Top divider ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.38, delay: 0.28, ease: 'easeOut' }}
        style={{
          height:          '1px',
          background:      '#2a2a2a',
          margin:          '22px 0',
          transformOrigin: 'left center',
        }}
      />

      {/* ── Boot lines ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {allLines.map((line, i) => {
          const isLast = i === allLines.length - 1;
          return (
            <BootLine
              key={i}
              text={line}
              isVisible={linesVisible > i}
              hasCheck={!isLast && checksVisible > i}
              isLast={isLast}
            />
          );
        })}
      </div>

      {/* ── Bottom divider ────────────────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: sceneReady ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          height:          '1px',
          background:      '#2a2a2a',
          margin:          '22px 0',
          transformOrigin: 'left center',
        }}
      />

      {/* ── Optional message / sub-message ───────────────────────────── */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            style={{ textAlign: 'center' }}
          >
            <p style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              color:         '#6b7280',
              letterSpacing: '0.06em',
              margin:        0,
            }}>
              {message}
            </p>
            <AnimatePresence mode="wait">
              {subMessage && (
                <motion.p
                  key={subMessage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      '10px',
                    color:         '#4b5563',
                    letterSpacing: '0.05em',
                    margin:        '4px 0 0',
                  }}
                >
                  {subMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

/**
 * LoadingScreen — two variants sharing the same boot sequence UI.
 *
 * @param variant          'fullscreen' | 'inline'
 * @param message          Optional status string shown below boot lines
 * @param subMessage       Optional secondary string; changes signal real progress
 * @param showProgressBar  Defaults to true
 */
export default function LoadingScreen({
  variant,
  message,
  subMessage,
  showProgressBar = true,
}: LoadingScreenProps) {

  // Pick 5 messages once on mount — stable across re-renders
  const lines = useMemo(() => samplePool(5), []);

  const [linesVisible,  setLinesVisible]  = useState(0);
  const [checksVisible, setChecksVisible] = useState(0);

  // Drive line reveals: 6 lines total (5 pool + Scene ready), 200ms apart
  useEffect(() => {
    const totalLines = lines.length + 1; // +1 for Scene ready
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < totalLines; i++) {
      timers.push(setTimeout(() => setLinesVisible(i + 1), i * LINE_INTERVAL_MS + 320));
      if (i < totalLines - 1) {
        // Checkmarks for all except "Scene ready"
        timers.push(setTimeout(() => setChecksVisible(i + 1), i * LINE_INTERVAL_MS + 320 + CHECK_DELAY_MS));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [lines.length]);

  // Progress: indeterminate unless subMessage changes (treated as real progress signal)
  const prevSubMessage = useRef<string | undefined>(undefined);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    if (subMessage && subMessage !== prevSubMessage.current) {
      prevSubMessage.current = subMessage;
      setProgressPct(p => Math.min(p + 20, 90));
    }
  }, [subMessage]);

  const isIndeterminate = progressPct === 0;

  const totalLines     = lines.length + 1;
  const derivedPct     = Math.round((linesVisible / totalLines) * 100);
  const effectivePct   = isIndeterminate ? derivedPct : progressPct;

  // ── Shared inner content ──────────────────────────────────────────────────
  const content = (
    <BootContent
      lines={lines}
      linesVisible={linesVisible}
      checksVisible={checksVisible}
      message={message}
      subMessage={subMessage}
      showProgressBar={showProgressBar}
      progressPct={effectivePct}
      isIndeterminate={isIndeterminate}
    />
  );

  // ── Status badge (top-right) ──────────────────────────────────────────────
  const statusBadge = (
    <div style={{
      position:      'absolute',
      top:           '16px',
      right:         '18px',
      fontFamily:    'var(--font-mono)',
      fontSize:      '10px',
      color:         '#2d2d2d',
      letterSpacing: '0.1em',
      userSelect:    'none',
    }}>
      LOADING...
    </div>
  );

  // ── Progress bar (bottom) ─────────────────────────────────────────────────
  const progressBar = showProgressBar && (
    isIndeterminate
      ? <IndeterminateBar />
      : <DeterminateBar pct={effectivePct} />
  );

  // ── Fullscreen variant ────────────────────────────────────────────────────
  if (variant === 'fullscreen') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, ease: 'easeInOut' }}
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          200,
          background:      '#080808',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '32px 32px',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          overflow:       'hidden',
        }}
      >
        {statusBadge}
        {content}
        {progressBar}
      </motion.div>
    );
  }

  // ── Inline variant ────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: 'easeInOut' }}
      style={{
        position:        'relative',
        minHeight:       '200px',
        width:           '100%',
        background:      '#0e0e0e',
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize:  '32px 32px',
        border:          '1px solid #2a2a2a',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '32px 0',
        overflow:        'hidden',
      }}
    >
      {/* Corner brackets on inline panel */}
      <CornerBrackets />
      {statusBadge}
      {content}
      {progressBar}
    </motion.div>
  );
}