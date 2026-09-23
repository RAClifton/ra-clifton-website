"use client";

import { useEffect, useRef } from "react";

/** Gold, a paler gold, cream and white, so the motes catch light differently
 *  instead of reading as one flat colour. */
const DUST_COLORS = ["239,189,85", "245,208,138", "247,243,233", "255,255,255"];

const MAX_MOTES = 110;     // hard ceiling, so a fast flick cannot flood the frame
const SPAWN_EVERY = 4.5;   // px of travel between spawns — the density dial

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
  phase: number;
};

/**
 * A soft gold light trailing the pointer, with a fine dust trail riding on it.
 * Bails out entirely on touch devices, where there is no pointer to follow,
 * and under reduced-motion.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const canvas = canvasRef.current;
    if (!glow || !canvas) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastSpawnX = 0;
    let lastSpawnY = 0;
    let visible = false;
    let frame = 0;
    let motes: Mote[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (x: number, y: number, speed: number) => {
      if (motes.length >= MAX_MOTES) return;
      const drift = Math.min(speed, 28) * 0.04;
      motes.push({
        x: x + (Math.random() - 0.5) * 7,
        y: y + (Math.random() - 0.5) * 7,
        vx: (Math.random() - 0.5) * 0.5 - drift * (Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 0.35 + 0.12,
        r: 0.45 + Math.random() * 0.85,
        life: 0,
        maxLife: 46 + Math.random() * 26,
        color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        currentX = targetX;
        currentY = targetY;
        lastSpawnX = targetX;
        lastSpawnY = targetY;
        visible = true;
        glow.style.opacity = "1";
      }

      // Spawn by distance travelled rather than per event, so the trail reads
      // the same whether the mouse is moved slowly or flicked across.
      const dx = targetX - lastSpawnX;
      const dy = targetY - lastSpawnY;
      const dist = Math.hypot(dx, dy);
      if (dist >= SPAWN_EVERY) {
        const steps = Math.min(Math.floor(dist / SPAWN_EVERY), 4);
        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          spawn(lastSpawnX + dx * t, lastSpawnY + dy * t, dist);
        }
        lastSpawnX = targetX;
        lastSpawnY = targetY;
      }
    };

    const onPointerLeave = () => {
      glow.style.opacity = "0";
      visible = false;
    };

    // Easing toward the cursor rather than pinning to it is what makes the
    // light feel like it has weight instead of being stuck to the arrow.
    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      motes = motes.filter((m) => {
        m.life += 1;
        m.vy += 0.008;            // barely any gravity; dust settles, it does not fall
        m.vx *= 0.97;
        m.vy *= 0.985;
        m.x += m.vx;
        m.y += m.vy;

        const t = m.life / m.maxLife;
        const fade = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82;
        const twinkle = 0.62 + 0.38 * Math.sin(m.phase + m.life * 0.22);
        const alpha = Math.max(0, fade * twinkle * 0.85);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${m.color},${alpha})`;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        return m.life < m.maxLife;
      });

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="rac-cursor-glow" aria-hidden="true" />
      <canvas ref={canvasRef} className="rac-cursor-dust" aria-hidden="true" />
    </>
  );
}
