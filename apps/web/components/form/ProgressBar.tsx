'use client';

interface ProgressBarProps {
  /** 0–100 */
  progress: number;
  /** Current step label e.g. "3 of 7" */
  label?: string;
}

/**
 * Horizontal progress bar for the public form.
 * Uses CSS vars so it adapts to any data-theme automatically.
 */
export function ProgressBar({ progress, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        width: '100%',
        padding: '0 0 4px 0',
      }}
    >
      {/* Track */}
      <div
        style={{
          width:            '100%',
          height:           '2px',
          background:       'var(--border)',
          position:         'relative',
          overflow:         'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position:   'absolute',
            left:       0,
            top:        0,
            height:     '100%',
            width:      `${clamped}%`,
            background: 'var(--text-accent)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Label */}
      {label && (
        <div
          style={{
            marginTop:  '6px',
            fontSize:   '11px',
            color:      'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            textAlign:  'right',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}