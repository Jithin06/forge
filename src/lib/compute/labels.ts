import type { AccessStatus } from "../schemas";
import { eligibilityRank } from "./eligibility";

export type Label = "cheapest" | "easiest";

export type LabelInput = {
  status: AccessStatus;
  /** with-scrap low total; null when the route has no priced material */
  withScrapLow: number | null;
  trainingCount: number;
};

/**
 * Step 7. Routes must already be in display order.
 * - One route in the plan: no labels.
 * - Only routes that are not "not_open" can be labelled.
 * - "Cheapest": lowest with-scrap low cost, only if at least two of those
 *   routes have a cost. Ties go to the earlier route.
 * - "Easiest for a first build": fewest trainings, ties broken by open
 *   over ask_first, then by lower with-scrap cost (a known cost beats an
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
      if (b.trainingCount !== a.trainingCount) return b.trainingCount < a.trainingCount;
      const rank = eligibilityRank(b.status) - eligibilityRank(a.status);
      if (rank !== 0) return rank < 0;
      return cost(b) < cost(a); // equal cost keeps the earlier route
    };
    const best = eligible.reduce((a, b) => (easier(b, a) ? b : a));
    out[best.i].push("easiest");
  }
  return out;
}
