'use client';

import { UserPlus, Layers, Zap, BarChart2, type LucideIcon } from 'lucide-react';

interface Step {
  number:      string;
  icon:        LucideIcon;
  title:       string;
  description: string;
}

const STEPS: readonly Step[] = [
  {
    number:      '01',
    icon:        UserPlus,
    title:       'Sign up',
    description: "One form to fill. Then you're in the builder.",
  },
  {
    number:      '02',
    icon:        Layers,
    title:       'Build',
    description: 'Drag fields. Write labels. Set conditions. Configure in the Inspector.',
  },
  {
    number:      '03',
    icon:        Zap,
    title:       'Publish',
    description: 'Pick public or unlisted. Get a link. Get a QR code. Done.',
  },
  {
    number:      '04',
    icon:        BarChart2,
    title:       'Analyze',
    description: 'Watch responses come in. Check the health score. See where people drop off.',
  },
];

export default function HowItWorksSection() {
  return (
    <section
      style={{
        background: '#0a0a0a',
        padding:    '96px 24px',
        borderTop:  '1px solid #1a1a1a',
      }}
    >
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
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
          // How it works
        </p>

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
          Four steps.
          <br />
          <em style={{ fontStyle: 'italic', color: '#9ca3af' }}>No tutorial needed.</em>
        </h2>

        {/* Steps */}
        <div
          className="grid grid-cols-1 md:grid-cols-4"
          style={{ gap: '0', position: 'relative' }}
        >
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <div
                key={step.number}
                style={{
                  position: 'relative',
                  padding:  '28px 24px 28px 0',
                }}
              >
                {/* Connecting dashed line (desktop) */}
                {!isLast && (
                  <div
                    aria-hidden
                    className="hidden md:block"
                    style={{
                      position: 'absolute',
                      top:      '50px',
                      right:    '0',
                      width:    '100%',
                      borderTop:'1px dashed #2a2a2a',
                      transform:'translateX(50%)',
                      zIndex:   0,
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Watermark step number */}
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize:   '64px',
                      fontWeight: 700,
                      color:      'rgba(86,156,214,0.12)',
                      lineHeight: 1,
                      marginBottom: '-32px',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {step.number}
                  </p>

                  {/* Icon */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width:        '36px',
                      height:       '36px',
                      background:   'rgba(86,156,214,0.08)',
                      border:       '1px solid rgba(86,156,214,0.3)',
                      marginBottom: '18px',
                      position:     'relative',
                    }}
                  >
                    <Icon size={16} style={{ color: '#569cd6' }} />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily:   "'Space Grotesk', sans-serif",
                      fontSize:     '18px',
                      fontWeight:   600,
                      color:        '#d4d4d4',
                      marginBottom: '8px',
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize:   '13px',
                      color:      '#9ca3af',
                      lineHeight: 1.55,
                      maxWidth:   '220px',
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
