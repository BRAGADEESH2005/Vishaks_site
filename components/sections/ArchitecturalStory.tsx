import Image from "next/image";
import { conceptImages } from "@/data/projects";
import { StoryNav } from "./StoryNav";

const chapters = [
  {
    id: "design",
    theme: "Design",
    title: "Proportion before decoration",
    body: "Slender towers on a low stone base, a generous arrival and a clear top. The silhouette is decided first; ornament is left to the light.",
    image: conceptImages.kadalStreet,
    aspect: "aspect-[3/2]",
  },
  {
    id: "materials",
    theme: "Materials",
    title: "Stone, bronze and glass",
    body: "A short palette chosen for salt air and monsoon rain. Honed stone at the base, bronze-finished metal for fins and louvres, and glass kept in shade.",
    image: conceptImages.ambalamLouvres,
    aspect: "aspect-[4/5]",
  },
  {
    id: "landscape",
    theme: "Landscape",
    title: "Shade you can stand in",
    body: "Podium decks, palms and broad canopy trees do the work of air conditioning outdoors. Water is used where it cools, not where it shows off.",
    image: conceptImages.kadalDeck,
    aspect: "aspect-[3/2]",
  },
  {
    id: "space",
    theme: "Space",
    title: "Room between buildings",
    body: "Colonnades, courts and setbacks give the street a sheltered edge. The space between buildings is designed as carefully as the buildings themselves.",
    image: conceptImages.sandhaiArcade,
    aspect: "aspect-[4/5]",
  },
  {
    id: "lifestyle",
    theme: "Lifestyle",
    title: "Streets made for walking",
    body: "Internal roads lined with trees, low compound walls and front gardens. A neighbourhood should feel finished on the day the first family moves in.",
    image: conceptImages.maruthamAvenue,
    aspect: "aspect-[3/2]",
  },
];

export function ArchitecturalStory() {
  return (
    <section id="architecture" aria-labelledby="architecture-title" className="bg-ivory py-28 md:py-40">
      <div className="gutter shell grid gap-14 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <p className="label text-muted">Architecture</p>
            <h2 id="architecture-title" data-reveal="lines" className="mt-5 text-display-l">
              How we build
            </h2>
            <p className="mt-8 max-w-sm text-muted">
              Five ideas carried through every concept, from a single plot to a tower.
            </p>
            <StoryNav chapters={chapters.map(({ id, theme }) => ({ id, theme }))} />
          </div>
        </div>

        <div className="space-y-28 md:col-span-7 md:col-start-6 md:space-y-44">
          {chapters.map((c, i) => (
            <article key={c.id} id={`chapter-${c.id}`} data-chapter={c.id} className={`scroll-mt-32 ${i % 2 ? "md:pl-[18%]" : "md:pr-[8%]"}`}>
              <figure>
                <div data-reveal="clip" className={`relative overflow-hidden bg-paper ${c.aspect}`}>
                  <div data-parallax className="absolute inset-0">
                    <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" placeholder="blur" className="object-cover" />
                  </div>
                </div>
                <figcaption className="label mt-4 text-muted">{c.image.caption}</figcaption>
              </figure>
              <div className="mt-10 grid gap-4 sm:grid-cols-[8rem_1fr]">
                <p className="label pt-2 text-bronze">{c.theme}</p>
                <div>
                  <h3 data-reveal="fade" className="text-display-m">
                    {c.title}
                  </h3>
                  <p className="mt-5 max-w-xl text-muted">{c.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
