import type { StaticImageData } from "next/image";
import districtCrown from "@/public/images/concepts/district-crown.jpg";
import districtDusk from "@/public/images/concepts/district-dusk.jpg";
import districtGolden from "@/public/images/concepts/district-golden.jpg";
import districtNight from "@/public/images/concepts/district-night.jpg";

/**
 * Points of interest in the hero's corporate district, Vishaks Central (a
 * design study). Each has a marker position, a camera view the hero flies to,
 * and a still used when live 3D is not running. Scene units are metres; see
 * lib/three/builders/district.ts for the layout.
 */
export type HeroFeature = {
  id: string;
  label: string;
  title: string;
  kicker: string;
  body: string;
  anchor: [number, number, number];
  camera: { position: [number, number, number]; target: [number, number, number] };
  still: { src: StaticImageData; alt: string };
};

const golden = { src: districtGolden, alt: "Aerial view of the district's glass towers around a central plaza." };

export const HERO_FEATURES: HeroFeature[] = [
  {
    id: "central",
    label: "Vishaks Central",
    kicker: "Grade A office tower · 52 storeys",
    title: "A landmark crown",
    body: "The tallest tower steps back twice and finishes in a screened lantern and a bronze spire, so it reads from the coast road.",
    anchor: [0, 226, 0],
    camera: { position: [-96, 212, 118], target: [0, 196, 0] },
    still: { src: districtCrown, alt: "The crown of the central tower: a lantern storey and a slender bronze spire." },
  },
  {
    id: "harbour",
    label: "Harbour House",
    kicker: "Corporate headquarters · 38 storeys",
    title: "Sixteen facets of glass",
    body: "A faceted oval tower sized for a single headquarters occupier, its glass catching the light differently through the day.",
    anchor: [78, 128, -46],
    camera: { position: [196, 116, 52], target: [74, 100, -46] },
    still: { src: districtDusk, alt: "Glass towers of the district catching warm and cool light." },
  },
  {
    id: "exchange",
    label: "The Exchange",
    kicker: "Office slab · 30 storeys",
    title: "Large-floor offices",
    body: "Long, wide floor plates for occupiers who need large teams on one level, with the core pushed to the ends.",
    anchor: [-86, 100, -30],
    camera: { position: [-196, 82, 76], target: [-86, 74, -30] },
    still: golden,
  },
  {
    id: "meridian",
    label: "Meridian",
    kicker: "Residences · 44 storeys",
    title: "Live next to work",
    body: "A slim residential tower in bronze-tinted glass on the plaza, so people can live a short walk from the office.",
    anchor: [-40, 136, 88],
    camera: { position: [-150, 96, 214], target: [-40, 104, 88] },
    still: golden,
  },
  {
    id: "pavilion",
    label: "Pavilion",
    kicker: "Mixed-use podium · 12 storeys",
    title: "Shops, food and a conference hall",
    body: "A low, wide building that keeps the district busy after office hours, opening onto the plaza on every side.",
    anchor: [62, 52, 74],
    camera: { position: [150, 42, 196], target: [62, 26, 74] },
    still: { src: districtNight, alt: "The district at night from street level, with lit offices and traffic." },
  },
  {
    id: "plaza",
    label: "The plaza",
    kicker: "Public realm",
    title: "A plaza built for people",
    body: "Granite promenades, a long reflecting pool and crossings on every side, so the district is walked, not just driven to.",
    anchor: [0, 6, 150],
    camera: { position: [-58, 9, 252], target: [0, 9, 140] },
    still: golden,
  },
];

export function getHeroFeature(id: string | null | undefined) {
  return HERO_FEATURES.find((f) => f.id === id) ?? null;
}
