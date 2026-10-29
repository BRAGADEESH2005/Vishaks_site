import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/sections/Gallery";
import { TowerExplorer } from "@/components/sections/TowerExplorer";
import { ArrowLink, ButtonLink } from "@/components/ui/ArrowLink";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { MotionScope } from "@/components/ui/MotionScope";
import { getProject, projects } from "@/data/projects";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: `${project.summary} Design concept, illustrative only.`,
    openGraph: { title: project.name, description: project.summary, images: [{ url: project.cover.src.src, alt: project.cover.alt }] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const i = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(i + 1) % projects.length] ?? projects[0];
  const enquiryType = project.segment === "residential" ? "buyer" : "tenant";

  return (
    <main id="main">
      <MotionScope>
        <section className="on-dark relative isolate flex min-h-[88svh] items-end overflow-hidden bg-ink text-ivory">
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            priority
            fill
            sizes="100vw"
            placeholder="blur"
            className="-z-10 object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
          <div className="gutter shell w-full pb-14 pt-36 md:pb-20">
            <nav aria-label="Breadcrumb" className="label text-ivory/65">
              <ol className="flex flex-wrap gap-2">
                <li>
                  <Link href="/#developments" className="link-draw">
                    Developments
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">{project.name}</li>
              </ol>
            </nav>
            <h1 data-reveal="lines" className="mt-6 text-display-xl">
              {project.name}
            </h1>
            <p className="mt-4 text-lede italic text-ivory/70">{project.meaning}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <p className="label text-ivory/80">
                {project.type} · {project.corridor}
              </p>
              <ConceptNote tone="light">Concept · illustrative</ConceptNote>
            </div>
          </div>
        </section>

        <div className="border-b border-line bg-paper">
          <p className="gutter shell py-4 text-[0.92rem] text-muted">
            {project.name} is a design concept, not a launched project. All images are computer-generated and every figure on
            this page is illustrative, taken from the concept model.
          </p>
        </div>

        <section aria-labelledby="overview-title" className="bg-ivory py-24 md:py-36">
          <div className="gutter shell grid gap-14 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 id="overview-title" className="label text-muted">
                Overview
              </h2>
              <dl className="mt-8 border-t border-line">
                {project.facts.map((f) => (
                  <div key={f.label} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4 text-[0.95rem]">
                    <dt className="text-muted">{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <p data-reveal="fade" className="font-display text-display-m">
                {project.summary}
              </p>
              <div className="mt-10 space-y-6 text-[1.08rem] text-muted">
                {project.description.map((d) => (
                  <p key={d.slice(0, 24)}>{d}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {project.explorer === "tower" && (
          <section aria-labelledby="explorer-title" className="on-dark bg-ink py-24 text-ivory md:py-32">
            <div className="gutter shell">
              <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
                <h2 id="explorer-title" data-reveal="lines" className="text-display-l">
                  Explore the tower
                </h2>
                <p className="max-w-md text-ivory/65">Turn the concept model and choose a level to see how a floor is planned.</p>
              </div>
              <TowerExplorer />
            </div>
          </section>
        )}

        <section aria-labelledby="gallery-title" className="bg-ivory py-24 md:py-32">
          <div className="gutter shell">
            <h2 id="gallery-title" className="label mb-10 text-muted">
              Gallery · concept visualisations
            </h2>
            <Gallery images={project.gallery} title={project.name} />
          </div>
        </section>

        <section aria-labelledby="specs-title" className="bg-paper py-24 md:py-32">
          <div className="gutter shell grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 id="specs-title" data-reveal="lines" className="text-display-m">
                Specifications
              </h2>
              <p className="mt-6 max-w-xs text-muted">Illustrative. Final specifications follow design development and approvals.</p>
            </div>
            <div className="space-y-12 md:col-span-7 md:col-start-6">
              {project.specs.map((group) => (
                <div key={group.group}>
                  <h3 className="label text-bronze">{group.group}</h3>
                  <dl className="mt-4 border-t border-ink">
                    {group.items.map((item) => (
                      <div key={item.label} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                        <dt className="text-muted">{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="on-dark bg-ink-2 py-24 text-ivory md:py-32">
          <div className="gutter shell grid items-end gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <h2 data-reveal="lines" className="text-display-l">
                Interested in {project.name}?
              </h2>
              <p className="mt-6 max-w-lg text-ivory/70">
                Register your interest and we will keep you informed as the project moves through approvals. Nothing is offered for
                sale before TNRERA registration.
              </p>
              <div className="mt-10">
                <ButtonLink href={`/?type=${enquiryType}#enquire`}>Register interest</ButtonLink>
              </div>
            </div>
            {next && next.slug !== project.slug && (
              <Link href={`/projects/${next.slug}`} className="group md:col-span-4 md:col-start-9">
                <span className="label text-ivory/55">Next concept</span>
                <span className="relative mt-4 block aspect-[4/3] overflow-hidden bg-ink-3">
                  <Image
                    src={next.cover.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 30vw, 100vw"
                    className="object-cover transition-transform duration-[1400ms] group-hover:scale-[1.04]"
                  />
                </span>
                <span className="mt-4 block font-display text-[2rem] leading-tight">{next.name}</span>
              </Link>
            )}
          </div>
          <div className="gutter shell mt-16">
            <ArrowLink href="/#developments" tone="light">
              All developments
            </ArrowLink>
          </div>
        </section>
      </MotionScope>
    </main>
  );
}
