'use client';

import { type ReactNode } from 'react';

interface SceneViewProps {
  children: ReactNode;
}

/**
 * Center Scene View wrapper.
 * Provides the scrollable content area for the builder canvas.
 */
export function SceneView({ children }: SceneViewProps) {
  return (
    <div
      className="relative w-full h-full overflow-y-auto"
      style={{ background: '#1e1e1e' }}
    >
      {/* Subtle grid background — Unity-style dotted grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}