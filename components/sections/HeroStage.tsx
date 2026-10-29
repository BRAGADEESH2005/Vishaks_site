"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { conceptImages } from "@/data/projects";
import { canRunHero3D } from "@/lib/capability";
import { ensureGsap, gsap, useGSAP } from "@/lib/gsap";

// Three.js, React Three Fiber and the scene load only in the browser, after
// the page is interactive, so they never block the first paint.
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

const noop = () => () => {};

type Status = "poster" | "loading" | "live" | "failed";

export function HeroStage({ children }: { children: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const reduced = useSyncExternalStore(
    noop,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [wanted, setWanted] = useState(false);
  const [status, setStatus] = useState<Status>("poster");

  // Start the 3D scene once the browser is idle.
  useEffect(() => {
    if (!capable) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => {
      setWanted(true);
      setStatus("loading");
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 600);
    return () => window.clearTimeout(t);
  }, [capable]);

  // Pointer position for the camera's parallax (fine pointers only).
  useEffect(() => {
    const el = section.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  // Scroll: drive the camera and let the headline drift away as the hero leaves.
  useGSAP(
    () => {
      ensureGsap();
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(copy.current, {
          yPercent: -18,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top top", end: "70% top", scrub: true },
        });
        gsap.from("[data-hero-in]", { autoAlpha: 0, y: 26, duration: 1.4, stagger: 0.12, delay: 0.15 });
      });
      gsap.to(progress, {
        current: 1,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const live = status === "live";
  const caption = status === "loading" ? "Loading the 3D scene" : "Concept visualisation";

  return (
    <section ref={section} id="top" aria-label="Introduction" className="on-dark relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-ink text-ivory">
      <div className="absolute inset-0 -z-10">
        <Image
          src={conceptImages.kadalHero.src}
          alt={conceptImages.kadalHero.alt}
          priority
          fill
          sizes="100vw"
          quality={80}
          placeholder="blur"
          className="object-cover object-[64%_50%] md:object-center"
        />
        {wanted && status !== "failed" && (
          <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${live ? "opacity-100" : "opacity-0"}`}>
            <ErrorBoundary fallback={null} onError={() => setStatus("failed")}>
              <HeroCanvas
                progress={progress}
                pointer={pointer}
                reduced={reduced}
                onReady={() => setStatus("live")}
                onFail={() => setStatus("failed")}
              />
            </ErrorBoundary>
          </div>
        )}
        {/* Legibility: a soft charcoal falloff behind the copy, never a flat overlay. */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent md:bg-gradient-to-r md:from-ink/85 md:via-ink/30 md:to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div aria-hidden="true" className="grain absolute inset-0 overflow-hidden" />
      </div>

      <div ref={copy} className="gutter shell relative flex h-full flex-col justify-end pb-28 md:justify-center md:pb-0">
        {children}
      </div>

      <div className="gutter shell pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between pb-7">
        <a href="#vision" className="pointer-events-auto flex flex-col items-center gap-3 text-ivory/70 hover:text-ivory">
          <span className="relative block h-12 w-px overflow-hidden bg-ivory/25" aria-hidden="true">
            <span className="scroll-bead absolute left-0 top-0 block h-4 w-px bg-ivory" />
          </span>
          <span className="label">Scroll</span>
        </a>
        <p className="label max-w-[16rem] text-right text-ivory/60" aria-live="polite">
          Kadal Residences, OMR · {caption}
        </p>
      </div>
    </section>
  );
}
