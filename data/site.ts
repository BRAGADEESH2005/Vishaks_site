/**
 * Company facts and contact details.
 *
 * Everything here is either something the company has stated or a clearly
 * marked placeholder (`null`). Placeholders render as "To be confirmed" so a
 * reviewer can see exactly what is still missing. Replace them before launch.
 */
export type SocialLink = { label: string; href: string };

export const site = {
  name: "Vishaks",
  legalName: null as string | null,
  tagline: "Where Chennai grows next.",
  description:
    "Vishaks is a Chennai developer of residential plots, residential towers, commercial buildings and Grade A offices along the city's growth corridors.",
  city: "Chennai, Tamil Nadu",
  contact: {
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
  },
  /** Leave empty until real profiles exist; the footer hides the list when empty. */
  socials: [] as SocialLink[],
  verticals: ["Residential plots", "Residential towers", "Commercial buildings", "Office spaces"],
  corridors: [
    { code: "OMR", name: "Old Mahabalipuram Road", note: "The IT corridor south along the coast" },
    { code: "GST", name: "GST Road", note: "The airport and southern rail belt" },
    { code: "SPR", name: "Sriperumbudur and Oragadam", note: "The automotive and electronics belt" },
    { code: "ORR", name: "Outer Ring Road West", note: "Larger parcels on the western ring" },
  ],
  /** What the company has said about where it stands. Shown in the credibility section. */
  stage: "Land bank, joint venture and first funding round in progress",
} as const;

export const nav = [
  { href: "/#vision", label: "Vision", id: "vision" },
  { href: "/#developments", label: "Developments", id: "developments" },
  { href: "/#architecture", label: "Architecture", id: "architecture" },
  { href: "/#company", label: "Company", id: "company" },
] as const;

export const enquiryTypes = [
  { value: "investor", label: "Investor or fund" },
  { value: "landowner", label: "Landowner or JV partner" },
  { value: "buyer", label: "Home or plot buyer" },
  { value: "tenant", label: "Office or retail tenant" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof enquiryTypes)[number]["value"];
