"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { enquiryTypes, type EnquiryType } from "@/data/site";
import { emptyEnquiry, ENQUIRY_ENDPOINT, validateEnquiry, type EnquiryErrors, type EnquiryValues } from "@/lib/enquiry";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "checked" } // valid, but no endpoint is configured, so nothing was sent
  | { kind: "error"; message: string };

const isEnquiryType = (v: string | null): v is EnquiryType => enquiryTypes.some((t) => t.value === v);
const noop = () => () => {};
const readTypeFromUrl = (): EnquiryType | null => {
  const t = new URLSearchParams(window.location.search).get("type");
  return isEnquiryType(t) ? t : null;
};

export function EnquiryForm() {
  const [values, setValues] = useState<EnquiryValues>(emptyEnquiry);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof EnquiryValues, boolean>>>({});
  const [state, setState] = useState<State>({ kind: "idle" });
  const summary = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  // Project pages link here with ?type=buyer and similar, to preselect the topic.
  const fromLink = useSyncExternalStore(noop, readTypeFromUrl, () => null);
  const current: EnquiryValues = values.type || !fromLink ? values : { ...values, type: fromLink };

  const set = <K extends keyof EnquiryValues>(key: K, value: EnquiryValues[K]) => {
    const next = { ...current, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validateEnquiry(next));
  };
  const blur = (key: keyof EnquiryValues) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateEnquiry(current));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateEnquiry(current);
    setErrors(found);
    setTouched({ type: true, name: true, email: true, phone: true, message: true, consent: true });
    if (Object.keys(found).length) {
      setState({ kind: "idle" });
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    if (!ENQUIRY_ENDPOINT) {
      setState({ kind: "checked" });
      requestAnimationFrame(() => result.current?.focus());
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch(ENQUIRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...current, source: window.location.href, sentAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`The server answered ${res.status}.`);
      setState({ kind: "sent" });
      setValues(emptyEnquiry);
      setTouched({});
    } catch (err) {
      setState({
        kind: "error",
        message: `${err instanceof Error ? err.message : "The network request failed."} Your details are still in the form; please try again.`,
      });
    }
    requestAnimationFrame(() => result.current?.focus());
  }

  const show = (key: keyof EnquiryValues) => (touched[key] ? errors[key] : undefined);
  const errorList = (Object.keys(errors) as Array<keyof EnquiryValues>).filter((k) => touched[k] && errors[k]);

  if (state.kind === "sent") {
    return (
      <div ref={result} tabIndex={-1} role="status" className="flex flex-col gap-5 border border-line-light p-8 md:p-12">
        <Check aria-hidden="true" className="h-8 w-8 text-bronze-light" strokeWidth={1.4} />
        <h3 className="text-display-m">Thank you. Your enquiry has been sent.</h3>
        <p className="text-ivory/70">The team will reply to the email address you gave.</p>
        <button type="button" onClick={() => setState({ kind: "idle" })} className="link-draw self-start text-ivory">
          Send another enquiry
        </button>
      </div>
    );
  }

  const field =
    "w-full border-0 border-b border-ivory/30 bg-transparent px-0 py-3 text-[1.05rem] text-ivory placeholder:text-ivory/35 focus:border-ivory focus:outline-none focus:ring-0 aria-[invalid=true]:border-[#e7a27e]";

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby={id("intro")} className="flex flex-col gap-9">
      <p id={id("intro")} className="sr-only">
        All fields are required unless marked optional.
      </p>

      {errorList.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="border border-[#e7a27e]/60 p-5 text-[0.95rem]">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
            Please check {errorList.length === 1 ? "one field" : `${errorList.length} fields`}:
          </p>
          <ul className="mt-2 list-disc pl-6 text-ivory/80">
            {errorList.map((k) => (
              <li key={k}>
                <a href={`#${id(k)}`} className="underline underline-offset-2">
                  {errors[k]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset aria-describedby={show("type") ? id("type-error") : undefined}>
        <legend className="label text-ivory/60">I am enquiring as</legend>
        <div id={id("type")} className="mt-4 flex flex-wrap gap-2">
          {enquiryTypes.map((t) => {
            const on = current.type === t.value;
            return (
              <label
                key={t.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-[0.92rem] transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze-light ${
                  on ? "border-ivory bg-ivory text-ink" : "border-ivory/30 text-ivory/80 hover:border-ivory/70"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={on}
                  onChange={() => set("type", t.value)}
                  onBlur={() => blur("type")}
                  className="sr-only"
                />
                {t.label}
              </label>
            );
          })}
        </div>
        {show("type") && (
          <p id={id("type-error")} className="mt-3 text-[0.9rem] text-[#f0b597]">
            {errors.type}
          </p>
        )}
      </fieldset>

      <div className="grid gap-9 sm:grid-cols-2">
        <Field label="Full name" id={id("name")} error={show("name")}>
          <input
            id={id("name")}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => blur("name")}
            aria-invalid={!!show("name")}
            aria-describedby={show("name") ? `${id("name")}-error` : undefined}
            className={field}
          />
        </Field>
        <Field label="Email" id={id("email")} error={show("email")}>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => blur("email")}
            aria-invalid={!!show("email")}
            aria-describedby={show("email") ? `${id("email")}-error` : undefined}
            className={field}
          />
        </Field>
        <Field label="Phone (optional)" id={id("phone")} error={show("phone")}>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={() => blur("phone")}
            aria-invalid={!!show("phone")}
            aria-describedby={show("phone") ? `${id("phone")}-error` : undefined}
            className={field}
          />
        </Field>
        <Field label="Organisation (optional)" id={id("organisation")}>
          <input
            id={id("organisation")}
            name="organisation"
            autoComplete="organization"
            value={values.organisation}
            onChange={(e) => set("organisation", e.target.value)}
            className={field}
          />
        </Field>
      </div>

      <Field label="How can we help?" id={id("message")} error={show("message")}>
        <textarea
          id={id("message")}
          name="message"
          rows={4}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={!!show("message")}
          aria-describedby={show("message") ? `${id("message")}-error` : undefined}
          className={`${field} resize-y`}
        />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] text-ivory/75">
          <input
            id={id("consent")}
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
            onBlur={() => blur("consent")}
            aria-invalid={!!show("consent")}
            aria-describedby={show("consent") ? `${id("consent")}-error` : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-bronze-light)]"
          />
          Vishaks may contact me about this enquiry. My details will not be shared or used for anything else.
        </label>
        {show("consent") && (
          <p id={`${id("consent")}-error`} className="mt-2 text-[0.9rem] text-[#f0b597]">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={state.kind === "sending"}
          className="inline-flex items-center gap-3 rounded-full bg-ivory px-7 py-3.5 font-medium text-ink transition-colors duration-500 hover:bg-bronze-light disabled:opacity-60"
        >
          {state.kind === "sending" && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {state.kind === "sending" ? "Sending" : "Send enquiry"}
        </button>
        {!ENQUIRY_ENDPOINT && <p className="text-[0.85rem] text-ivory/50">Preview mode: this form checks your details but does not send them yet.</p>}
      </div>

      <div ref={result} tabIndex={-1} aria-live="polite" className="outline-none">
        {state.kind === "checked" && (
          <div role="status" className="border border-line-light p-5 text-[0.95rem] text-ivory/80">
            <p className="font-medium text-ivory">Your details look complete, but nothing was sent.</p>
            <p className="mt-1">
              This preview has no submission endpoint connected. Once one is configured, the same form will send enquiries
              straight to the team.
            </p>
          </div>
        )}
        {state.kind === "error" && (
          <div role="alert" className="border border-[#e7a27e]/60 p-5 text-[0.95rem]">
            <p className="font-medium">We could not send your enquiry.</p>
            <p className="mt-1 text-ivory/80">{state.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label text-ivory/60">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[0.9rem] text-[#f0b597]">
          {error}
        </p>
      )}
    </div>
  );
}
