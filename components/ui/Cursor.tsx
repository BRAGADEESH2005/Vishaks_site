"use client";

import { useEffect, useRef, useState } from "react";
import { ensureGsap, gsap } from "@/lib/gsap";

/**
 * A soft ring that trails the pointer and grows over interactive elements.
 * Elements can name what a click does with data-cursor="view" | "drag".
 * The system cursor stays visible; this is an accent, not a replacement.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "link" | "label">("idle");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    ensureGsap();
    const el = ring.current;
    if (!el) return;
    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        setEnabled(true);
        gsap.set(el, { x: e.clientX, y: e.clientY });
      }
      x(e.clientX);
      y(e.clientY);
      const t = e.target as HTMLElement | null;
      const named = t?.closest<HTMLElement>("[data-cursor]");
      const cue = named?.dataset.cursor;
      if (cue === "view") {
        setMode("label");
        setLabel("View");
      } else if (cue === "drag") {
        setMode("label");
        setLabel(t?.closest("a, button") ? null : "Explore");
        if (t?.closest("a, button")) setMode("link");
      } else if (t?.closest("a, button, [role=button], label, select")) {
        setMode("link");
        setLabel(null);
      } else {
        setMode("idle");
        setLabel(null);
      }
    };
    const onLeave = () => {
      shown = false;
      setEnabled(false);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const size = mode === "label" ? "h-20 w-20 border-transparent bg-ivory text-ink shadow-lg" : mode === "link" ? "h-12 w-12 border-bronze-light" : "h-7 w-7 border-current";
  return (
    <div
      ref={ring}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[90] text-ivory transition-opacity duration-300 ${mode === "label" ? "" : "mix-blend-difference"} ${enabled ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`-translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border transition-all duration-500 ease-[var(--ease-architect)] ${size}`}
      >
        {label && <span className="label text-[0.65rem] tracking-[0.18em] text-ink">{label}</span>}
      </div>
    </div>
  );
}
