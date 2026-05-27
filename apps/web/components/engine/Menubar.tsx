'use client';

import Link from 'next/link';
import { Play, Zap, ChevronRight, BarChart2 } from 'lucide-react';

interface MenubarProps {
  formTitle: string;
  formId?: string;
  onPlay: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

/**
 * Top menubar — breadcrumb navigation + action buttons.
 * Breadcrumb: FormForge › [formTitle] › Builder
 * Buttons: ▶ PLAY  ⚡ PUBLISH
 */
export function Menubar({ formTitle, formId, onPlay, onPublish, isPublishing }: MenubarProps) {
  const titleNode = formId ? (
    <Link
      href={`/dashboard/forms/${formId}`}
      className="truncate max-w-[180px] hover:underline"
      style={{ color: '#9ca3af', textDecorationColor: '#569cd6' }}
      title={formTitle}
    >
      {formTitle}
    </Link>
  ) : (
    <span
      className="truncate max-w-[180px]"
      style={{ color: '#9ca3af' }}
      title={formTitle}
    >
      {formTitle}
    </span>
  );

  return (
    <div
      className="flex items-center justify-between h-full px-3"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 min-w-0" style={{ fontSize: '12px' }}>
        <Link
          href="/dashboard"
          className="hover:underline"
          style={{ color: '#569cd6', fontWeight: 600, letterSpacing: '0.04em', textDecorationColor: '#569cd6' }}
        >
          FORMFORGE
        </Link>
        <ChevronRight size={12} style={{ color: '#3c3c3c', flexShrink: 0 }} />
        {titleNode}
        <ChevronRight size={12} style={{ color: '#3c3c3c', flexShrink: 0 }} />
        <span style={{ color: '#d4d4d4' }}>Builder</span>
      </div>

      {/* ── Action buttons ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* ▶ PLAY */}
        <button
          onClick={onPlay}
          className="flex items-center gap-1.5 px-3 h-6 text-xs transition-colors"
          style={{
            background: 'transparent',
            border: '1px solid #3c3c3c',
            color: '#4ec9b0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#4ec9b0';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(78,201,176,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <Play size={10} fill="#4ec9b0" />
          PLAY
        </button>

        {/* 📊 ANALYTICS */}
        {formId && (
          <Link
            href={`/dashboard/forms/${formId}`}
            className="flex items-center gap-1.5 px-3 h-6 text-xs transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid #3c3c3c',
              color: '#569cd6',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.06em',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#569cd6';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(86,156,214,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3c3c3c';
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            }}
          >
            <BarChart2 size={10} />
            ANALYTICS
          </Link>
        )}

        {/* ⚡ PUBLISH */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-3 h-6 text-xs transition-colors"
          style={{
            background: isPublishing ? 'rgba(86,156,214,0.2)' : '#569cd6',
            border: '1px solid #569cd6',
            color: isPublishing ? '#569cd6' : '#0e0e0e',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            cursor: isPublishing ? 'not-allowed' : 'pointer',
            opacity: isPublishing ? 0.7 : 1,
          }}
        >
          <Zap size={10} />
          {isPublishing ? 'PUBLISHING...' : 'PUBLISH'}
        </button>
      </div>
    </div>
  );
}