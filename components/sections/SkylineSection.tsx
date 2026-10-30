"use client";

import { X } from "lucide-react";
import dynamic from "next/dynamic";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { canRunHero3D } from "@/lib/capability";
import { ensureGsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { District } from "@/lib/three/builders/district";
import districtCrown from "@/public/images/concepts/district-crown.jpg";
import districtDusk from "@/public/images/concepts/district-dusk.jpg";
import districtGolden from "@/public/images/concepts/district-golden.jpg";
import districtNight from "@/public/images/concepts/district-night.jpg";

const SkylineCanvas = dynamic(() => import("@/components/three/SkylineCanvas"), { ssr: false });

type Chapter = { kicker: string; title: string; body: string; image: StaticImageData; alt: string };

const CHAPTERS: Chapter[] = [
  {
    kicker: "Golden hour",
    title: "A skyline, assembled",
    body: "Vishaks Central is a design study for a business district: six towers around a landscaped plaza, planned as one composition rather than six separate plots.",
    image: districtGolden,
    alt: "Aerial view at golden hour of six glass towers around a landscaped plaza with a long reflecting pool.",
  },
  {
    kicker: "Dusk",
    title: "Glass that reads the sun",
    body: "Deep mullions, stone set-back ledges and faceted curtain walls break the light differently on every face, so the towers change through the day.",
    image: districtDusk,
    alt: "Looking up at the district's glass towers at dusk, their facades catching warm and cool light.",
  },
  {
    kicker: "Crown",
    title: "Crowned in light",
    body: "A screened lantern and a bronze spire finish the central tower, so it reads as a landmark from the coast road after dark.",
    image: districtCrown,
    alt: "The crown of the central tower: a screened lantern storey lit warm from inside, and a slender bronze spire.",
  },
  {
    kicker: "Night",
    title: "After hours",
    body: "When the offices empty, the plaza, restaurants and residences keep the district lit and busy, so it never becomes a business park at night.",
    image: districtNight,
    alt: "The district at night from street level: lit offices, a mixed-use podium and traffic along the ring road.",
  },
];

const noop = () => () => {};

export function SkylineSection() {
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  return capable ? <PinnedSkyline /> : <StillSkyline />;
}

function SectionIntro({ dark = true }: { dark?: boolean }) {
  return (
    <div className="max-w-xl">
      <p className={`label ${dark ? "text-ivory/60" : "text-muted"}`}>Vishaks Central · design study</p>
      <h2 className="mt-4 text-display-l">A district, not a plot</h2>
    </div>
  );
}

/** Live version: the district stays on screen while scrolling moves the camera through four chapters. */
function PinnedSkyline() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const rise = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [quality] = useState<"high" | "lite">(() =>
    typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) >= 8 ? "high" : "lite",
  );

  // Load the scene a screen ahead; render only while the section is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) setNear(true);
      setActive(!!e?.isIntersecting);
    }, { rootMargin: "100% 0px 100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      ensureGsap();
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "+=380%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          progress.current = self.progress;
          rise.current = Math.min(1, self.progress / 0.16);
          const c = Math.min(CHAPTERS.length - 1, Math.floor(self.progress * CHAPTERS.length * 0.999));
          if (c !== chapterRef.current) {
            chapterRef.current = c;
            setChapter(c);
            setFocusId(null); // moving to another chapter releases a focused tower
          }
        },
      });
      // Towers start rising as the section scrolls into view, before the pin engages.
      ScrollTrigger.create({
        trigger: section.current,
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => {
          if (progress.current === 0) rise.current = self.progress * 0.35;
        },
      });
      return () => st.kill();
    },
    { scope: section },
  );

  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocusId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  const onDistrict = useCallback((d: District) => setDistrict(d), []);
  const focus = district?.towers.find((t) => t.id === focusId) ?? null;
  const current = CHAPTERS[chapter] ?? CHAPTERS[0]!;

  return (
    <section ref={section} id="skyline" aria-labelledby="skyline-title" className="on-dark relative h-[100svh] overflow-hidden bg-ink text-ivory">
      <div className="absolute inset-0" data-cursor="drag">
        {/* Still frame for the current chapter sits underneath until the scene is ready, and if it fails. */}
        <Image src={current.image} alt="" fill sizes="100vw" className="object-cover" placeholder="blur" />
        {near && !failed && (
          <ErrorBoundary fallback={null} onError={() => setFailed(true)}>
            <SkylineCanvas
              progress={progress}
              pointer={pointer}
              rise={rise}
              focusId={focusId}
              hoverId={hoverId}
              onHover={setHoverId}
              onSelect={setFocusId}
              onDistrict={onDistrict}
              active={active}
              quality={quality}
            />
          </ErrorBoundary>
        )}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/70 to-transparent" />

      <div className="gutter shell pointer-events-none relative flex h-full flex-col justify-between pb-10 pt-28 md:pt-32">
        <div id="skyline-title" className="pointer-events-auto">
          <SectionIntro />
        </div>

        <div className="grid items-end gap-8 md:grid-cols-12">
          <div className="relative min-h-[14rem] md:col-span-5" aria-live="polite">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.title}
                aria-hidden={i !== chapter}
                className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-[var(--ease-architect)] ${
                  i === chapter && !focus ? "translate-y-0 opacity-100" : i < chapter ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                }`}
              >
                <p className="label text-bronze-light">
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span> / {String(CHAPTERS.length).padStart(2, "0")} · {c.kicker}
                </p>
                <h3 className="mt-4 text-display-m">{c.title}</h3>
                <p className="mt-4 max-w-md text-ivory/75">{c.body}</p>
              </div>
            ))}
            {focus && (
              <div className="pointer-events-auto absolute inset-x-0 bottom-0 border border-line-light bg-ink/80 p-6 backdrop-blur-md md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="label text-bronze-light">{focus.type} · concept</p>
                  <button
                    type="button"
                    onClick={() => setFocusId(null)}
                    className="-mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory"
                  >
                    <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                <h3 className="mt-3 text-display-m">{focus.name}</h3>
                <p className="mt-4 text-ivory/75">{focus.blurb}</p>
                <p className="label mt-6 text-ivory/50">{focus.floors} storeys in the concept model</p>
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex flex-col gap-4 md:col-span-6 md:col-start-7 md:items-end">
            <div role="group" aria-label="Towers in the district" className="-mx-1 flex flex-wrap gap-2 px-1 md:justify-end">
              {(district?.towers ?? []).map((t) => {
                const on = t.id === focusId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onMouseEnter={() => setHoverId(t.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setFocusId(on ? null : t.id)}
                    className={`rounded-full border px-4 py-2 text-[0.85rem] backdrop-blur-sm transition-colors duration-300 ${
                      on ? "border-ivory bg-ivory text-ink" : "border-ivory/30 bg-ink/30 text-ivory/85 hover:border-ivory/70"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full items-center gap-4 md:w-80">
              <span className="label text-ivory/50">Scroll</span>
              <span className="relative h-px flex-1 bg-ivory/20" aria-hidden="true">
                <span
                  className="absolute inset-y-0 left-0 bg-bronze-light transition-[width] duration-500"
                  style={{ width: `${((chapter + 1) / CHAPTERS.length) * 100}%` }}
                />
              </span>
              <span className="label tabular-nums text-ivory/70">
                {chapter + 1}/{CHAPTERS.length}
              </span>
            </div>
            <p className="label hidden text-ivory/45 md:block">Hover a tower for its name · click to fly in</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Reduced-motion and low-power version: the same four chapters as an editorial sequence of stills. */
function StillSkyline() {
  return (
    <section id="skyline" aria-labelledby="skyline-still-title" className="on-dark bg-ink py-28 text-ivory md:py-40">
      <div className="gutter shell">
        <div id="skyline-still-title">
          <SectionIntro />
        </div>
        <ol className="mt-16 space-y-20 md:mt-24 md:space-y-32">
          {CHAPTERS.map((c, i) => (
            <li key={c.title} className="grid items-end gap-8 md:grid-cols-12">
              <figure className={`md:col-span-8 ${i % 2 ? "md:col-start-5" : ""}`}>
                <div data-reveal="clip" className="relative aspect-[16/9] overflow-hidden bg-ink-3">
                  <Image src={c.image} alt={c.alt} fill sizes="(min-width: 768px) 66vw, 100vw" placeholder="blur" className="object-cover" />
                </div>
                <figcaption className="label mt-3 text-ivory/50">Vishaks Central. Concept visualisation.</figcaption>
              </figure>
              <div className={`md:col-span-4 ${i % 2 ? "md:col-start-1 md:row-start-1" : ""}`}>
                <p className="label text-bronze-light">
                  {String(i + 1).padStart(2, "0")} · {c.kicker}
                </p>
                <h3 className="mt-4 text-display-m">{c.title}</h3>
                <p className="mt-4 text-ivory/75">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
