import Link from "next/link";
import { ToConfirm } from "@/components/ui/ConceptNote";
import { Logo } from "@/components/ui/Logo";
import { projects } from "@/data/projects";
import { nav, site } from "@/data/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark bg-ink text-ivory">
      <div className="gutter shell grid gap-14 pb-10 pt-20 md:grid-cols-12 md:pt-28">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-8 max-w-sm text-ivory/65">{site.description}</p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 md:col-span-7">
          <div>
            <h2 className="label text-ivory/50">Developments</h2>
            <ul className="mt-5 space-y-3">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="link-draw text-ivory/85 hover:text-ivory">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="label text-ivory/50">Company</h2>
            <ul className="mt-5 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-draw text-ivory/85 hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#enquire" className="link-draw text-ivory/85 hover:text-ivory">
                  Enquire
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="label text-ivory/50">Contact</h2>
            <dl className="mt-5 space-y-4 text-ivory/85">
              <div>
                <dt className="sr-only">Office</dt>
                <dd>{site.contact.address ?? site.city}</dd>
              </div>
              <div>
                <dt className="label text-ivory/45">Email</dt>
                <dd className="mt-1">{site.contact.email ?? <ToConfirm />}</dd>
              </div>
              <div>
                <dt className="label text-ivory/45">Phone</dt>
                <dd className="mt-1">{site.contact.phone ?? <ToConfirm />}</dd>
              </div>
            </dl>
            {site.socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-4">
                {site.socials.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} className="link-draw text-ivory/85" rel="noopener noreferrer" target="_blank">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="gutter shell flex flex-col gap-4 border-t border-line-light py-8 text-[0.85rem] text-ivory/55 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {site.legalName ?? site.name}. All rights reserved.
        </p>
        <p className="max-w-2xl md:text-right">
          All developments shown are design concepts. Images are computer-generated visualisations and figures are illustrative.{" "}
          <Link href="/notices" className="link-draw text-ivory/80">
            Notices and credits
          </Link>
        </p>
      </div>
    </footer>
  );
}
