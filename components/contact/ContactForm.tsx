"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { COUNTRY_CODES } from "@/lib/data/countryCodes";

const USER_TYPES = [
  "Student",
  "IELTS Teacher/Examiner",
  "Teaching Centre/School/University",
  "Potential Partner wants to set up a franchising centre",
  "Others",
];
const MESSAGE_MAX_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormValues {
  userType: string;
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  message: string;
}

const INITIAL_VALUES: FormValues = {
  userType: USER_TYPES[0]!,
  fullName: "",
  email: "",
  countryCode: COUNTRY_CODES[0]!.code,
  phone: "",
  message: "",
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
type SubmitStatus = "idle" | "loading" | "success" | "error";

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.phone.trim()) errors.phone = "Phone number is required.";
  if (!values.message.trim()) errors.message = "Message is required.";
  else if (values.message.trim().length < 10) errors.message = "Message must be at least 10 characters.";
  return errors;
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Full-spec contact form (dropdown, phone w/ country code, char-counted
 * message, validation, loading/success/error states, CAPTCHA placeholder).
 * Submits to the real POST /api/contact endpoint (rate-limited, Zod-
 * validated, sends a notification email via lib/email/sendEmail) — not a
 * simulated delay.
 */
export function ContactForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-success-50 bg-success-50 p-8 text-center">
        <p className="text-lg font-bold text-success-700">Message sent!</p>
        <p className="mt-2 text-sm text-success-700/80">
          Thanks for reaching out — our team will respond as quickly as possible.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(INITIAL_VALUES);
            setStatus("idle");
          }}
          className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-success-700 shadow-sm hover:bg-success-50"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <h2 className="text-xl font-bold text-[#1b2a4a]">Let us contact you</h2>

      {status === "error" && (
        <p role="alert" className="rounded-lg border border-danger-50 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
          Something went wrong sending your message. Please try again.
        </p>
      )}

      <FormField label="I am a..." htmlFor="contact-user-type">
        <select
          id="contact-user-type"
          value={values.userType}
          onChange={(e) => setField("userType", e.target.value)}
        >
          {USER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Full Name" htmlFor="contact-full-name" error={errors.fullName}>
        <input
          id="contact-full-name"
          type="text"
          value={values.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          placeholder="Your full name"
          aria-invalid={Boolean(errors.fullName)}
        />
      </FormField>

      <FormField label="Email" htmlFor="contact-email" error={errors.email}>
        <input
          id="contact-email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
        />
      </FormField>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="w-28">
          <label htmlFor="contact-country-code">Code</label>
          <select
            id="contact-country-code"
            value={values.countryCode}
            onChange={(e) => setField("countryCode", e.target.value)}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <FormField label="Phone Number" htmlFor="contact-phone" error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="555 000 0000"
            aria-invalid={Boolean(errors.phone)}
          />
        </FormField>
      </div>

      <FormField label="Message" htmlFor="contact-message" error={errors.message}>
        <textarea
          id="contact-message"
          rows={5}
          maxLength={MESSAGE_MAX_LENGTH}
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          placeholder="How can we help?"
          aria-invalid={Boolean(errors.message)}
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {values.message.length}/{MESSAGE_MAX_LENGTH}
        </p>
      </FormField>

      {/* reCAPTCHA placeholder — no real integration wired up yet */}
      <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-400">
        reCAPTCHA verification will appear here
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-[#00b4d8] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-[#00a0c2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
