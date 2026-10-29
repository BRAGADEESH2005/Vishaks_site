import { enquiryTypes, type EnquiryType } from "@/data/site";

export type EnquiryValues = {
  type: EnquiryType | "";
  name: string;
  email: string;
  phone: string;
  organisation: string;
  message: string;
  consent: boolean;
};

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export const emptyEnquiry: EnquiryValues = {
  type: "",
  name: "",
  email: "",
  phone: "",
  organisation: "",
  message: "",
  consent: false,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Indian and international numbers: digits, spaces, +, -, brackets; 8 to 15 digits.
const PHONE = /^\+?[\d\s()-]{8,20}$/;

export function validateEnquiry(v: EnquiryValues): EnquiryErrors {
  const e: EnquiryErrors = {};
  if (!enquiryTypes.some((t) => t.value === v.type)) e.type = "Choose what your enquiry is about.";
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address like name@company.com.";
  const digits = v.phone.replace(/\D/g, "");
  if (v.phone.trim() && (!PHONE.test(v.phone.trim()) || digits.length < 8 || digits.length > 15))
    e.phone = "Enter a phone number with 8 to 15 digits, or leave it blank.";
  if (v.message.trim().length < 20) e.message = "Tell us a little more, at least 20 characters.";
  if (v.message.length > 2000) e.message = "Keep your message under 2,000 characters.";
  if (!v.consent) e.consent = "Confirm that we may contact you about this enquiry.";
  return e;
}

/** The optional endpoint that receives enquiries; see .env.example. */
export const ENQUIRY_ENDPOINT = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT ?? "";
