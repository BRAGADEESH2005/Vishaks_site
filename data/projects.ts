import type { StaticImageData } from "next/image";
import officeExterior from "@/public/images/concepts/office-exterior.jpg";
import officeLouvres from "@/public/images/concepts/office-louvres.jpg";
import residentialDeck from "@/public/images/concepts/residential-deck.jpg";
import residentialFacade from "@/public/images/concepts/residential-facade.jpg";
import residentialHero from "@/public/images/concepts/residential-hero.jpg";
import residentialStreet from "@/public/images/concepts/residential-street.jpg";
import coworkingExterior from "@/public/images/concepts/coworking-exterior.jpg";
import coworkingTerrace from "@/public/images/concepts/coworking-terrace.jpg";
import retailArcade from "@/public/images/concepts/retail-arcade.jpg";
import retailStreet from "@/public/images/concepts/retail-street.jpg";

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
  /** One line on what the concept is, shown under the name. */
  tagline: string;
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
  residentialHero: {
    src: residentialHero,
    alt: "Two slender residential towers with bronze fins and lit windows rising from a stone podium at dusk, palms along the street.",
    caption: "Residential Spaces at dusk. Concept visualisation.",
  },
  residentialFacade: {
    src: residentialFacade,
    alt: "Looking up the tower facade: staggered balconies, glass balustrades and deep floor slabs against a dark blue sky.",
    caption: "Staggered balconies on the south elevation. Concept visualisation.",
  },
  residentialDeck: {
    src: residentialDeck,
    alt: "A lap pool on a landscaped podium deck with palms, loungers and the towers lit by low evening sun.",
    caption: "The podium deck and lap pool. Concept visualisation.",
  },
  residentialStreet: {
    src: residentialStreet,
    alt: "Street-level view at blue hour: a warmly lit double-height lobby behind stone piers and a cantilevered canopy.",
    caption: "Arrival court at blue hour. Concept visualisation.",
  },
  coworkingExterior: {
    src: coworkingExterior,
    alt: "A low-rise workspace campus of two office blocks with bronze sunshades and stone cores, a glass meeting pavilion on the roof, over a granite forecourt.",
    caption: "Coworking Spaces from the forecourt. Concept visualisation.",
  },
  coworkingTerrace: {
    src: coworkingTerrace,
    alt: "The roof of the workspace campus at dusk: a lit glass meeting pavilion and shared terraces behind glass balustrades.",
    caption: "The rooftop meeting pavilion and terraces. Concept visualisation.",
  },
  officeExterior: {
    src: officeExterior,
    alt: "An office building with stone end cores and bronze horizontal sunshades, a long water channel leading to the entrance.",
    caption: "Office Spaces from the forecourt. Concept visualisation.",
  },
  officeLouvres: {
    src: officeLouvres,
    alt: "Looking up at layered bronze sunshades and glazing on an office facade.",
    caption: "Deep bronze sunshades on the long elevations. Concept visualisation.",
  },
  retailStreet: {
    src: retailStreet,
    alt: "A four-storey building with a terracotta jaali screen above a lit stone colonnade at dusk, palms along the road.",
    caption: "Retail Spaces from the street. Concept visualisation.",
  },
  retailArcade: {
    src: retailArcade,
    alt: "Under a deep stone colonnade: tall columns, warm shopfronts and long evening shadows on the pavement.",
    caption: "The shaded colonnade. Concept visualisation.",
  },
} satisfies Record<string, ProjectImage>;

const img = conceptImages;

