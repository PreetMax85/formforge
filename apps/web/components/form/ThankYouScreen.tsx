'use client';

import { CheckCircle, RotateCcw } from 'lucide-react';

interface ThankYouScreenProps {
  title: string;
  message: string;
  onReset?: () => void;
}

/**
 * Full-screen thank-you shown after successful form submission.
 * Uses CSS variables — adapts to every theme automatically.
 */
export function ThankYouScreen({ title, message, onReset }: ThankYouScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Icon */}
      <div
        style={{
          width:        '64px',
          height:       '64px',
          borderRadius: '50%',
          background:   'color-mix(in srgb, var(--text-accent) 15%, transparent)',
          border:       '1px solid var(--text-accent)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          marginBottom: '28px',
        }}
      >
        <CheckCircle size={28} style={{ color: 'var(--text-accent)' }} />
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize:    '28px',
          fontWeight:  700,
          color:       'var(--text-primary)',
          fontFamily:  "'Space Grotesk', sans-serif",
          marginBottom:'12px',
          maxWidth:    '480px',
        }}
      >
        {title}
      </h1>

      {/* Message */}
      <p
        style={{
          fontSize:    '15px',
          color:       'var(--text-secondary)',
          fontFamily:  "'Inter', sans-serif",
          maxWidth:    '400px',
          lineHeight:  1.7,
          marginBottom:'36px',
        }}
      >
        {message}
      </p>

      {/* Optional re-submit */}
      {onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-2"
          style={{
            padding:    '8px 20px',
            background: 'transparent',
            border:     '1px solid var(--border)',
            color:      'var(--text-secondary)',
            fontSize:   '13px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor:     'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          <RotateCcw size={13} />
          Submit another response
        </button>
      )}
    </div>
  );
}