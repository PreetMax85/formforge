'use client';

import { type ReactNode } from 'react';

interface GameEngineShellProps {
  menubar: ReactNode;
  hierarchy: ReactNode;
  scene: ReactNode;
  inspector: ReactNode;
  console: ReactNode;
}

/**
 * Root 5-panel Game Engine Inspector layout.
 * Panels: Menubar (top) | Hierarchy (left) | Scene (center) | Inspector (right) | Console (bottom).
 * All sizing uses CSS grid/flex — no hardcoded pixel heights except the menubar (36px) and console (180px collapsed).
 */
export function GameEngineShell({
  menubar,
  hierarchy,
  scene,
  inspector,
  console: consolePanel,
}: GameEngineShellProps) {
  return (
    <div
      className="flex flex-col w-full h-screen overflow-hidden"
      style={{ background: '#1e1e1e', color: '#d4d4d4', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Menubar ─────────────────────────────────────────────────── */}
      <div
        className="flex-none w-full z-20"
        style={{
          height: '36px',
          background: '#1e1e1e',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        {menubar}
      </div>

      {/* ── Main area (Hierarchy + Scene + Inspector) ────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Hierarchy – left sidebar */}
        <div
          className="flex-none flex flex-col overflow-hidden"
          style={{
            width: '220px',
            background: '#252526',
            borderRight: '1px solid #2a2a2a',
          }}
        >
          <div
            className="flex items-center px-3 select-none"
            style={{
              height: '24px',
              background: '#333333',
              borderBottom: '1px solid #2a2a2a',
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Project Hierarchy
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">{hierarchy}</div>
        </div>

        {/* Scene – center */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ background: '#1e1e1e' }}
        >
          <div
            className="flex items-center px-3 select-none"
            style={{
              height: '24px',
              background: '#2d2d30',
              borderBottom: '1px solid #2a2a2a',
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Scene Editor
          </div>
          <div className="flex-1 overflow-y-auto">{scene}</div>
        </div>

        {/* Inspector – right sidebar */}
        <div
          className="flex-none flex flex-col overflow-hidden"
          style={{
            width: '280px',
            background: '#252526',
            borderLeft: '1px solid #2a2a2a',
          }}
        >
          <div
            className="flex items-center px-3 select-none"
            style={{
              height: '24px',
              background: '#333333',
              borderBottom: '1px solid #2a2a2a',
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Inspector
          </div>
          <div className="flex-1 overflow-y-auto">{inspector}</div>
        </div>
      </div>

      {/* ── Console – bottom ─────────────────────────────────────────── */}
      <div
        className="flex-none w-full z-10"
        style={{ borderTop: '1px solid #2a2a2a', background: '#1e1e1e' }}
      >
        {consolePanel}
      </div>
    </div>
  );
}