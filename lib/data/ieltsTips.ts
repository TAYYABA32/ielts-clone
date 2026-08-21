export interface TipCategory {
  slug: string;
  label: string;
  intro: string;
  tips: string[];
}

/**
 * Genuine, generic IELTS preparation advice — common exam-technique
 * knowledge, not claims tied to any specific institution or certification.
 */
export const IELTS_TIP_CATEGORIES: TipCategory[] = [
  {
    slug: "listening",
    label: "Listening Tips",
    intro: "The Listening test plays once — most points are lost to missed timing and spelling, not missed vocabulary.",
    tips: [
      "Read the questions for each section before the audio starts — you get set-up time before every section begins.",
      "Write down the answer as you hear it, even roughly — you can tidy spelling during the transfer time at the end.",
      "Watch for distractors: speakers often correct themselves mid-sentence (\"on Tuesday — actually, make that Wednesday\"). The final statement is usually the answer.",
      "For map/diagram questions, follow the speaker's route in real time rather than trying to work out the whole layout first.",
      "Numbers, dates, and spelled-out words (especially names) are common trap points — practise transcribing fast speech, not just understanding it.",
    ],
  },
  {
    slug: "reading",
    label: "Reading Tips",
    intro: "60 minutes for 40 questions across 3 passages leaves no time to read every word — skim first, then hunt.",
    tips: [
      "Skim each passage for structure (topic sentences, paragraph purpose) before reading questions in detail.",
      "For True/False/Not Given, distinguish \"False\" (the passage says the opposite) from \"Not Given\" (the passage simply doesn't say) — this is the single most common error type.",
      "Match keywords in the question to synonyms in the passage, not identical wording — the exam deliberately paraphrases.",
      "Answer questions in the order they appear in the passage where possible; most question sets follow the passage's own sequence.",
      "Don't leave blanks — there's no penalty for a wrong answer, so an educated guess beats an empty box.",
    ],
  },
  {
    slug: "writing",
    label: "Writing Tips",
    intro: "Task 2 is worth twice as much as Task 1 — budget your 60 minutes accordingly (roughly 20 / 40 minutes).",
    tips: [
      "Task 1 (Academic): describe overall trends first, then support with specific data — don't just list every number on the chart.",
      "Task 1 (General Training): match the tone to the letter type (formal/semi-formal/informal) — examiners specifically check this.",
      "Task 2: answer every part of the question. A well-written essay that only half-addresses the prompt is capped on Task Achievement.",
      "Plan for 2 minutes before writing — a weak structure costs more marks than a few grammar slips.",
      "Leave 5 minutes to proofread for subject-verb agreement and article errors (a/an/the) — the two most common small deductions.",
    ],
  },
  {
    slug: "speaking",
    label: "Speaking Tips",
    intro: "Speaking is scored on fluency, vocabulary, grammar, and pronunciation — not on giving the \"correct\" opinion.",
    tips: [
      "In Part 1, answer directly and add one supporting detail — a bare one-word answer under-demonstrates your range.",
      "In Part 2, use the full minute of preparation time to jot down keywords, not full sentences you'd try to memorise.",
      "It's fine to briefly pause and self-correct — natural hesitation reads better than a rehearsed, unnatural monologue.",
      "In Part 3, extend your answers with examples and reasoning; one-sentence responses limit how much range you can show.",
      "Practise speaking your answers out loud, not just planning them mentally — timing and breath control only improve with repetition.",
    ],
  },
  {
    slug: "grammar",
    label: "IELTS Grammar",
    intro: "Grammatical Range and Accuracy is one of four scoring criteria in both Writing and Speaking — small, consistent errors cap your band regardless of vocabulary.",
    tips: [
      "Mix sentence structures deliberately: simple, compound, and complex sentences all in the same paragraph score higher than a run of identical short sentences.",
      "Article errors (a/an/the) are the single most common accuracy issue at all levels — review count vs. non-count nouns if you drop articles often.",
      "Verb tense consistency matters more than tense complexity — a correctly consistent simple past beats a mishandled attempt at conditional perfect.",
      "Subject-verb agreement breaks down most often with collective nouns (\"the data shows\" not \"the data show\", in most usage) — check this specifically when proofreading.",
      "Practise linking words (however, despite, as a result) — they demonstrate range but only if used with correct punctuation around them.",
    ],
  },
];

export function findTipCategory(slug: string): TipCategory | undefined {
  return IELTS_TIP_CATEGORIES.find((category) => category.slug === slug);
}
