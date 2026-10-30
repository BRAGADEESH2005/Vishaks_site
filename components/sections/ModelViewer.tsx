"use client";

import { Moon, Pause, Play, RotateCcw, Sun, Sunrise, Sunset } from "lucide-react";
import dynamic from "next/dynamic";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { canRunHero3D } from "@/lib/capability";
import type { AtmosphereId } from "@/lib/three/atmosphere";
import { MODEL_VIEWS } from "@/lib/three/modelViews";

const ModelViewerCanvas = dynamic(() => import("@/components/three/ModelViewerCanvas"), { ssr: false });
const noop = () => () => {};

const LIGHTS: Array<{ id: AtmosphereId; label: string; Icon: typeof Sun }> = [
  { id: "daylight", label: "Day", Icon: Sun },
  { id: "golden", label: "Golden hour", Icon: Sunrise },
  { id: "dusk", label: "Dusk", Icon: Sunset },
  { id: "blue", label: "Night", Icon: Moon },
];

export function ModelViewer({ slug, name, poster }: { slug: string; name: string; poster: { src: StaticImageData; alt: string } }) {
  const view = MODEL_VIEWS[slug];
  const capable = useSyncExternalStore(noop, canRunHero3D, () => false);
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<AtmosphereId>("golden");
  const [spin, setSpin] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setNear(true);
        setActive(!!e?.isIntersecting);
      },
      { rootMargin: "40% 0px 40% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!view) return null;
  const live = capable && !failed;

  return (
    <div>
      <div ref={box} data-reveal="clip" data-cursor={live ? "drag" : undefined} className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-ink-3 sm:aspect-[16/9]">
        <Image src={poster.src} alt={live ? "" : poster.alt} fill sizes="100vw" placeholder="blur" className="object-cover" />
        {live && near && (
          <div className="absolute inset-0">
            <ErrorBoundary fallback={null} onError={() => setFailed(true)}>
              <ModelViewerCanvas key={key} view={view} preset={preset} spin={spin} active={active} onInteract={() => setSpin(false)} />
            </ErrorBoundary>
          </div>
        )}
        {live && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-16 md:p-6 md:pt-20">
            <div role="group" aria-label={`Lighting for the ${name} model`} className="pointer-events-auto flex flex-wrap rounded-full border border-ivory/25 bg-ink/40 p-0.5 backdrop-blur-md">
              {LIGHTS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={preset === id}
                  onClick={() => setPreset(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] transition-colors duration-300 ${preset === id ? "bg-ivory text-ink" : "text-ivory/80 hover:text-ivory"}`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {label}
                </button>
              ))}
            </div>
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                onClick={() => setSpin((s) => !s)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-ivory/25 bg-ink/40 px-4 text-[0.8rem] text-ivory backdrop-blur-md hover:border-ivory"
              >
                {spin ? <Pause aria-hidden="true" className="h-3.5 w-3.5" /> : <Play aria-hidden="true" className="h-3.5 w-3.5" />}
                {spin ? "Pause turntable" : "Turntable"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setKey((k) => k + 1);
                  setSpin(true);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/25 bg-ink/40 text-ivory backdrop-blur-md hover:border-ivory"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
                <span className="sr-only">Reset the view</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="label mt-4 text-ivory/50">
        {live ? "Drag to turn, scroll or pinch to zoom. Concept model, illustrative only." : "Concept visualisation. The interactive model runs on devices with 3D support."}
      </p>
    </div>
  );
}
