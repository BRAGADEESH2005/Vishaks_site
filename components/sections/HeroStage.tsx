"use client";

import { ArrowLeft, ArrowRight, Moon, Sun, Sunset, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import heroPoster from "@/public/images/concepts/cbd-hero.jpg";
import type { AtmosphereId } from "@/lib/three/atmosphere";
import { canRunHero3D } from "@/lib/capability";
import { ensureGsap, gsap, useGSAP } from "@/lib/gsap";
import { complete, onLoaded } from "@/lib/loading";
import { getHeroFeature, HERO_FEATURES } from "@/lib/three/heroFeatures";

// Three.js, React Three Fiber and the scene load only in the browser, after
// the page is interactive, so they never block the first paint.
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

const noop = () => () => {};
const ORBIT_LIMIT = 0.45; // radians each way: enough to walk around the corner, never a spin

type Status = "poster" | "loading" | "live" | "failed";

export function HeroStage({ children }: { children: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const orbit = useRef(0);
  const focusRef = useRef<string | null>(null);
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const reduced = useSyncExternalStore(
    noop,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [wanted, setWanted] = useState(false);
  const [status, setStatus] = useState<Status>("poster");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [preset, setPreset] = useState<AtmosphereId>("daylight");
  const [onScreen, setOnScreen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const live = status === "live";
  const feature = getHeroFeature(focusId);

  const focus = useCallback((id: string | null) => {
    focusRef.current = id;
    setFocusId(id);
  }, []);

  const step = (dir: 1 | -1) => {
    const i = HERO_FEATURES.findIndex((f) => f.id === focusId);
    const next = HERO_FEATURES[(i + dir + HERO_FEATURES.length) % HERO_FEATURES.length];
    if (next) focus(next.id);
  };

  // The district animates continuously, so pause it entirely once the hero scrolls away.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Report the hero's real loading steps to the loading screen.
  useEffect(() => {
    if (!capable) return;
    let alive = true;
    import("@/components/three/HeroCanvas")
      .then(() => alive && complete("hero-code"))
      .catch(() => ["hero-code", "hero-env", "hero-scene"].forEach(complete));
    return () => {
      alive = false;
    };
  }, [capable]);
  useEffect(() => {
    if (status === "live") ["hero-code", "hero-env", "hero-scene"].forEach(complete);
    if (status === "failed") ["hero-code", "hero-env", "hero-scene"].forEach(complete);
  }, [status]);

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

  // Pointer parallax, and drag-to-orbit for mouse users. Touch keeps normal page scrolling.
  useEffect(() => {
    const el = section.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    let drag: { x: number; start: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
      if (drag) {
        const next = drag.start - ((e.clientX - drag.x) / r.width) * 1.6;
        orbit.current = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, next));
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      // Only empty scene space starts a drag; text, links and controls behave normally.
      if ((e.target as HTMLElement).closest("a, button, input, [data-hero-copy], [data-hero-ui]")) return;
      drag = { x: e.clientX, start: orbit.current };
      setDragging(true);
    };
    const onUp = () => {
      drag = null;
      setDragging(false);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Escape returns to the overview.
  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") focus(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Scroll drives the camera; scrolling on also closes a feature view.
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
        // The headline arrives as the loading screen lifts.
        const intro = gsap.from("[data-hero-in]", { autoAlpha: 0, y: 26, duration: 1.4, stagger: 0.12, delay: 0.15, paused: true });
        const stop = onLoaded(() => intro.play());
        return () => stop();
      });
      gsap.to(progress, {
        current: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            if (self.progress > 0.06 && focusRef.current) focus(null);
          },
        },
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const caption = status === "loading" ? "Loading the 3D scene" : "Concept visualisation";
  const still = feature ? feature.still : null;

  return (
    <section
      ref={section}
      id="top"
      aria-label="Introduction"
      className={`on-dark relative isolate h-[100svh] min-h-[640px] overflow-hidden bg-ink text-ivory ${
        live ? (dragging ? "cursor-grabbing select-none" : "cursor-grab") : ""
      }`}
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={heroPoster}
          alt="Vishaks Central, a concept business district: glass office towers around a granite plaza, with traffic and people at a street crossing."
          priority
          fill
          sizes="100vw"
          quality={80}
          placeholder="blur"
          className="object-cover object-[70%_12%] md:object-center"
        />
        {wanted && status !== "failed" && (
          <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${live ? "opacity-100" : "opacity-0"}`}>
            <ErrorBoundary fallback={null} onError={() => setStatus("failed")}>
              <HeroCanvas
                active={onScreen}
                progress={progress}
                pointer={pointer}
                orbit={orbit}
                reduced={reduced}
                preset={preset}
                focusId={focusId}
                hotspots={live}
                onSelect={(id) => focus(id === focusId ? null : id)}
                onReady={() => setStatus("live")}
                onEnvReady={() => complete("hero-env")}
                onFail={() => setStatus("failed")}
              />
            </ErrorBoundary>
          </div>
        )}
        {/* Legibility: a soft charcoal falloff behind the copy, never a flat overlay. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,rgb(21_17_14/0.92)_38%,rgb(21_17_14/0.45)_62%,rgb(21_17_14/0)_82%)] transition-opacity duration-700 md:bg-none md:bg-gradient-to-r md:from-ink/85 md:via-ink/30 md:to-transparent ${
            feature ? "opacity-70" : "opacity-100"
          }`}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 overflow-hidden" />
      </div>

      {/* Headline. It steps aside while a feature is open. */}
      <div ref={copy} className="gutter shell pointer-events-none relative flex h-full flex-col justify-end pb-40 pt-24 md:justify-center md:pb-0 md:pt-0">
        <div
          data-hero-copy
          className={`pointer-events-auto w-fit max-w-full transition-all duration-700 ease-[var(--ease-architect)] ${
            feature ? "pointer-events-none -translate-x-6 opacity-0" : "opacity-100"
          }`}
          aria-hidden={feature ? true : undefined}
        >
          {children}
        </div>
      </div>

      {/* Feature card: what the camera is looking at, or a still when 3D is off. */}
      {feature && (
        <div
          data-hero-ui
          role="region"
          aria-label={`${feature.title}, feature detail`}
          aria-live="polite"
          className="gutter shell pointer-events-none absolute inset-x-0 bottom-28 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          <div className="pointer-events-auto w-full max-w-md border border-line-light bg-ink/80 p-6 backdrop-blur-md md:p-8">
            {!live && still && (
              <div className="relative -mx-6 -mt-6 mb-6 aspect-[3/2] overflow-hidden md:-mx-8 md:-mt-8">
                <Image src={still.src} alt={still.alt} fill sizes="28rem" className="object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <p className="label text-bronze-light">{feature.kicker} · concept</p>
              <button
                type="button"
                onClick={() => focus(null)}
                className="-mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory"
              >
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                <span className="sr-only">Back to the overview</span>
              </button>
            </div>
            <h2 className="mt-4 text-display-m">{feature.title}</h2>
            <p className="mt-4 text-ivory/75">{feature.body}</p>
            <div className="mt-8 flex items-center justify-between gap-4">
              <button type="button" onClick={() => focus(null)} className="link-draw text-[0.95rem] text-ivory/85">
                Back to the overview
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  <span className="sr-only">Previous feature</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory"
                >
                  <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  <span className="sr-only">Next feature</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control rail: explore the district, and switch day, dusk or night when 3D is running. */}
      <div data-hero-ui className="gutter shell pointer-events-none absolute inset-x-0 bottom-0 pb-7">
        <div className="flex items-end justify-between gap-6">
          <a href="#vision" className="pointer-events-auto hidden flex-col items-center gap-3 text-ivory/70 hover:text-ivory md:flex">
            <span className="relative block h-12 w-px overflow-hidden bg-ivory/25" aria-hidden="true">
              <span className="scroll-bead absolute left-0 top-0 block h-4 w-px bg-ivory" />
            </span>
            <span className="label">Scroll</span>
          </a>

          <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-stretch gap-3 md:flex-none md:items-end">
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <p className="label hidden text-ivory/60 sm:block" aria-live="polite">
                Vishaks Central · design study · {caption}
              </p>
              {live && (
                <div role="group" aria-label="Time of day" className="flex rounded-full border border-ivory/25 p-0.5">
                  {(
                    [
                      { id: "daylight", label: "Day", Icon: Sun },
                      { id: "dusk", label: "Dusk", Icon: Sunset },
                      { id: "blue", label: "Night", Icon: Moon },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={preset === id}
                      onClick={() => setPreset(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] transition-colors duration-300 ${
                        preset === id ? "bg-ivory text-ink" : "text-ivory/75 hover:text-ivory"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.6} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div role="group" aria-label="Explore the district" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {HERO_FEATURES.map((f) => {
                const on = f.id === focusId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => focus(on ? null : f.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[0.85rem] backdrop-blur-sm transition-colors duration-300 ${
                      on ? "border-ivory bg-ivory text-ink" : "border-ivory/30 bg-ink/30 text-ivory/85 hover:border-ivory/70"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            {live && (
              <p className="label hidden text-right text-ivory/45 md:block">Drag to look around · select a marker</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
