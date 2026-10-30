"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { conceptImages } from "@/data/projects";
import { site } from "@/data/site";
import { canRunHero3D } from "@/lib/capability";
import { ensureGsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CATEGORIES, CENTRE, COAST, CORRIDOR_PATHS, svgPath, ZONES, type CategoryId, type CorridorCode } from "@/lib/three/corridors";

const CorridorCanvas = dynamic(() => import("@/components/three/CorridorCanvas"), { ssr: false });
const noop = () => () => {};

/** A concept visualisation for each kind of space, shown when it is selected. */
const VISUAL: Record<CategoryId, { src: StaticImageData; alt: string }> = {
  office: conceptImages.officeExterior,
  residential: conceptImages.residentialHero,
  retail: conceptImages.retailStreet,
  coworking: conceptImages.coworkingExterior,
};

const corridorName = (code: CorridorCode) => site.corridors.find((c) => c.code === code)?.name ?? code;
const corridorNote = (code: CorridorCode) => site.corridors.find((c) => c.code === code)?.note ?? "";

/** "Where we build": a live 3D map of four kinds of space on four corridors, with an interactive schematic as the fallback. */
export function CorridorModel() {
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<CorridorCode | null>(null);
  const [focus, setFocus] = useState<CorridorCode | null>(null);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const show3d = capable && !failed;

  useEffect(() => {
    const el = stage.current;
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

  useEffect(() => {
    const el = stage.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    };
    const leave = () => (pointer.current = { x: 0, y: 0 });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  useGSAP(
    () => {
      ensureGsap();
      const st = ScrollTrigger.create({
        trigger: stage.current,
        start: "top 90%",
        end: "bottom 60%",
        onUpdate: (self) => (progress.current = self.progress),
      });
      return () => st.kill();
    },
    { scope: stage },
  );

  const toggle = (c: CorridorCode) => setFocus((f) => (f === c ? null : c));
  const index = CATEGORIES.findIndex((c) => c.corridor === focus);
  const chosen = index >= 0 ? CATEGORIES[index] : null;
  const step = (d: 1 | -1) => setFocus(CATEGORIES[(index + d + CATEGORIES.length) % CATEGORIES.length]!.corridor);

  return (
    <div className="mt-28 grid gap-12 border-t border-line pt-14 md:mt-40 md:grid-cols-12">
      <div className="md:col-span-4">
        <p className="label text-muted">Where we build</p>
        <h3 data-reveal="fade" className="mt-5 text-display-m">
          Four corridors, four kinds of demand.
        </h3>
        <p className="mt-6 max-w-sm text-muted">Each growth corridor is earmarked for the kind of space its demand supports. Choose one to explore it.</p>
        <ul data-reveal="stagger" className="mt-8 space-y-2" aria-label="Kinds of space by corridor">
          {CATEGORIES.map((cat, i) => {
            const on = focus === cat.corridor;
            const hot = hover === cat.corridor;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(cat.corridor)}
                  onMouseEnter={() => setHover(cat.corridor)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(cat.corridor)}
                  onBlur={() => setHover(null)}
                  className={`group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${
                    on ? "border-ink bg-ink text-ivory shadow-[0_18px_40px_-24px_rgb(21_17_14/0.8)]" : hot ? "border-bronze/50 bg-paper" : "border-line bg-ivory hover:border-bronze/50"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[0.72rem] tabular-nums ${on ? "border-bronze-light text-bronze-light" : "border-bronze/40 text-bronze"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-display text-[1.3rem] leading-tight">{cat.title}</span>
                    <span className={`mt-0.5 block text-[0.88rem] ${on ? "text-ivory/65" : "text-muted"}`}>
                      {corridorName(cat.corridor)}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 ${on ? "rotate-90 text-bronze-light" : "text-muted group-hover:translate-x-0.5"}`} strokeWidth={1.6} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="label mt-6 text-muted">{show3d ? "Hover or tap a model to fly to it" : "Tap a zone on the map to explore it"}</p>
      </div>

      <figure className="md:col-span-8 md:col-start-5">
        <div className="relative">
          <div
            ref={stage}
            data-reveal="clip"
            data-cursor={show3d ? "view" : undefined}
            className={`relative overflow-hidden rounded-[2px] bg-ink ${show3d ? "aspect-square sm:aspect-[5/4]" : "aspect-[6/5]"}`}
          >
            <Schematic
              focus={focus}
              hover={hover}
              onSelect={toggle}
              onHover={setHover}
              interactive={!show3d}
              className={`absolute inset-0 h-full w-full p-2 transition-opacity duration-1000 sm:p-6 ${show3d && live ? "pointer-events-none opacity-0" : "opacity-100"}`}
            />
            {show3d && near && (
              <div className={`absolute inset-0 transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}>
                <ErrorBoundary fallback={null} onError={() => setFailed(true)}>
                  <CorridorCanvas
                    progress={progress}
                    pointer={pointer}
                    focus={focus}
                    hover={hover}
                    onHover={setHover}
                    onSelect={toggle}
                    active={active}
                    reduced={reduced}
                    onReady={() => setLive(true)}
                    onFail={() => setFailed(true)}
                  />
                </ErrorBoundary>
              </div>
            )}
            {show3d && live && (
              <div aria-hidden="true" className="pointer-events-none absolute left-3 top-3 z-30 hidden flex-col gap-2 sm:flex rounded-xl border border-ivory/10 bg-ink/70 p-3 text-ivory backdrop-blur-md sm:left-4 sm:top-4">
                <Legend swatch="h-1 w-6 rounded-full bg-bronze-light" label="Growth corridor" />
                <Legend swatch="h-0 w-6 border-t-2 border-dashed border-[#8c9aa6]" label="Outer Ring Road" />
                <Legend swatch="h-3 w-3 rounded-full border-2 border-bronze-light bg-bronze-light/30" label="Target zone" />
              </div>
            )}
          </div>

          {chosen && (
            <div
              role="region"
              aria-live="polite"
              aria-label={`${chosen.title}, detail`}
              className="z-30 mt-4 overflow-hidden rounded-xl border border-ivory/10 bg-ink/92 text-ivory shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:absolute sm:bottom-4 sm:right-4 sm:top-4 sm:mt-0 sm:flex sm:w-[21rem] sm:flex-col sm:overflow-y-auto"
            >
              <div className="relative aspect-[16/7] overflow-hidden sm:aspect-[16/6]">
                <Image key={chosen.id} src={VISUAL[chosen.id].src} alt={VISUAL[chosen.id].alt} fill sizes="22rem" className="object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                <p className="label absolute bottom-3 left-5 text-bronze-light">
                  {chosen.corridor} · {corridorName(chosen.corridor)}
                </p>
                <button
                  type="button"
                  onClick={() => setFocus(null)}
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/30 bg-ink/50 backdrop-blur-sm hover:border-ivory"
                >
                  <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  <span className="sr-only">Back to all corridors</span>
                </button>
              </div>
              <div className="p-5">
                <p className="font-display text-[1.7rem] leading-tight">{chosen.title}</p>
                <p className="mt-1 text-[0.9rem] text-bronze-light">{chosen.tagline}</p>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ivory/75">{chosen.body}</p>
                <ul className="mt-4 space-y-1.5 text-[0.88rem] text-ivory/85">
                  {chosen.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bronze-light" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[0.8rem] text-ivory/50">Demand: {corridorNote(chosen.corridor)}. Area of interest only; no land acquired yet.</p>
                <div className="mt-5 flex items-center justify-between border-t border-ivory/10 pt-4">
                  <span className="label text-ivory/45">
                    {index + 1} / {CATEGORIES.length}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => step(-1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory">
                      <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                      <span className="sr-only">Previous kind of space</span>
                    </button>
                    <button type="button" onClick={() => step(1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 hover:border-ivory">
                      <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                      <span className="sr-only">Next kind of space</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <figcaption className="label mt-4 text-muted">
          {show3d ? "Illustrative model, not to scale." : "Schematic, not to scale."} Zones are areas of interest, not acquired land. Buildings are concept models.
        </figcaption>
      </figure>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`inline-block shrink-0 ${swatch}`} />
      <span className="label text-[0.62rem] sm:text-[0.7rem]">{label}</span>
    </span>
  );
}

/** Label placement in the schematic, nudged so no two labels collide. */
const LABEL_OFFSET: Record<CorridorCode, [number, number, "start" | "end"]> = {
  OMR: [-12, -22, "end"],
  GST: [-16, 4, "end"],
  SPR: [16, 4, "start"],
  ORR: [16, 4, "start"],
};

/** The flat schematic: the accessible description of the map, and the interactive fallback without 3D. */
function Schematic({
  className,
  focus,
  hover,
  onSelect,
  onHover,
  interactive,
}: {
  className?: string;
  focus: CorridorCode | null;
  hover: CorridorCode | null;
  onSelect: (c: CorridorCode) => void;
  onHover: (c: CorridorCode | null) => void;
  interactive: boolean;
}) {
  return (
    <svg viewBox="20 20 620 500" role="img" aria-labelledby="map-title map-desc" className={`text-ivory ${className ?? ""}`}>
      <title id="map-title">{"Schematic of Chennai's growth corridors and the kind of space planned on each"}</title>
      <desc id="map-desc">
        From the city centre on the coast, OMR runs south along the sea and is earmarked for office spaces. GST Road runs south-west past
        the airport, for residential spaces. The highway to Sriperumbudur runs west, for coworking spaces, and the Outer Ring Road arcs
        around the west of the city, for retail spaces. The zones are areas of interest, not acquired land.
      </desc>
      <path d={`${svgPath(COAST.slice(1, 3))} L 640 520 L 640 0 Z`} fill="#15212b" />
      <text x="592" y="250" fill="rgb(244 239 231 / 0.45)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.6" transform="rotate(90 592 250)" textAnchor="middle">
        BAY OF BENGAL
      </text>
      <path d={svgPath(COAST.slice(1, 3))} fill="none" stroke="#5a4c3d" strokeWidth="1.5" />
      <path d={svgPath(CORRIDOR_PATHS.ORR)} fill="none" stroke="#8c9aa6" strokeWidth="1.5" strokeDasharray="4 6" />
      <g fill="none" stroke="var(--color-bronze-light)" strokeWidth="2.5" strokeLinecap="round">
        {(["OMR", "GST", "SPR"] as const).map((c) => (
          <path key={c} d={svgPath(CORRIDOR_PATHS[c])} opacity={!focus || focus === c ? 1 : 0.3} />
        ))}
      </g>
      <circle cx={CENTRE[0]} cy={CENTRE[1]} r="6" fill="var(--color-ivory)" />
      <circle cx={CENTRE[0]} cy={CENTRE[1]} r="14" fill="none" stroke="var(--color-ivory)" strokeWidth="1" opacity="0.4" />
      <text x={CENTRE[0] - 12} y={CENTRE[1] - 20} textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="1.6" fill="var(--color-ivory)">
        CITY CENTRE
      </text>
      {CATEGORIES.map((cat) => {
        const [x, y] = ZONES[cat.corridor];
        const [dx, dy, anchor] = LABEL_OFFSET[cat.corridor];
        const on = focus === cat.corridor || hover === cat.corridor;
        return (
          <g
            key={cat.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : -1}
            aria-label={interactive ? `${cat.title}, ${cat.corridor}` : undefined}
            aria-pressed={interactive ? focus === cat.corridor : undefined}
            onClick={interactive ? () => onSelect(cat.corridor) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(cat.corridor);
                    }
                  }
                : undefined
            }
            onMouseEnter={interactive ? () => onHover(cat.corridor) : undefined}
            onMouseLeave={interactive ? () => onHover(null) : undefined}
            className={interactive ? "cursor-pointer outline-none" : undefined}
          >
            <circle cx={x} cy={y} r="26" fill="transparent" />
            <circle cx={x} cy={y} r={on ? 15 : 11} fill="rgb(199 156 112 / 0.18)" stroke="var(--color-bronze-light)" strokeWidth="1.5" className="transition-all duration-300" />
            <circle cx={x} cy={y} r="3.5" fill="var(--color-bronze-light)" />
            <text x={x + dx} y={y + dy - 7} textAnchor={anchor} fontFamily="var(--font-display)" fill="var(--color-ivory)" className="text-[25px] sm:text-[18px]">
              {cat.title}
            </text>
            <text x={x + dx} y={y + dy + 12} textAnchor={anchor} fontFamily="var(--font-mono)" letterSpacing="1.4" fill="var(--color-bronze-light)" className="text-[13px] sm:text-[10px]">
              {cat.corridor === "SPR" ? "SRIPERUMBUDUR" : cat.corridor === "ORR" ? "OUTER RING ROAD" : cat.corridor === "GST" ? "GST ROAD" : "OMR"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
