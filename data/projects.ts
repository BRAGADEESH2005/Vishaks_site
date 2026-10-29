import type { StaticImageData } from "next/image";
import ambalamExterior from "@/public/images/concepts/ambalam-exterior.jpg";
import ambalamLouvres from "@/public/images/concepts/ambalam-louvres.jpg";
import kadalDeck from "@/public/images/concepts/kadal-deck.jpg";
import kadalFacade from "@/public/images/concepts/kadal-facade.jpg";
import kadalHero from "@/public/images/concepts/kadal-hero.jpg";
import kadalStreet from "@/public/images/concepts/kadal-street.jpg";
import maruthamAerial from "@/public/images/concepts/marutham-aerial.jpg";
import maruthamAvenue from "@/public/images/concepts/marutham-avenue.jpg";
import sandhaiArcade from "@/public/images/concepts/sandhai-arcade.jpg";
import sandhaiStreet from "@/public/images/concepts/sandhai-street.jpg";

/**
 * SAMPLE CONTENT. These four developments are design concepts created for this
 * website prototype. They are not real projects, and every figure below is
 * illustrative, taken from the concept models. Replace this file with the
 * company's approved project data before publishing.
 */
export type ProjectImage = { src: StaticImageData; alt: string; caption: string };

export type Project = {
  slug: string;
  name: string;
  /** What the name means, shown as a small gloss. */
  meaning: string;
  segment: "residential" | "commercial";
  type: string;
  corridor: string;
  status: "Concept";
  summary: string;
  description: string[];
  facts: Array<{ label: string; value: string }>;
  specs: Array<{ group: string; items: Array<{ label: string; value: string }> }>;
  cover: ProjectImage;
  gallery: ProjectImage[];
  /** Offer the interactive 3D tower on the detail page. */
  explorer?: "tower";
};

export const conceptImages = {
  kadalHero: {
    src: kadalHero,
    alt: "Two slender residential towers with bronze fins and lit windows rising from a stone podium at dusk, palms along the street.",
    caption: "Kadal Residences at dusk. Concept visualisation.",
  },
  kadalFacade: {
    src: kadalFacade,
    alt: "Looking up the tower facade: staggered balconies, glass balustrades and deep floor slabs against a dark blue sky.",
    caption: "Staggered balconies on the south elevation. Concept visualisation.",
  },
  kadalDeck: {
    src: kadalDeck,
    alt: "A lap pool on a landscaped podium deck with palms, loungers and the towers lit by low evening sun.",
    caption: "The podium deck and lap pool. Concept visualisation.",
  },
  kadalStreet: {
    src: kadalStreet,
    alt: "Street-level view at blue hour: a warmly lit double-height lobby behind stone piers and a cantilevered canopy.",
    caption: "Arrival court at blue hour. Concept visualisation.",
  },
  maruthamAerial: {
    src: maruthamAerial,
    alt: "Aerial view of a plotted community in golden light: plots, tree-lined roads, villas and a central park with a pond.",
    caption: "Marutham, plotted community layout. Concept visualisation.",
  },
  maruthamAvenue: {
    src: maruthamAvenue,
    alt: "Eye-level view along a tree-lined internal road with low compound walls and two-storey villas.",
    caption: "An internal avenue. Concept visualisation.",
  },
  ambalamExterior: {
    src: ambalamExterior,
    alt: "An office building with stone end cores and bronze horizontal sunshades, a long water channel leading to the entrance.",
    caption: "Ambalam Offices from the forecourt. Concept visualisation.",
  },
  ambalamLouvres: {
    src: ambalamLouvres,
    alt: "Looking up at layered bronze sunshades and glazing on an office facade.",
    caption: "Deep bronze sunshades on the long elevations. Concept visualisation.",
  },
  sandhaiStreet: {
    src: sandhaiStreet,
    alt: "A four-storey building with a terracotta jaali screen above a lit stone colonnade at dusk, palms along the road.",
    caption: "Sandhai from the street. Concept visualisation.",
  },
  sandhaiArcade: {
    src: sandhaiArcade,
    alt: "Under a deep stone colonnade: tall columns, warm shopfronts and long evening shadows on the pavement.",
    caption: "The shaded colonnade. Concept visualisation.",
  },
} satisfies Record<string, ProjectImage>;

const img = conceptImages;

