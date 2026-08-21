"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons/CommonIcons";

// Answers are honest about what this project actually is (see SiteFooter's
// "About us" copy) rather than implying an official IELTS affiliation.
const FAQS = [
  {
    question: "Is this an official IELTS test?",
    answer:
      "No. IELTS Pathway is an independent practice platform, not affiliated with, endorsed by, or connected to the British Council, IDP, or Cambridge Assessment English.",
  },
  {
    question: "How is my Writing and Speaking scored?",
    answer:
      "Writing and Speaking submissions go through an examiner-facing review tool, alongside AI-assisted feedback on grammar, vocabulary, and coherence.",
  },
  {
    question: "Can I retake a mock test?",
    answer: "Yes — every test can be retaken as many times as you like, and each attempt is saved to your dashboard.",
  },
  {
    question: "What band score scale do you use?",
    answer:
      "Listening and Reading are converted using the standard 0–9 IELTS band scale; Writing and Speaking bands come from examiner review.",
  },
  {
    question: "Do I need an account to take a test?",
    answer: "You'll need a free account so your attempts, scores, and progress are saved between sessions.",
  },
  {
    question: "Is this platform free to use?",
    answer: "Core mock tests and instant Listening/Reading scoring are free. Live lessons and courses are separate offerings.",
  },
];

/** Simple single-open accordion — no external library, just local state. */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-32 bg-white px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1b2a4a] md:text-4xl">
            Frequently Asked <span className="text-[#00b4d8]">Questions</span>
          </h2>
        </div>

        <div className="mt-10 divide-y divide-gray-100 rounded-2xl border border-gray-100 shadow-md">
          {FAQS.map((faq, index) => {
            const isOpen = index === openIndex;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 bg-white p-5 text-left shadow-none hover:bg-gray-50"
                >
                  <span className="text-sm font-bold text-[#1b2a4a]">{faq.question}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
