"use client";

import { Move3d } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { conceptImages } from "@/data/projects";
import { canRunHero3D } from "@/lib/capability";
import { ensureGsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const VisionCanvas = dynamic(() => import("@/components/three/VisionCanvas"), { ssr: false });

const FLOORS = 48;
const STAGES = ["Site surveyed", "Rising floor by floor", "Complete and landscaped"];
const noop = () => () => {};

/** Which principle the scroll position is illustrating: 0 land, 1 climate and build, 2 built in the open. */
function stageOf(p: number) {
  return p < 0.22 ? 0 : p < 0.86 ? 1 : 2;
}

/**
 * The vision section's model. Inside a [data-vision-track] container it follows
 * the scroll through that container, and marks the matching [data-stage] item.
 */
export function VisionModel() {
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const orbit = useRef(0);
  const level = useRef<HTMLSpanElement>(null);
  const stageLabel = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        // Mount the scene a screen ahead, then keep it; it only renders while near the viewport.
        if (e?.isIntersecting) setNear(true);
        setActive(!!e?.isIntersecting);
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      ensureGsap();
      const track = root.current?.closest("[data-vision-track]");
      if (!track) return;
      const items = Array.from(track.querySelectorAll<HTMLElement>("[data-stage]"));
      let last = -1;
      const st = ScrollTrigger.create({
        trigger: track,
        start: "top 75%",
        end: "bottom 70%",
        onUpdate: (self) => {
          progress.current = self.progress;
          const stage = stageOf(self.progress);
          const f = Math.min(1, Math.max(0, (self.progress - 0.22) / 0.62));
          const floors = Math.round((1 - Math.pow(1 - f, 3)) * FLOORS);
          if (level.current) level.current.textContent = String(floors).padStart(2, "0");
          if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
          if (stageLabel.current && stageLabel.current.textContent !== STAGES[stage]) stageLabel.current.textContent = STAGES[stage] ?? "";
          if (stage !== last) {
            last = stage;
            items.forEach((el, i) => el.setAttribute("data-active", String(i === stage)));
          }
        },
      });
      return () => st.kill();
    },
    { scope: root },
  );

  // Drag sideways to turn the model.
  useEffect(() => {
    const el = root.current;
    if (!el || !capable) return;
    let x0: number | null = null;
    let base = 0;
    const down = (e: PointerEvent) => {
      x0 = e.clientX;
      base = orbit.current;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (x0 === null) return;
      orbit.current = Math.max(-1.6, Math.min(1.6, base + ((e.clientX - x0) / el.clientWidth) * 3));
    };
    const up = () => (x0 = null);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [capable]);

  const still = conceptImages.residentialFacade;
  const show3d = capable && !failed;

  return (
    <figure>
      <div
        ref={root}
        data-reveal="clip"
        data-cursor={show3d ? "drag" : undefined}
        className="relative aspect-[4/5] touch-pan-y overflow-hidden bg-paper"
      >
        <Image src={still.src} alt={show3d ? "" : still.alt} fill sizes="(min-width: 768px) 40vw, 100vw" placeholder="blur" className="object-cover" />
        {show3d && near && (
          <div className={`absolute inset-0 transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}>
            <ErrorBoundary fallback={null} onError={() => setFailed(true)}>
              <VisionCanvas progress={progress} orbit={orbit} active={active} reduced={reduced} onReady={() => setLive(true)} />
            </ErrorBoundary>
          </div>
        )}
        {show3d && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/45 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/60 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between text-ivory">
              <span className="label rounded-full bg-ink/40 px-3 py-1.5 backdrop-blur-sm">Concept model</span>
              <span className="label inline-flex items-center gap-1.5 rounded-full bg-ink/40 px-3 py-1.5 backdrop-blur-sm">
                <Move3d className="h-3.5 w-3.5" strokeWidth={1.6} /> Drag to turn
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-5 text-ivory">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span ref={stageLabel} className="label block text-bronze-light">
                    {STAGES[0]}
                  </span>
                  <span className="mt-2 block font-display text-[2.6rem] leading-none tabular-nums">
                    <span ref={level}>00</span>
                    <span className="text-[1.1rem] text-ivory/60"> / {FLOORS} levels</span>
                  </span>
                </div>
              </div>
              <span className="mt-4 block h-px w-full bg-ivory/25">
                <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-bronze-light" />
              </span>
            </div>
          </>
        )}
      </div>
      <figcaption className="label mt-4 text-muted">
        {show3d ? "An illustrative concept tower, not a launched project. Scroll to build it." : still.caption}
      </figcaption>
    </figure>
  );
}
