'use client';

import { use, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Layers, Inbox, Settings, ArrowLeft } from 'lucide-react';

interface FormLayoutProps {
  children:  ReactNode;
  params:    Promise<{ id: string }>;
}

const TABS = [
  { label: 'Overview',  icon: BarChart2, href: (id: string) => `/dashboard/forms/${id}`           },
  { label: 'Builder',   icon: Layers,    href: (id: string) => `/dashboard/forms/${id}/builder`    },
  { label: 'Responses', icon: Inbox,     href: (id: string) => `/dashboard/forms/${id}/responses`  },
  { label: 'Settings',  icon: Settings,  href: (id: string) => `/dashboard/forms/${id}/settings`   },
] as const;

/**
 * Shared layout for all dashboard/forms/[id] sub-pages.
 * Renders a consistent tab bar: Overview | Builder | Responses | Settings.
 * Each tab links to the correct sub-route.
 */
export default function FormLayout({ children, params }: FormLayoutProps) {
  const { id } = use(params);
  const pathname = usePathname();
  const isBuilder = pathname.endsWith('/builder');

  function isActive(href: string): boolean {
    // Overview is active only on exact match
    if (href === `/dashboard/forms/${id}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        background:    '#1e1e1e',
      }}
    >
      {/* ── Tab bar ───────────────────────────────────────────── */}
      {!isBuilder && (
      <div
        style={{
          display:        'flex',
          alignItems:     'stretch',
          background:     '#252526',
          borderBottom:   '1px solid #2a2a2a',
          flexShrink:     0,
          paddingLeft:    '8px',
        }}
      >
        {/* Dashboard back-link */}
        <Link
          href="/dashboard"
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '6px',
            padding:       '0 16px',
            height:        '36px',
            textDecoration:'none',
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            letterSpacing: '0.04em',
            color:         '#6b7280',
            borderRight:   '1px solid #2a2a2a',
            transition:    'color 0.15s, background 0.15s',
            whiteSpace:    'nowrap',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
            (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a2a';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          }}
        >
          <ArrowLeft size={12} />
          Dashboard
        </Link>

        {TABS.map(({ label, icon: Icon, href }) => {
          const to     = href(id);
          const active = isActive(to);

          return (
            <Link
              key={label}
              href={to}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '6px',
                padding:       '0 16px',
                height:        '36px',
                textDecoration:'none',
                fontFamily:    "'JetBrains Mono', monospace",
                fontSize:      '11px',
                letterSpacing: '0.04em',
                color:         active ? '#d4d4d4' : '#6b7280',
                background:    active ? '#1e1e1e' : 'transparent',
                borderBottom:  active ? '2px solid #569cd6' : '2px solid transparent',
                borderTop:     '2px solid transparent',
                transition:    'color 0.15s, background 0.15s',
                whiteSpace:    'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                  (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a2a';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={12} />
              {label}
            </Link>
          );
        })}
      </div>
      )}
      {/* ── Page content ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}