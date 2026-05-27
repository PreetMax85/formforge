"use client";

/* ── Canvas animation randomness ─────────────────────────────────
 * Math.random() is used here for visual particle/rain effects only,
 * not for data generation. This is exempt from the AGENTS.md rule
 * that prohibits Math.random() outside seed.ts because these are
 * pure visual animations — no data, no determinism requirements.
 * See AGENTS.md §3 (Data) — "visual effects only, not data."
 * ──────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";

interface ThemeBackgroundProps {
  theme: string;
}

/**
 * Ambient background effects for public form themes.
 * matrix / jujutsu-kaisen → canvas animation
 * ghost-of-tsushima       → CSS falling sakura petals
 * karan-aujla-concert     → CSS spotlight sweep
 * All other themes        → null
 */
export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  if (theme === "matrix") return <MatrixRain />;
  if (theme === "jujutsu-kaisen") return <JJKParticles />;
  if (theme === "ghost-of-tsushima") return <SakuraPetals />;
  if (theme === "karan-aujla-concert") return <ConcertSpotlight />;
  return null;
}

/* ── Matrix rain ────────────────────────────────────────────────────── */
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const FONT_SIZE = 14;
    const cols = Math.floor(canvas.width / FONT_SIZE);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -100);

    const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";

    let animId: number;
    function draw() {
      ctx!.fillStyle = "rgba(0,0,0,0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "#00ff41";
      ctx!.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx!.fillText(char!, i * FONT_SIZE, drops[i]! * FONT_SIZE);
        if (drops[i]! * FONT_SIZE > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]!++;
      }
      animId = requestAnimationFrame(draw);
    }
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── JJK particles ──────────────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  alphaDir: number;
}

function JJKParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 3 + 1,
      alpha: Math.random(),
      alphaDir: Math.random() > 0.5 ? 0.005 : -0.005,
    }));

    let animId: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir;
        if (p.alpha <= 0 || p.alpha >= 1) p.alphaDir *= -1;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        gradient.addColorStop(0, `rgba(124,58,237,${p.alpha})`);
        gradient.addColorStop(1, "rgba(124,58,237,0)");
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity: 0.5,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Ghost of Tsushima: CSS sakura petals ───────────────────────────── */
type PetalColor = "#f9b4c2" | "#e8919e" | "#fcc6d0";
type PetalShape = "50% 0 50% 0" | "0 50% 0 50%";

interface PetalConfig {
  left: string;
  delay: string;
  duration: string;
  size: string;
  color: PetalColor;
  shape: PetalShape;
}

const PETAL_CONFIGS: PetalConfig[] = [
  { left: "2%",  delay: "0s",    duration: "9s",   size: "8px",  color: "#f9b4c2", shape: "50% 0 50% 0" },
  { left: "6%",  delay: "4.2s",  duration: "11s",  size: "5px",  color: "#e8919e", shape: "0 50% 0 50%" },
  { left: "11%", delay: "1.5s",  duration: "8s",   size: "10px", color: "#f9b4c2", shape: "50% 0 50% 0" },
  { left: "17%", delay: "3.0s",  duration: "12s",  size: "6px",  color: "#fcc6d0", shape: "50% 0 50% 0" },
  { left: "22%", delay: "0.6s",  duration: "7s",   size: "9px",  color: "#e8919e", shape: "0 50% 0 50%" },
  { left: "28%", delay: "2.4s",  duration: "10s",  size: "4px",  color: "#f9b4c2", shape: "50% 0 50% 0" },
  { left: "33%", delay: "4.8s",  duration: "13s",  size: "7px",  color: "#fcc6d0", shape: "0 50% 0 50%" },
  { left: "38%", delay: "1.1s",  duration: "8.5s", size: "11px", color: "#f9b4c2", shape: "50% 0 50% 0" },
  { left: "44%", delay: "3.6s",  duration: "7.5s", size: "5px",  color: "#e8919e", shape: "50% 0 50% 0" },
  { left: "50%", delay: "0.3s",  duration: "9.5s", size: "8px",  color: "#f9b4c2", shape: "0 50% 0 50%" },
  { left: "55%", delay: "2.8s",  duration: "11s",  size: "14px", color: "#fcc6d0", shape: "50% 0 50% 0" },
  { left: "60%", delay: "5.0s",  duration: "7s",   size: "6px",  color: "#e8919e", shape: "50% 0 50% 0" },
  { left: "65%", delay: "1.8s",  duration: "10s",  size: "9px",  color: "#f9b4c2", shape: "0 50% 0 50%" },
  { left: "70%", delay: "3.5s",  duration: "8s",   size: "4px",  color: "#fcc6d0", shape: "50% 0 50% 0" },
  { left: "75%", delay: "0.9s",  duration: "12s",  size: "7px",  color: "#e8919e", shape: "50% 0 50% 0" },
  { left: "80%", delay: "4.5s",  duration: "9s",   size: "11px", color: "#f9b4c2", shape: "0 50% 0 50%" },
  { left: "85%", delay: "2.0s",  duration: "6.5s", size: "5px",  color: "#fcc6d0", shape: "50% 0 50% 0" },
  { left: "89%", delay: "3.8s",  duration: "10.5s",size: "8px",  color: "#e8919e", shape: "0 50% 0 50%" },
  { left: "93%", delay: "1.3s",  duration: "8.5s", size: "10px", color: "#f9b4c2", shape: "50% 0 50% 0" },
  { left: "97%", delay: "4.0s",  duration: "11s",  size: "6px",  color: "#fcc6d0", shape: "0 50% 0 50%" },
  { left: "4%",  delay: "2.5s",  duration: "14s",  size: "4px",  color: "#e8919e", shape: "50% 0 50% 0" },
  { left: "20%", delay: "5.2s",  duration: "9s",   size: "8px",  color: "#f9b4c2", shape: "0 50% 0 50%" },
  { left: "48%", delay: "3.3s",  duration: "7.5s", size: "6px",  color: "#fcc6d0", shape: "50% 0 50% 0" },
  { left: "72%", delay: "0.7s",  duration: "13s",  size: "5px",  color: "#e8919e", shape: "0 50% 0 50%" },
];

function SakuraPetals() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {PETAL_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-10px",
            left: cfg.left,
            width: cfg.size,
            height: cfg.size,
            background: cfg.color,
            borderRadius: cfg.shape,
            opacity: 0,
            animation: `petal-fall ${cfg.duration} ${cfg.delay} infinite linear,
                         petal-sway ${cfg.duration} ${cfg.delay} infinite ease-in-out`,
            boxShadow: `0 0 ${cfg.size === "14px" || cfg.size === "11px" ? "6" : "4"}px rgba(200,134,10,0.3)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Karan Aujla Concert: dual spotlights + pulsing crowd glow ──── */
function ConcertSpotlight() {
  return (
    <>
      {/* Left-right sweeping spotlight */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: `radial-gradient(ellipse 35% 55% at 50% 50%,
            rgba(251,191,36,0.07) 0%,
            transparent 70%)`,
          backgroundSize: "200% 200%",
          animation: "spotlight-sweep 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Counter-sweeping second spotlight — amber-gold */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: `radial-gradient(ellipse 40% 50% at 50% 50%,
            rgba(251,191,36,0.05) 0%,
            transparent 65%)`,
          backgroundSize: "200% 200%",
          animation: "spotlight-sweep-reverse 6s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Pulsing crowd glow along the bottom */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30vh",
          zIndex: 0,
          background: "linear-gradient(to top, rgba(251,191,36,0.12), transparent)",
          animation: "crowd-pulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
