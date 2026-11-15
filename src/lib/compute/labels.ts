import type { AccessStatus } from "../schemas";
import { eligibilityRank } from "./eligibility";

export type Label = "cheapest" | "easiest";

export type LabelInput = {
  status: AccessStatus;
  /** with-scrap low total; null when the route has no priced material */
  withScrapLow: number | null;
  trainingCount: number;
  /**
   * The space lists no trainings at all, so "none needed" is not known. Such a
   * route never beats one whose trainings are known.
   */
  trainingUnknown?: boolean;
  /** Staff make the piece from a request; the student runs no machine. */
  staffMade?: boolean;
};

/**
 * Step 7. Routes must already be in display order.
 * - One route in the plan: no labels.
 * - Only routes that are not "not_open" can be labelled.
 * - "Cheapest": lowest with-scrap low cost, only if at least two of those
 *   routes have a cost. Ties go to the earlier route.
 * - "Easiest for a first build": a route whose trainings are known beats one
 *   at a space that lists none; then fewest trainings, ties broken by open
 *   a staff-made route over one the student runs, then open over ask_first, then by lower with-scrap cost (a known cost beats an
 *   unknown one), then by order.
 */
export function assignLabels(routes: LabelInput[]): Label[][] {
  const out: Label[][] = routes.map(() => []);
  if (routes.length < 2) return out;
  const eligible = routes.map((r, i) => ({ ...r, i })).filter((r) => r.status !== "not_open");

  const costed = eligible.filter((r) => r.withScrapLow !== null);
  if (costed.length >= 2) {
    const best = costed.reduce((a, b) => (b.withScrapLow! < a.withScrapLow! ? b : a));
    out[best.i].push("cheapest");
  }

  if (eligible.length > 0) {
    const cost = (r: LabelInput) => r.withScrapLow ?? Number.POSITIVE_INFINITY;
    const easier = (b: LabelInput, a: LabelInput) => {
      if (!!b.trainingUnknown !== !!a.trainingUnknown) return !b.trainingUnknown; // a known path beats an unknown one
      if (b.trainingCount !== a.trainingCount) return b.trainingCount < a.trainingCount;
      if (!!b.staffMade !== !!a.staffMade) return !!b.staffMade; // nothing to learn at all beats no listed training
      const rank = eligibilityRank(b.status) - eligibilityRank(a.status);
      if (rank !== 0) return rank < 0;
      return cost(b) < cost(a); // equal cost keeps the earlier route
    };
    const best = eligible.reduce((a, b) => (easier(b, a) ? b : a));
    out[best.i].push("easiest");
  }
  return out;
}
