'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const DEMO_EMAIL    = 'demo@formforge.tech';
const DEMO_PASSWORD = 'Demo@FormForge2026';
const ADMIN_EMAIL   = 'admin@formforge.tech';

const PRODUCT_LINKS = [
  { label: 'Explore Forms', href: '/explore'  },
  { label: 'Pricing',       href: '/pricing'  },
  { label: 'API Docs',      href: process.env.NEXT_PUBLIC_API_URL
                              ? `${process.env.NEXT_PUBLIC_API_URL}/docs`
                              : '/docs',
    external: true },
] as const;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked, silent */
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
      style={{
        background: 'transparent',
        border:     '1px solid #2a2a2a',
        color:      copied ? '#4ec9b0' : '#6b7280',
        padding:    '3px 5px',
        cursor:     'pointer',
        display:    'inline-flex',
        alignItems: 'center',
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#569cd6';
      }}
      onMouseLeave={(e) => {
        if (!copied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

export default function Footer() {
  return (
    <footer
      style={{
        borderTop:  '1px solid #2a2a2a',
        background: '#0a0a0a',
        padding:    '64px 24px 32px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-12"
        style={{ maxWidth: '1152px', margin: '0 auto' }}
      >
        {/* ── Brand col ───────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '13px',
              fontWeight:    700,
              color:         '#d4d4d4',
              letterSpacing: '0.06em',
              marginBottom:  '12px',
            }}
          >
            FORMFORGE
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
            A form builder that respects your craft.
          </p>
        </div>

        {/* ── Product col ─────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '10px',
              color:         '#569cd6',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom:  '14px',
            }}
          >
            // Product
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRODUCT_LINKS.map((link) => {
              const isExternal = 'external' in link && link.external;
              return (
                <li key={link.label}>
                  {isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Demo creds col ──────────────────────────────────── */}
        <div>
          <p
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '10px',
              color:         '#569cd6',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom:  '14px',
            }}
          >
            // Demo credentials
          </p>
          <div
            style={{
              border:     '1px solid #2a2a2a',
              background: '#141414',
              padding:    '14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize:   '12px',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ color: '#9ca3af' }}>{DEMO_EMAIL}</span>
              <CopyButton value={DEMO_EMAIL} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: '#9ca3af' }}>{DEMO_PASSWORD}</span>
              <CopyButton value={DEMO_PASSWORD} />
            </div>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4b5563', marginTop: '10px' }}>
            Admin: {ADMIN_EMAIL}
          </p>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth:    '1152px',
          margin:      '48px auto 0',
          paddingTop:  '24px',
          borderTop:   '1px solid #1a1a1a',
          textAlign:   'center',
          fontFamily:  "'JetBrains Mono', monospace",
          fontSize:    '11px',
          color:       '#4b5563',
          letterSpacing: '0.04em',
        }}
      >
        FormForge · ChaiCode Hackathon 2025 · Built by Preet
      </div>
    </footer>
  );
}