export const projects: Project[] = [
  {
    slug: "kadal-residences",
    name: "Kadal Residences",
    meaning: "Kadal means sea in Tamil",
    segment: "residential",
    type: "Residential towers",
    corridor: "OMR corridor",
    status: "Concept",
    summary: "Two slender towers on a landscaped podium, turned to catch the sea breeze and shaded by bronze fins.",
    description: [
      "A concept for the coastal side of the IT corridor. Two towers stand on a shared podium so that the ground plane can be given back to landscape: a lap pool, a lawn under shade trees and palms along the street.",
      "Each tower is wrapped in deep floor slabs and staggered balconies that shade the glass from the afternoon sun. Bronze fins on the side elevations cut glare while keeping views open toward the coast.",
    ],
    facts: [
      { label: "Type", value: "Residential towers" },
      { label: "Location", value: "OMR corridor, Chennai" },
      { label: "Status", value: "Concept, not yet launched" },
    ],
    specs: [
      {
        group: "Built form (concept model)",
        items: [
          { label: "Towers", value: "Two, of 34 and 26 storeys" },
          { label: "Podium", value: "Double-height lobby with a stone upper level" },
          { label: "Crown", value: "Setback pavilion with a bronze pergola and roof garden" },
        ],
      },
      {
        group: "Landscape",
        items: [
          { label: "Podium deck", value: "28 m lap pool, lawn and shade trees" },
          { label: "Sky gardens", value: "Recessed planted floors partway up each tower" },
          { label: "Street", value: "Palm-lined frontage with a shaded arrival court" },
        ],
      },
      {
        group: "Facade",
        items: [
          { label: "Main elevation", value: "Staggered balconies with glass balustrades" },
          { label: "Side elevations", value: "Vertical bronze fins of varying depth" },
        ],
      },
    ],
    cover: img.kadalHero,
    gallery: [img.kadalHero, img.kadalFacade, img.kadalDeck, img.kadalStreet],
    explorer: "tower",
  },
  {
    slug: "marutham",
    name: "Marutham",
    meaning: "Marutham is the Sangam-era name for fertile farmland",
    segment: "residential",
    type: "Plotted community",
    corridor: "GST Road belt",
    status: "Concept",
    summary: "An approved-layout plotted community with roads, drainage, avenue trees and a park laid before the first plot is sold.",
    description: [
      "A concept for a gated plotted community on the southern belt. Roads, kerbs, a central park and avenue planting are built first, so buyers see the finished setting of their plot rather than a bare field.",
      "Plots are sized in grounds, the way Chennai buys land, and arranged in pairs of rows along shaded internal roads. Compound walls and the planting edge are handed over with each plot.",
    ],
    facts: [
      { label: "Type", value: "Plotted community" },
      { label: "Location", value: "GST Road belt, Chennai" },
      { label: "Status", value: "Concept, not yet launched" },
    ],
    specs: [
      {
        group: "Layout (concept model)",
        items: [
          { label: "Plots", value: "96 in the concept layout" },
          { label: "Plot size", value: "Around 1.4 grounds each in the model (1 ground = 2,400 sq ft)" },
          { label: "Internal roads", value: "10 m, with kerbs and avenue trees" },
        ],
      },
      {
        group: "Open space",
        items: [
          { label: "Central park", value: "A planted strip with a pond through the middle of the layout" },
          { label: "Entrance", value: "Stone pylons and a palm avenue" },
        ],
      },
    ],
    cover: img.maruthamAerial,
    gallery: [img.maruthamAerial, img.maruthamAvenue],
  },
  {
    slug: "ambalam-offices",
    name: "Ambalam Offices",
    meaning: "Ambalam is a Tamil word for a public hall",
    segment: "commercial",
    type: "Grade A offices",
    corridor: "OMR corridor",
    status: "Concept",
    summary: "Two Grade A office blocks with wide floor plates, deep bronze sunshades and a shaded forecourt with a water channel.",
    description: [
      "A concept for technology and services occupiers on the IT corridor. Two blocks frame a shaded forecourt; a long water channel leads from the street to a cantilevered entrance canopy.",
      "The long elevations face north and south behind deep bronze sunshades, which cut solar gain while keeping the view out. Solid stone cores at each end hold stairs, lifts and services, leaving the floor plate open.",
    ],
    facts: [
      { label: "Type", value: "Grade A offices" },
      { label: "Location", value: "OMR corridor, Chennai" },
      { label: "Status", value: "Concept, not yet launched" },
    ],
    specs: [
      {
        group: "Workspace (concept model)",
        items: [
          { label: "Blocks", value: "Two, of 11 and 8 storeys" },
          { label: "Typical floor plate", value: "Around 17,900 sq ft in the larger block" },
          { label: "Floor to floor", value: "4.2 m" },
        ],
      },
      {
        group: "Environment",
        items: [
          { label: "Sunshading", value: "Two tiers of bronze louvres on each long elevation" },
          { label: "Forecourt", value: "Shade-tree grove, benches and a water channel" },
        ],
      },
    ],
    cover: img.ambalamExterior,
    gallery: [img.ambalamExterior, img.ambalamLouvres],
  },
  {
    slug: "sandhai",
    name: "Sandhai",
    meaning: "Sandhai means market in Tamil",
    segment: "commercial",
    type: "Retail and workspace",
    corridor: "Outer Ring Road West",
    status: "Concept",
    summary: "A street-facing retail and workspace block: shopfronts under a deep stone colonnade, offices behind a terracotta jaali screen.",
    description: [
      "A concept for neighbourhood retail on the western ring, where new housing needs shops, clinics and small offices within walking distance.",
      "A deep stone colonnade shades the shopfronts and the pavement in front of them. The upper floors sit behind a terracotta screen cut in a jaali pattern, which filters light and gives the building one quiet, continuous face to the street.",
    ],
    facts: [
      { label: "Type", value: "Retail and workspace" },
      { label: "Location", value: "Outer Ring Road West, Chennai" },
      { label: "Status", value: "Concept, not yet launched" },
    ],
    specs: [
      {
        group: "Built form (concept model)",
        items: [
          { label: "Storeys", value: "Four, with a roof terrace" },
          { label: "Street frontage", value: "Around 96 m" },
          { label: "Colonnade", value: "4.5 m deep, shading the shopfronts" },
        ],
      },
      {
        group: "Facade",
        items: [
          { label: "Upper floors", value: "Workspace behind a terracotta jaali screen" },
          { label: "Roof", value: "Terrace with a bronze pergola and planting" },
        ],
      },
    ],
    cover: img.sandhaiStreet,
    gallery: [img.sandhaiStreet, img.sandhaiArcade],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
