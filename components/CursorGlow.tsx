"use client";

import { useEffect, useRef } from "react";

/**
 * A soft gold light trailing the pointer. Bails out entirely on touch devices,
 * where there is no pointer to follow, and under reduced-motion.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let visible = false;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        currentX = targetX;
        currentY = targetY;
        visible = true;
        glow.style.opacity = "1";
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
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={glowRef} className="rac-cursor-glow" aria-hidden="true" />;
}
