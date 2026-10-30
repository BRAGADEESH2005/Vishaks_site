"use client";

import { useRef } from "react";

/**
 * A card that tilts toward the cursor and moves its image layer the opposite
 * way, so the photograph appears to sit behind the frame. Mouse only; touch
 * and reduced motion get a still card.
 */
export function TiltCard({ children, className = "", max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const set = (rx: number, ry: number, px: number, py: number, glare: number) => {
    const node = el.current;
    if (!node) return;
    node.style.setProperty("--rx", `${rx}deg`);
    node.style.setProperty("--ry", `${ry}deg`);
    node.style.setProperty("--px", `${px}px`);
    node.style.setProperty("--py", `${py}px`);
    node.style.setProperty("--glare", String(glare));
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.current?.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
      el.current?.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      set(-y * max, x * max, -x * 22, -y * 22, 1);
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    set(0, 0, 0, 0, 0);
  };

  return (
    <div className={`[perspective:1200px] ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={el}
        className="tilt-card relative h-full transition-transform duration-500 ease-[var(--ease-architect)] [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[var(--glare,0)] transition-opacity duration-500"
          style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgb(255 240 220 / 0.18), transparent 55%)" }}
        />
      </div>
    </div>
  );
}
