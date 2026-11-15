/**
 * The follow-up question bank (SPEC.md section 6.2). Wording and options are
 * fixed here; the model only chooses which question ids to ask.
 * Every question also offers "Not sure" (section 7.1).
 */
export const QUESTION_IDS = ["size", "demands", "quantity", "deadline"] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export type Question = {
  id: QuestionId;
  text: string;
  multi: boolean;
  options: { id: string; label: string }[];
};

const NOT_SURE = { id: "not_sure", label: "Not sure" };

export const QUESTIONS: Record<QuestionId, Question> = {
  size: {
    id: "size",
    text: "How big is it?",
    multi: false,
    options: [
      { id: "hand", label: "Fits in a hand" },
      { id: "shoebox", label: "Shoebox" },
      { id: "backpack", label: "Backpack" },
      { id: "bigger", label: "Bigger" },
      NOT_SURE,
    ],
  },
  demands: {
    id: "demands",
    text: "What does it need to handle? (pick any)",
    multi: true,
    options: [
      { id: "looks", label: "Just for looks" },
      { id: "weight", label: "Holds weight" },
      { id: "outdoors", label: "Outdoors or wet" },
      { id: "moving", label: "Moving parts" },
      { id: "electronics", label: "Electronics inside" },
      NOT_SURE,
    ],
  },
  quantity: {
    id: "quantity",
    text: "How many do you need?",
    multi: false,
    options: [
      { id: "one", label: "One" },
      { id: "few", label: "A few" },
      { id: "many", label: "Many" },
      NOT_SURE,
    ],
  },
  deadline: {
    id: "deadline",
    text: "When do you need it?",
    multi: false,
    options: [
      { id: "week", label: "This week" },
      { id: "month", label: "This month" },
      { id: "no_rush", label: "No rush" },
      NOT_SURE,
    ],
  },
};

export function isValidAnswer(qid: QuestionId, optionIds: string[]): boolean {
  const q = QUESTIONS[qid];
  if (optionIds.length === 0) return false;
  if (!q.multi && optionIds.length !== 1) return false;
  return optionIds.every((o) => q.options.some((opt) => opt.id === o));
}

/** Plain-language answers for the prompt, e.g. "How big is it? Shoebox". */
export function describeAnswers(answers: Partial<Record<QuestionId, string[]>>): string[] {
  return QUESTION_IDS.filter((q) => answers[q]?.length).map((q) => {
    const labels = answers[q]!.map((o) => QUESTIONS[q].options.find((x) => x.id === o)?.label ?? o);
    return `${QUESTIONS[q].text} ${labels.join(", ")}`;
  });
}
