'use client';

import { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export interface ConsoleMessage {
  type: 'info' | 'success' | 'error' | 'warn';
  text: string;
}

const TYPE_COLORS: Record<ConsoleMessage['type'], string> = {
  info:    '#4fc3f7',
  success: '#66bb6a',
  error:   '#ef5350',
  warn:    '#ffa726',
};

const TYPE_LABELS: Record<ConsoleMessage['type'], string> = {
  info:    'INFO',
  success: 'OK  ',
  error:   'ERR ',
  warn:    'WARN',
};

interface ConsolePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ConsoleMessage[];
}

/**
 * Bottom console panel — collapsible.
 * Shows a blinking LIVE dot and a scrolling log of mutation events.
 * Auto-scrolls to bottom on new messages.
 * Mimics a game engine's output console.
 */
export function ConsolePanel({ isOpen, onToggle, messages }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <div
      style={{
        background: '#1e1e1e',
        borderTop: '1px solid #2a2a2a',
        transition: 'height 0.2s ease',
        height: isOpen ? '160px' : '28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full flex-none px-3 transition-colors"
        style={{
          height: '28px',
          background: '#252526',
          borderBottom: isOpen ? '1px solid #2a2a2a' : 'none',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: '#9ca3af',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Terminal size={12} style={{ color: '#569cd6', flexShrink: 0 }} />
        <span>Console</span>
        {/* LIVE dot */}
        <span className="flex items-center gap-1.5 ml-2">
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#4caf50',
              display: 'inline-block',
              animation: 'pulse-live 2s ease-in-out infinite',
            }}
          />
          <span style={{ color: '#4caf50', fontSize: '10px' }}>LIVE</span>
        </span>
        <span className="ml-auto">
          {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
      </button>

      {/* Console output */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
        >
          {messages.length === 0 ? (
            <span style={{ color: '#6b7280' }}>No messages yet.</span>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3" style={{ marginBottom: '3px' }}>
                <span style={{ color: TYPE_COLORS[msg.type], flexShrink: 0 }}>
                  [{TYPE_LABELS[msg.type]}]
                </span>
                <span style={{ color: '#d4d4d4', wordBreak: 'break-word' }}>
                  {msg.text}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
