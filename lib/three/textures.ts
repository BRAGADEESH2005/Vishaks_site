import * as THREE from "three";
import { createRng, range, type Rng } from "./random";

/**
 * Procedural canvas textures. Everything here is generated at runtime in the
 * browser, so the project ships no third-party texture files.
 */

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return [c, ctx];
}

function toTexture(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: boolean; anisotropy?: number } = {}) {
  const tex = new THREE.CanvasTexture(c);
  if (opts.srgb ?? true) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = opts.anisotropy ?? 8;
  tex.needsUpdate = true;
  return tex;
}

export type FacadeOptions = {
  bays: number;
  floors: number;
  seed: number;
  /** 0..1 share of windows with lights on. */
  lit: number;
  /** Warm residential light or cooler office light. */
  light?: "warm" | "office";
  /** Height share of each floor taken by the opaque spandrel band. */
  spandrel?: number;
  /** Base tint of the glass. */
  glass?: string;
  cell?: number;
  repeat?: boolean;
  /** Base brightness of the glass (0..255). Higher reads as more reflective. */
  glassLevel?: number;
};

export type FacadeTextures = { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture };

/** A curtain-wall facade: glass, mullions, spandrels, and a pattern of lit rooms. */
export function makeFacadeTextures(o: FacadeOptions): FacadeTextures {
  const cell = o.cell ?? 32;
  const w = o.bays * cell;
  const h = o.floors * cell;
  const rng = createRng(o.seed);
  const spandrel = o.spandrel ?? 0.24;
  const [cMap, map] = canvas(w, h);
  const [cEm, em] = canvas(w, h);
  const [cRough, rough] = canvas(w, h);

  map.fillStyle = o.glass ?? "#1d2126";
  map.fillRect(0, 0, w, h);
  em.fillStyle = "#000";
  em.fillRect(0, 0, w, h);
  rough.fillStyle = "#1a1a1a"; // glass is glossy
  rough.fillRect(0, 0, w, h);

  const warm = ["#ffb569", "#ffc27f", "#ffa95a", "#ffd29a"];
  const office = ["#fff1d6", "#ffe8c2", "#f6f0e6"];
  const palette = o.light === "office" ? office : warm;

  for (let f = 0; f < o.floors; f++) {
    // Lights come in runs along a floor, like real apartments.
    let runLit = rng() < o.lit;
    for (let b = 0; b < o.bays; b++) {
      if (rng() < 0.45) runLit = rng() < o.lit;
      const x = b * cell;
      const y = (o.floors - 1 - f) * cell;
      const glassH = cell * (1 - spandrel);

      // Subtle glass tone variation: blinds, curtains, reflections.
      const tone = range(rng, -14, 14);
      const base = (o.glassLevel ?? 30) + tone;
      const grad = map.createLinearGradient(0, y, 0, y + glassH);
      grad.addColorStop(0, `rgb(${base + 10},${base + 12},${base + 16})`);
      grad.addColorStop(1, `rgb(${base - 6},${base - 4},${base})`);
      map.fillStyle = grad;
      map.fillRect(x, y, cell, glassH);
      if (rng() < 0.18) {
        // Drawn curtains read as lighter panels.
        map.fillStyle = `rgba(190,170,145,${range(rng, 0.25, 0.5)})`;
        map.fillRect(x + 2, y + 2, cell * range(rng, 0.3, 0.9), glassH - 3);
      }

      if (runLit) {
        const col = palette[Math.floor(rng() * palette.length)] ?? "#ffb569";
        const g = em.createLinearGradient(0, y, 0, y + glassH);
        const a = range(rng, 0.55, 1);
        g.addColorStop(0, col);
        g.addColorStop(1, shade(col, 0.45));
        em.globalAlpha = a;
        em.fillStyle = g;
        em.fillRect(x + 1, y + 1, cell - 2, glassH - 2);
        em.globalAlpha = 1;
        // A dark silhouette of furniture or a column inside some rooms.
        if (rng() < 0.4) {
          em.fillStyle = "rgba(0,0,0,0.55)";
          em.fillRect(x + range(rng, 3, cell - 10), y + glassH * 0.45, range(rng, 4, 10), glassH * 0.55);
        }
      }

      // Spandrel band.
      map.fillStyle = "#3a3632";
      map.fillRect(x, y + glassH, cell, cell - glassH);
      rough.fillStyle = "#9a9a9a";
      rough.fillRect(x, y + glassH, cell, cell - glassH);
    }
  }

  // Mullions.
  map.fillStyle = "#14110f";
  rough.fillStyle = "#777";
  for (let b = 0; b <= o.bays; b++) {
    map.fillRect(b * cell - 1, 0, 2, h);
    rough.fillRect(b * cell - 1, 0, 2, h);
  }
  for (let f = 0; f <= o.floors; f++) {
    map.fillRect(0, f * cell - 1, w, 2);
  }

  return {
    map: toTexture(cMap, { repeat: o.repeat }),
    emissiveMap: toTexture(cEm, { repeat: o.repeat }),
    roughnessMap: toTexture(cRough, { srgb: false, repeat: o.repeat }),
  };
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

function noiseFill(ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, base: [number, number, number], amp: number) {
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const n = (rng() - 0.5) * amp;
    img.data[i * 4] = base[0] + n;
    img.data[i * 4 + 1] = base[1] + n;
    img.data[i * 4 + 2] = base[2] + n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Honed stone cladding with panel joints; tiles at `panel` metres per texture. */
export function makeStoneTexture(seed = 7, tint: [number, number, number] = [196, 184, 166]) {
  const s = 512;
  const [c, ctx] = canvas(s, s);
  const rng = createRng(seed);
  noiseFill(ctx, s, s, rng, tint, 16);
  // Soft veining.
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = rng() > 0.5 ? "#6d6253" : "#fff6e8";
    ctx.lineWidth = range(rng, 1, 3);
    ctx.beginPath();
    const y = rng() * s;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.3, y + range(rng, -40, 40), s * 0.6, y + range(rng, -40, 40), s, y + range(rng, -30, 30));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Panel joints: 4 courses, staggered.
  ctx.fillStyle = "rgba(40,32,25,0.55)";
  for (let r = 0; r < 4; r++) {
    const y = (r * s) / 4;
    ctx.fillRect(0, y, s, 2);
    const off = r % 2 ? s / 4 : 0;
    for (let k = 0; k < 2; k++) ctx.fillRect(off + (k * s) / 2, y, 2, s / 4);
  }
  return toTexture(c, { repeat: true });
}

/** Concrete / ground textures with large-scale variation. */
export function makeGroundTexture(seed: number, base: [number, number, number], amp = 22, size = 512) {
  const [c, ctx] = canvas(size, size);
  const rng = createRng(seed);
  noiseFill(ctx, size, size, rng, base, amp);
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 60; i++) {
    const r = range(rng, 20, 120);
    const cx = rng() * size;
    const cy = rng() * size;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rng() > 0.5 ? "#000" : "#fff");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.globalAlpha = 1;
  return toTexture(c, { repeat: true });
}

