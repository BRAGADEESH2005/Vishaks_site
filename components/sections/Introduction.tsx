import Image from "next/image";
import { conceptImages } from "@/data/projects";
import { site } from "@/data/site";

const principles = [
  {
    title: "Land first",
    body: "We judge land the way an investor would: clear title, access, approvals and real demand, before any design begins.",
  },
  {
    title: "Climate before style",
    body: "Chennai is hot, humid and coastal. Deep slabs, fins, colonnades and screens shade the glass and the pavement, and buildings turn to catch the sea breeze.",
  },
  {
    title: "Built in the open",
    body: "Approvals, registrations and construction progress are published stage by stage, so buyers and partners can check the work for themselves.",
  },
];

export function Introduction() {
  return (
    <section id="vision" aria-labelledby="vision-title" className="relative bg-ivory py-28 md:py-40">
      <div className="gutter shell">
        <div className="grid gap-10 md:grid-cols-12">
          <p className="label text-muted md:col-span-3 md:pt-4">Our vision</p>
          <h2 id="vision-title" data-reveal="lines" className="text-display-l md:col-span-9">
            We buy land slowly, design every square foot with care, and build in the open.
          </h2>
        </div>

        <div className="mt-24 grid items-start gap-14 md:mt-36 md:grid-cols-12 md:gap-10">
          <figure className="md:col-span-5 md:row-span-2">
            <div data-reveal="clip" className="relative aspect-[4/5] overflow-hidden bg-paper">
              <Image
                src={conceptImages.kadalFacade.src}
                alt={conceptImages.kadalFacade.alt}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <figcaption className="label mt-4 text-muted">{conceptImages.kadalFacade.caption}</figcaption>
          </figure>

          <div className="md:col-span-6 md:col-start-7 md:pt-24">
            <p data-reveal="fade" className="text-lede text-ink/85">
              {site.name} develops across four kinds of property in the Chennai metropolitan region. Each project begins with the
              same three commitments.
            </p>
            <ol data-reveal="stagger" className="mt-14 border-t border-line">
              {principles.map((p) => (
                <li key={p.title} className="grid gap-3 border-b border-line py-8 sm:grid-cols-[11rem_1fr] sm:gap-8">
                  <h3 className="text-[1.6rem] leading-tight">{p.title}</h3>
                  <p className="text-muted">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <CorridorMap />
      </div>
    </section>
  );
}

/** A schematic (not to scale) of the four corridors the company is focused on. */
function CorridorMap() {
  return (
    <div className="mt-28 grid gap-12 border-t border-line pt-14 md:mt-40 md:grid-cols-12">
      <div className="md:col-span-4">
        <p className="label text-muted">Where we build</p>
        <h3 data-reveal="fade" className="mt-5 text-display-m">
          Four corridors, four kinds of demand.
        </h3>
        <dl data-reveal="stagger" className="mt-10 space-y-6">
          {site.corridors.map((c) => (
            <div key={c.code} className="grid grid-cols-[3.5rem_1fr] gap-4">
              <dt className="label pt-1 text-bronze">{c.code}</dt>
              <dd>
                <span className="block font-medium">{c.name}</span>
                <span className="text-[0.95rem] text-muted">{c.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <figure className="md:col-span-7 md:col-start-6">
        <svg
          viewBox="0 0 640 520"
          role="img"
          aria-labelledby="map-title map-desc"
          className="h-auto w-full text-ink"
        >
          <title id="map-title">{"Schematic of Chennai's growth corridors"}</title>
          <desc id="map-desc">
            From the city centre on the coast, OMR runs south along the sea, GST Road runs south-west past the airport, the
            highway to Sriperumbudur runs west, and the Outer Ring Road arcs around the west of the city.
          </desc>
          {/* Sea */}
          <path d="M520 0 C 505 90, 540 170, 520 260 S 548 420, 560 520 L 640 520 L 640 0 Z" fill="var(--color-paper)" />
          <text x="590" y="250" className="label" fill="var(--color-muted)" fontSize="11" transform="rotate(90 590 250)" textAnchor="middle">
            BAY OF BENGAL
          </text>
          <path d="M520 0 C 505 90, 540 170, 520 260 S 548 420, 560 520" fill="none" stroke="var(--color-stone-2)" strokeWidth="1" />
          {/* Outer Ring Road */}
          <path d="M470 470 C 300 470, 150 380, 150 250 C 150 140, 250 60, 430 40" fill="none" stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="4 6" opacity="0.55" />
          {/* Corridors from the centre */}
          <g fill="none" stroke="var(--color-bronze)" strokeWidth="2" strokeLinecap="round">
            <path d="M470 170 C 480 260, 495 360, 510 500" />
            <path d="M462 176 C 420 250, 360 330, 300 470" />
            <path d="M456 168 C 380 175, 240 190, 40 200" />
          </g>
          <circle cx="465" cy="168" r="7" fill="var(--color-ink)" />
          <circle cx="465" cy="168" r="15" fill="none" stroke="var(--color-ink)" strokeWidth="1" opacity="0.35" />
          <g fontFamily="var(--font-mono)" fontSize="12" letterSpacing="1.6" fill="var(--color-ink)">
            <text x="400" y="150">CITY CENTRE</text>
            <text x="518" y="430">OMR</text>
            <text x="262" y="440">GST</text>
            <text x="44" y="186">SRIPERUMBUDUR</text>
            <text x="160" y="118" opacity="0.7">
              ORR
            </text>
          </g>
          <g fill="var(--color-bronze)">
            <circle cx="500" cy="390" r="4" />
            <circle cx="340" cy="400" r="4" />
            <circle cx="120" cy="197" r="4" />
            <circle cx="168" cy="300" r="4" />
          </g>
        </svg>
        <figcaption className="label mt-4 text-muted">Schematic, not to scale. Dots mark target zones, not acquired land.</figcaption>
      </figure>
    </div>
  );
}
