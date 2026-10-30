import * as THREE from "three";

/**
 * Geometry of the corridor schematic, shared by the 3D map and its SVG
 * fallback. Coordinates come from the 640 x 520 schematic and are mapped to
 * world units as x - 320, z = y - 260. It is a diagram, not a survey: nothing
 * here is to scale or marks land the company owns.
 */
export type CorridorCode = "OMR" | "GST" | "SPR" | "ORR";

type P = [number, number];
const w = ([x, y]: P, h = 0) => new THREE.Vector3(x - 320, h, y - 260);

export const CENTRE: P = [465, 168];

export const CORRIDOR_PATHS: Record<CorridorCode, P[][]> = {
  OMR: [[[470, 170], [480, 260], [495, 360], [510, 500]]],
  GST: [[[462, 176], [420, 250], [360, 330], [300, 470]]],
  SPR: [[[456, 168], [380, 175], [240, 190], [40, 200]]],
  ORR: [
    [[470, 470], [300, 470], [150, 380], [150, 250]],
    [[150, 250], [150, 140], [250, 60], [430, 40]],
  ],
};

/** Target zones: indicative areas of interest, not acquired land. */
export const ZONES: Record<CorridorCode, P> = {
  OMR: [500, 390],
  GST: [340, 400],
  SPR: [120, 197],
  ORR: [168, 300],
};

/** Coast as cubic segments, north to south. */
export const COAST: P[][] = [
  [[520, -260], [520, -150], [516, -60], [520, 0]],
  [[520, 0], [505, 90], [540, 170], [520, 260]],
  [[520, 260], [500, 350], [548, 420], [560, 520]],
  [[560, 520], [572, 640], [575, 760], [585, 900]],
];

export function svgPath(segments: P[][]) {
  return segments
    .map((s, i) => `${i === 0 ? `M${s[0]![0]} ${s[0]![1]} ` : ""}C ${s[1]![0]} ${s[1]![1]}, ${s[2]![0]} ${s[2]![1]}, ${s[3]![0]} ${s[3]![1]}`)
    .join(" ");
}

export function curveOf(segments: P[][], h = 0) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (const s of segments) path.add(new THREE.CubicBezierCurve3(w(s[0]!, h), w(s[1]!, h), w(s[2]!, h), w(s[3]!, h)));
  return path;
}

export const toWorld = w;

/**
 * The kind of space each target zone is earmarked for. These are planning
 * intentions to confirm with the company, not projects or land holdings.
 * Reassign a category by changing its corridor here.
 */
export type CategoryId = "office" | "retail" | "coworking" | "residential";

export type Category = {
  id: CategoryId;
  title: string;
  corridor: CorridorCode;
  tagline: string;
  body: string;
  points: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "office",
    title: "Office Spaces",
    corridor: "OMR",
    tagline: "Grade A towers on the IT corridor",
    body: "Glass office towers and business parks sized for technology and services occupiers who want large, efficient floor plates near the coast.",
    points: ["Grade A towers and business parks", "Large, column-free floor plates", "Leased and held as income assets"],
  },
  {
    id: "residential",
    title: "Residential Spaces",
    corridor: "GST",
    tagline: "High-rise living on the airport belt",
    body: "Residential towers and gated apartment communities for households who work across the southern city and want rail and airport access.",
    points: ["High-rise apartment towers", "Gated residential communities", "Sold after TNRERA registration"],
  },
  {
    id: "coworking",
    title: "Coworking Spaces",
    corridor: "SPR",
    tagline: "Flexible workspace for the industrial belt",
    body: "Managed, flexible workspace and meeting suites for the engineering, supplier and management teams around the automotive and electronics belt.",
    points: ["Flexible desks and private suites", "Meeting and training rooms", "Operated with a workspace partner"],
  },
  {
    id: "retail",
    title: "Retail Spaces",
    corridor: "ORR",
    tagline: "High-street retail on the ring road",
    body: "Shopping centres, showrooms and high-street retail on the larger parcels of the western ring, where the radial corridors meet.",
    points: ["Shopping centres and high streets", "Showrooms with road frontage", "Leased to brands and operators"],
  },
];

export const categoryFor = (code: CorridorCode) => CATEGORIES.find((c) => c.corridor === code)!;