/** A tileable normal map of gentle ripples, used for water. */
export function makeRippleNormal(seed = 3, size = 256) {
  const rng = createRng(seed);
  const height = new Float32Array(size * size);
  const waves = Array.from({ length: 14 }, () => ({
    kx: Math.round(range(rng, -6, 6)),
    ky: Math.round(range(rng, 1, 9)),
    p: rng() * Math.PI * 2,
    a: range(rng, 0.3, 1),
  }));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const w of waves) v += w.a * Math.sin(((w.kx * x + w.ky * y) / size) * Math.PI * 2 + w.p);
      height[y * size + x] = v;
    }
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)] ?? 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.18;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.18;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = (-dx / len) * 127 + 128;
      img.data[i + 1] = (-dy / len) * 127 + 128;
      img.data[i + 2] = (1 / len) * 127 + 128;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, { srgb: false, repeat: true });
}

/** A jaali (carved screen) pattern used as an alpha map, a nod to South Indian screens. */
export function makeJaaliAlpha(size = 256) {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000";
  const n = 4;
  const step = size / n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * step + step / 2;
      const cy = y * step + step / 2;
      // Eight-point star opening.
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? step * 0.2 : step * 0.4;
        const a = (i / 16) * Math.PI * 2;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      // Small diamond between stars.
      ctx.beginPath();
      const dx = x * step;
      const dy = y * step;
      const d = step * 0.1;
      ctx.moveTo(dx, dy - d);
      ctx.lineTo(dx + d, dy);
      ctx.lineTo(dx, dy + d);
      ctx.lineTo(dx - d, dy);
      ctx.closePath();
      ctx.fill();
    }
  return toTexture(c, { srgb: false, repeat: true });
}

/** A palm frond silhouette: rachis plus drooping leaflets. White = opaque. */
export function makeFrondAlpha(seed = 11) {
  const w = 128;
  const h = 512;
  const [c, ctx] = canvas(w, h);
  const rng = createRng(seed);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  for (let i = 8; i < h - 6; i += 7) {
    const t = i / h;
    const len = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (w / 2 - 4) * range(rng, 0.8, 1);
    ctx.lineWidth = 2.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(w / 2, i);
      ctx.quadraticCurveTo(w / 2 + s * len * 0.6, i + 6, w / 2 + s * len, i + 18 + len * 0.25);
      ctx.stroke();
    }
  }
  return toTexture(c, { srgb: false });
}

/**
 * Curtain-wall "oil-canning": every glass panel sits at a very slightly
 * different angle, so reflections break up panel by panel the way they do on
 * real towers. Returns a tileable normal map plus a matching roughness map.
 */
export function makePanelNormal(bays: number, floors: number, seed: number, cell = 16, strength = 0.06) {
  const rng = createRng(seed);
  const w = bays * cell;
  const h = floors * cell;
  const [cn, n] = canvas(w, h);
  const [cr, r] = canvas(w, h);
  for (let f = 0; f < floors; f++)
    for (let b = 0; b < bays; b++) {
      const tx = (rng() - 0.5) * strength;
      const ty = (rng() - 0.5) * strength;
      const len = Math.hypot(tx, ty, 1);
      n.fillStyle = `rgb(${Math.round((tx / len) * 127 + 128)},${Math.round((ty / len) * 127 + 128)},${Math.round((1 / len) * 127 + 128)})`;
      n.fillRect(b * cell, f * cell, cell, cell);
      const g = Math.round(range(rng, 10, 38));
      r.fillStyle = `rgb(${g},${g},${g})`;
      r.fillRect(b * cell, f * cell, cell, cell);
    }
  // Mullion and transom lines read as rough metal, flat to the panel.
  n.fillStyle = "rgb(128,128,255)";
  r.fillStyle = "rgb(150,150,150)";
  for (let b = 0; b <= bays; b++) {
    n.fillRect(b * cell - 1, 0, 2, h);
    r.fillRect(b * cell - 1, 0, 2, h);
  }
  for (let f = 0; f <= floors; f++) {
    n.fillRect(0, f * cell - 1, w, 2);
    r.fillRect(0, f * cell - 1, w, 2);
  }
  return { normal: toTexture(cn, { srgb: false, repeat: true }), roughness: toTexture(cr, { srgb: false, repeat: true }) };
}
