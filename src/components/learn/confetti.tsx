"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#F65F2E", "#722525", "#3FA39B", "#E2A63E", "#4CB98A"];

/**
 * A one-shot confetti burst. Mount it (e.g. keyed by a completion event) and it
 * plays once. No dependency — a few dozen particles on a fixed canvas. Honours
 * prefers-reduced-motion by rendering nothing.
 */
export function Confetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);
    ctx.scale(dpr, 1);

    const N = 140;
    const parts = Array.from({ length: N }, (_, i) => ({
      x: (window.innerWidth * (0.3 + 0.4 * ((i % 20) / 20))),
      y: -20 - Math.random() * H * 0.2,
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      c: COLORS[i % COLORS.length],
    }));

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.995;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (frame < 160) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [fire]);

  if (!fire) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-dvh w-dvw"
      style={{ width: "100vw", height: "100dvh" }}
    />
  );
}
