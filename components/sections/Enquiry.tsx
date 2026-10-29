import { ToConfirm } from "@/components/ui/ConceptNote";
import { site } from "@/data/site";
import { EnquiryForm } from "./EnquiryForm";

export function Enquiry() {
  return (
    <section id="enquire" aria-labelledby="enquire-title" className="on-dark relative overflow-hidden bg-ink-2 py-28 text-ivory md:py-40">
      <div className="gutter shell grid gap-16 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <p className="label text-ivory/55">Enquire</p>
          <h2 id="enquire-title" data-reveal="lines" className="mt-5 text-display-l">
            Begin a conversation
          </h2>
          <p className="mt-8 max-w-md text-lede text-ivory/70">
            Investors, landowners, future residents and occupiers: tell us what you are looking for and the right person will
            reply.
          </p>
          <dl className="mt-14 space-y-6 border-t border-line-light pt-8">
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <dt className="label pt-1 text-ivory/50">Office</dt>
              <dd>{site.contact.address ?? site.city}</dd>
            </div>
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <dt className="label pt-1 text-ivory/50">Email</dt>
              <dd>{site.contact.email ? <span className="select-all">{site.contact.email}</span> : <ToConfirm />}</dd>
            </div>
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <dt className="label pt-1 text-ivory/50">Phone</dt>
              <dd>{site.contact.phone ? <span className="select-all">{site.contact.phone}</span> : <ToConfirm />}</dd>
            </div>
          </dl>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
