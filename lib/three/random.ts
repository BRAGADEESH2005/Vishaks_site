/**
 * Small seeded random helpers so procedural scenes render the same way on
 * every visit (and match the pre-rendered poster images).
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rng: Rng, min: number, max: number): number => min + (max - min) * rng();

export const pick = <T>(rng: Rng, items: readonly T[]): T => {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error("pick() called with an empty list");
  return item;
};
