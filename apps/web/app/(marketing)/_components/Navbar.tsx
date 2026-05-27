'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Explore',  href: '/explore' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'Docs',     href: process.env.NEXT_PUBLIC_API_URL
                          ? `${process.env.NEXT_PUBLIC_API_URL}/docs`
                          : '/docs' },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        zIndex:         50,
        height:         '56px',
        background:     scrolled ? 'rgba(14,14,14,0.85)' : '#0e0e0e',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom:   '1px solid #2a2a2a',
        transition:     'background 0.2s ease',
      }}
    >
      <div
        className="flex items-center justify-between h-full"
        style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo.svg"
            alt=""
            width={28}
            height={28}
            style={{ display: 'block' }}
          />
          <span
            style={{
              fontFamily:    "'JetBrains Mono', monospace",
              fontSize:      '13px',
              fontWeight:    700,
              color:         '#d4d4d4',
              letterSpacing: '0.06em',
            }}
          >
            FORMFORGE
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isExternal = link.href.startsWith('http');
            const Component  = isExternal ? 'a' : Link;
            const extraProps = isExternal
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Component
                key={link.label}
                href={link.href}
                {...extraProps}
                style={{
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '13px',
                  color:         '#9ca3af',
                  textDecoration:'none',
                  transition:    'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                {link.label}
              </Component>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '13px',
              color:         '#9ca3af',
              textDecoration:'none',
              padding:       '6px 12px',
              transition:    'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d4')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '13px',
              fontWeight:    600,
              background:    '#569cd6',
              color:         '#0e0e0e',
              padding:       '7px 14px',
              textDecoration:'none',
              border:        '1px solid #569cd6',
              transition:    'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Open Builder →
          </Link>
        </div>
      </div>
    </nav>
  );
}
