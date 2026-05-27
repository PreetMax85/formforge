'use client';

import {
  Layers, GitBranch, BarChart2, Globe, Palette, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon:        LucideIcon;
  color:       string;
  title:       string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon:        Layers,
    color:       '#569cd6',
    title:       'Inspector-Driven Builder',
    description: 'Every field is a GameObject. Drag it onto the canvas, click it, configure it in the Inspector panel. No modal popups. No context switching.',
  },
  {
    icon:        GitBranch,
    color:       '#4ec9b0',
    title:       'Conditional Logic That Works',
    description: 'Show or hide fields based on previous answers. Graph-based resolution handles chains: if A then B, if B then C. No spaghetti rules.',
  },
  {
    icon:        BarChart2,
    color:       '#dcdcaa',
    title:       'Analytics With a Health Score',
    description: 'Not just response counts. A 0-100 health score, Q1→Qn drop-off funnel, field breakdown, time-series. Computed from real data.',
  },
  {
    icon:        Globe,
    color:       '#4ec9b0',
    title:       'Public and Unlisted',
    description: 'Public forms appear on the Explore page. Unlisted forms are direct-link only. Both work without login for respondents.',
  },
  {
    icon:        Palette,
    color:       '#c586c0',
    title:       'Themes That Mean Something',
    description: 'Ghost of Tsushima. Jujutsu Kaisen. Karan Aujla concert night. Respondents get a full-screen immersive experience, not a white box.',
  },
  {
    icon:        ShieldCheck,
    color:       '#ce9178',
    title:       'Spam Protection Baked In',
    description: 'Honeypot fields. Subnet clustering detection. Idempotency hashing. Cloudflare Turnstile-ready. Bots get a fake 200. Real users never notice.',
  },
];

export default function FeaturesSection() {
  return (
    <section
      style={{
        background: '#0a0a0a',
        padding:    '96px 24px',
        borderTop:  '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a',
      }}
    >
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        {/* Section label */}
        <p
          style={{
            fontFamily:    "'JetBrains Mono', monospace",
            fontSize:      '11px',
            color:         '#569cd6',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom:  '16px',
          }}
        >
          // What you get
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize:   'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color:      '#d4d4d4',
            lineHeight: 1.15,
            marginBottom: '56px',
            letterSpacing: '-0.01em',
            maxWidth:   '640px',
          }}
        >
          Everything a form builder
          <br />
          <em style={{ fontStyle: 'italic', color: '#9ca3af' }}>should have. Finally.</em>
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '16px' }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  background:  '#141414',
                  border:      '1px solid #2a2a2a',
                  padding:     '24px',
                  transition:  'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(86,156,214,0.4)';
                  e.currentTarget.style.transform   = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.transform   = 'translateY(0)';
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width:       '32px',
                    height:      '32px',
                    background:  `${f.color}14`,
                    border:      `1px solid ${f.color}30`,
                    marginBottom:'18px',
                  }}
                >
                  <Icon size={16} style={{ color: f.color }} />
                </div>
                <h3
                  style={{
                    fontFamily:   "'Space Grotesk', sans-serif",
                    fontSize:     '17px',
                    fontWeight:   600,
                    color:        '#d4d4d4',
                    marginBottom: '10px',
                    lineHeight:   1.3,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize:   '13px',
                    color:      '#9ca3af',
                    lineHeight: 1.6,
                  }}
                >
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