export const projects: Project[] = [
  {
    slug: "office-spaces",
    name: "Office Spaces",
    tagline: "Grade A workplaces on the IT corridor",
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
          { label: "Forecourt", value: "Shaded seating and a water channel" },
        ],
      },
    ],
    cover: img.officeExterior,
    gallery: [img.officeExterior, img.officeLouvres],
  },
  {
    slug: "residential-spaces",
    name: "Residential Spaces",
    tagline: "High-rise living on the airport belt",
    segment: "residential",
    type: "Residential towers",
    corridor: "GST Road belt",
    status: "Concept",
    summary: "Two slender towers on a landscaped podium, turned to catch the prevailing breeze and shaded by bronze fins.",
    description: [
      "A concept for the southern belt along GST Road, close to the airport and the suburban rail line. Two towers stand on a shared podium so that the ground plane can be given back to the residents: a lap pool, a lawn and a shaded street frontage.",
      "Each tower is wrapped in deep floor slabs and staggered balconies that shade the glass from the afternoon sun. Bronze fins on the side elevations cut glare while keeping the views open.",
    ],
    facts: [
      { label: "Type", value: "Residential towers" },
      { label: "Location", value: "GST Road belt, Chennai" },
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
        group: "Amenities",
        items: [
          { label: "Podium deck", value: "28 m lap pool and a shaded lawn" },
          { label: "Sky gardens", value: "Recessed planted floors partway up each tower" },
          { label: "Street", value: "A shaded arrival court" },
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
    cover: img.residentialHero,
    gallery: [img.residentialHero, img.residentialFacade, img.residentialDeck, img.residentialStreet],
    explorer: "tower",
  },
  {
    slug: "coworking-spaces",
    name: "Coworking Spaces",
    tagline: "Flexible workspace for the industrial belt",
    segment: "commercial",
    type: "Managed coworking campus",
    corridor: "Sriperumbudur and Oragadam",
    status: "Concept",
    summary: "A terraced, low-rise workspace campus: flexible floors behind bronze sunshades, a glass meeting pavilion on the roof and shared terraces.",
    description: [
      "A concept for the automotive and electronics belt, where engineering, supplier and management teams need good workspace close to the plants rather than a long drive back into the city.",
      "Two office blocks meet at an L around a granite forecourt. Floors can be let as open desks, private suites or whole floors, and a glass meeting pavilion and lit roof terraces give every member shared space for meetings, training and events.",
    ],
    facts: [
      { label: "Type", value: "Managed coworking campus" },
      { label: "Location", value: "Sriperumbudur and Oragadam, Chennai" },
      { label: "Status", value: "Concept, not yet launched" },
    ],
    specs: [
      {
        group: "Workspace (concept model)",
        items: [
          { label: "Blocks", value: "Two, of 7 and 5 storeys" },
          { label: "Workspace", value: "Open desks, private suites and whole floors" },
          { label: "Meeting pavilion", value: "A two-storey glass pavilion on the roof" },
        ],
      },
      {
        group: "Shared space",
        items: [
          { label: "Terraces", value: "Roof terraces on both blocks, behind glass balustrades" },
          { label: "Forecourt", value: "Granite paving with benches and lighting" },
          { label: "Operation", value: "With a workspace operator partner, to be appointed" },
        ],
      },
    ],
    cover: img.coworkingExterior,
    gallery: [img.coworkingExterior, img.coworkingTerrace],
  },
  {
    slug: "retail-spaces",
    name: "Retail Spaces",
    tagline: "High-street retail on the ring road",
    segment: "commercial",
    type: "Retail and showrooms",
    corridor: "Outer Ring Road West",
    status: "Concept",
    summary: "A street-facing retail block: shopfronts and showrooms under a deep stone colonnade, with upper floors behind a terracotta jaali screen.",
    description: [
      "A concept for high-street retail on the western ring, where new housing needs shops, showrooms, clinics and services within easy reach.",
      "A deep stone colonnade shades the shopfronts and the pavement in front of them. The upper floors sit behind a terracotta screen cut in a jaali pattern, which filters light and gives the building one quiet, continuous face to the street.",
    ],
    facts: [
      { label: "Type", value: "Retail and showrooms" },
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
          { label: "Upper floors", value: "Showrooms and services behind a terracotta jaali screen" },
          { label: "Roof", value: "Terrace with a bronze pergola" },
        ],
      },
    ],
    cover: img.retailStreet,
    gallery: [img.retailStreet, img.retailArcade],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
