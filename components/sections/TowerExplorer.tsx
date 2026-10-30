"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { conceptImages } from "@/data/projects";
import { canRunHero3D } from "@/lib/capability";

const TowerExplorerCanvas = dynamic(() => import("@/components/three/TowerExplorerCanvas"), { ssr: false });

const FLOORS = 34;
const SKY_GARDENS = new Set([12, 24]);
const noop = () => () => {};

/** Sample floor data for the concept tower. Illustrative only. */
function describeFloor(f: number) {
  if (SKY_GARDENS.has(f)) return { title: "Sky garden", lines: ["Planted terrace and residents' lounge", "No homes on this level"] };
  if (f <= 2) return { title: f === 1 ? "Lobby level" : "Amenity level", lines: ["Double-height arrival lobby", "Opens onto the podium deck"] };
  if (f >= 32) return { title: "Sky residences", lines: ["Two homes on this level", "4 bedrooms, around 3,400 sq ft each"] };
  return f % 2
    ? { title: "Typical floor A", lines: ["Four homes on this level", "3 bedrooms, around 1,850 sq ft each"] }
    : { title: "Typical floor B", lines: ["Four homes on this level", "2 and 3 bedrooms, 1,250 to 1,850 sq ft"] };
}

export function TowerExplorer() {
  const wrap = useRef<HTMLDivElement>(null);
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const [floor, setFloor] = useState<number | null>(18);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !capable) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [capable]);

  const info = floor ? describeFloor(floor) : null;
  const live = capable && inView && !failed;

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div ref={wrap} className="relative aspect-[4/5] overflow-hidden bg-ink-3 md:col-span-8 md:aspect-[16/11]">
        {!live && (
          <Image src={conceptImages.residentialFacade.src} alt={conceptImages.residentialFacade.alt} fill sizes="(min-width: 768px) 66vw, 100vw" className="object-cover opacity-80" />
        )}
        {live && (
          <ErrorBoundary fallback={null} onError={() => setFailed(true)}>
            <TowerExplorerCanvas selected={floor} onSelect={setFloor} />
          </ErrorBoundary>
        )}
        <p className="label pointer-events-none absolute bottom-4 left-4 text-ivory/70">
          {live ? "Drag to turn the model · select a floor" : "Still view · use the floor list to explore"}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:col-span-4">
        <div>
          <label htmlFor="floor-select" className="label text-ivory/55">
            Floor
          </label>
          <select
            id="floor-select"
            value={floor ?? ""}
            onChange={(e) => setFloor(e.target.value ? Number(e.target.value) : null)}
            className="mt-3 w-full rounded-none border border-ivory/30 bg-ink px-4 py-3 text-ivory"
          >
            {Array.from({ length: FLOORS }, (_, i) => FLOORS - i).map((f) => (
              <option key={f} value={f}>
                Level {f}
              </option>
            ))}
          </select>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setFloor((f) => Math.min(FLOORS, (f ?? 1) + 1))}
              className="flex-1 border border-ivory/30 py-2 text-[0.9rem] hover:border-ivory"
            >
              Up a floor
            </button>
            <button
              type="button"
              onClick={() => setFloor((f) => Math.max(1, (f ?? 2) - 1))}
              className="flex-1 border border-ivory/30 py-2 text-[0.9rem] hover:border-ivory"
            >
              Down a floor
            </button>
          </div>
        </div>
        {info && floor && (
          <div aria-live="polite" className="border-t border-line-light pt-8">
            <p className="label text-bronze-light">Level {floor}</p>
            <h3 className="mt-3 text-display-m">{info.title}</h3>
            <ul className="mt-5 space-y-2 text-ivory/75">
              {info.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="mt-8 text-[0.85rem] text-ivory/45">Sample floor data for the concept model. Not an offer of sale.</p>
          </div>
        )}
      </div>
    </div>
  );
}
