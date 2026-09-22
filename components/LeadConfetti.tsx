"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#efbd55", "#f7f3e9", "#ffffff", "#c9962f"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
  life: number;
};

/**
 * Listens for rac:lead-captured, which V12ClientController dispatches only
 * after /api/leads has actually saved the lead.
 */
export default function LeadConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pieces: Piece[] = [];
    let frame = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      pieces = pieces.filter((p) => {
        p.vy += 0.16;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.life -= 1;

        const fade = Math.min(1, p.life / 45);
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();

        return p.life > 0 && p.y < h + 40;
      });

      if (pieces.length > 0) {
        frame = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
        frame = 0;
        canvas.style.opacity = "0";
      }
    };

    const burst = () => {
      resize();
      canvas.style.opacity = "1";
      const originY = window.innerHeight * 0.34;
      // Two angled jets rather than one centre spray, so it arcs across the
      // viewport instead of dumping straight down the middle.
      for (const originX of [window.innerWidth * 0.2, window.innerWidth * 0.8]) {
        const aim = originX < window.innerWidth / 2 ? 1 : -1;
        for (let i = 0; i < 70; i += 1) {
          const speed = 6 + Math.random() * 9;
          const angle = (-Math.PI / 2) + aim * (Math.random() * 0.75);
          pieces.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed * 1.15,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 7,
            spin: (Math.random() - 0.5) * 0.3,
            angle: Math.random() * Math.PI,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            life: 110 + Math.random() * 60,
          });
        }
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("rac:lead-captured", burst);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("rac:lead-captured", burst);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="rac-confetti" aria-hidden="true" />;
}
