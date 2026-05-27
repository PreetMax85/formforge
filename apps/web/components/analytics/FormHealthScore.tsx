'use client';

import type { FormStats } from '@repo/shared';
import { Activity } from 'lucide-react';

interface FormHealthScoreProps {
  score: number | null;
  stats: FormStats;
}

function SignalBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max:   number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '5px' }}
      >
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '9px',
            color:         '#6b7280',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '10px',
            color:      '#9ca3af',
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{ height: '3px', background: '#2a2a2a', width: '100%' }}>
        <div
          style={{
            height:     '100%',
            width:      `${pct}%`,
            background: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Circular arc health score gauge (CSS only — no library).
 * Four signal bars below: Completion / Velocity / Drop-off / Engagement.
 */
export function FormHealthScore({ score, stats }: FormHealthScoreProps) {
  if (score === null) {
    return (
      <div
        style={{
          background: '#141414',
          border:     '1px solid #2a2a2a',
          padding:    '24px',
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
          <Activity size={14} style={{ color: '#569cd6' }} />
          <span
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '11px',
              color:         '#9ca3af',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Form Health Score
          </span>
        </div>
        <div
          className="flex flex-col items-center justify-center"
          style={{ padding: '40px 0' }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '13px',
              color:      '#4b5563',
              textAlign:  'center',
              lineHeight: 1.6,
            }}
          >
            Not enough data to calculate form health.
            <br />
            Share your form to start collecting responses.
          </span>
        </div>
      </div>
    );
  }

  // SVG arc calculation
  const radius      = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength   = circumference * 0.75; // 270° arc
  const filled      = (score / 100) * arcLength;
  const gap         = arcLength - filled;

  const scoreColor =
    score >= 80 ? '#4caf50' :
    score >= 50 ? '#ff9800' : '#f44336';

  const velocityPct =
    stats.previousResponses > 0
      ? Math.min((stats.recentResponses / stats.previousResponses) * 50, 100)
      : stats.recentResponses > 0 ? 100 : 0;

  return (
    <div
      style={{
        background:  '#141414',
        border:      '1px solid #2a2a2a',
        padding:     '24px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
        <Activity size={14} style={{ color: '#569cd6' }} />
        <span
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#9ca3af',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Form Health Score
        </span>
      </div>

      {/* Arc gauge */}
      <div className="flex justify-center" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '140px', height: '100px' }}>
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Background arc */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="10"
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={circumference * 0.125}
              strokeLinecap="butt"
              transform="rotate(135 70 70)"
            />
            {/* Score arc */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={`${filled} ${gap + (circumference - arcLength)}`}
              strokeDashoffset={circumference * 0.125}
              strokeLinecap="butt"
              transform="rotate(135 70 70)"
              style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
            />
          </svg>

          {/* Score text */}
          <div
            style={{
              position:  'absolute',
              top:       '28px',
              left:      0,
              right:     0,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily:  "'Space Grotesk', sans-serif",
                fontSize:    '36px',
                fontWeight:  700,
                color:       scoreColor,
                lineHeight:  1,
                transition:  'color 0.4s ease',
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '10px',
                color:         '#4b5563',
                letterSpacing: '0.06em',
              }}
            >
              / 100
            </div>
          </div>
        </div>
      </div>

      {/* Signal bars */}
      <div className="flex flex-col gap-3">
        <SignalBar
          label="Completion"
          value={stats.completionRate * 100}
          max={100}
          color="#569cd6"
        />
        <SignalBar
          label="Velocity"
          value={velocityPct}
          max={100}
          color="#4ec9b0"
        />
        <SignalBar
          label="Drop-off resilience"
          value={Math.max(100 - stats.avgDropoffRate * 100, 0)}
          max={100}
          color="#ff9800"
        />
        <SignalBar
          label="Engagement"
          value={stats.totalFields > 0 ? (stats.avgFieldsAnswered / stats.totalFields) * 100 : 0}
          max={100}
          color="#c586c0"
        />
      </div>
    </div>
  );
}