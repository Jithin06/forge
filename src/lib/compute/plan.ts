import type { PlanOutput } from "../ai/schemas";
import type { AccessStatus, Audience, SpaceDoc } from "../schemas";
import { routeCost, withScrapTotal, type CostLine } from "./cost";
import { eligibility, eligibilityRank } from "./eligibility";
import { firstVisit } from "./firstVisit";
import { assignLabels, type Label } from "./labels";
import { matchScrap, type ScrapItem } from "./scrapMatch";
import { trainingsFor } from "./training";

/**
 * SPEC.md 6.3 steps 2-8. Everything a student is told about access,
 * training, cost, labels and scrap is computed here from stored data.
 * Input must already have passed grounding (step 1).
 *
 * computeBase runs once when the plan is made and is stored.
 * finalize runs on every read, so scrap matches are always fresh.
 */

export type BaseRoute = {
  space_id: string;
  space_name: string;
  space_location: string;
  equipment: { id: string; name: string; plain_name: string }[];
  process: string;
  fit_reason: string;
  steps: { title: string; detail: string }[];
  warnings: { issue: string; fix: string }[];
  eligibility: { status: AccessStatus; note: string | null };
  trainings: { id: string; name: string; how_to_sign_up: string | null; restricted_to: string | null }[];
  cost_lines: CostLine[];
  total: { low: number; high: number } | null;
  prices_estimated: boolean;
};

export type BasePlan = {
  summary: string;
  audience: Audience;
  routes: BaseRoute[];
  first_visit: string[];
  clarifying_question: string | null;
  not_supported_reason: string | null;
};

export type FinalRoute = BaseRoute & {
  labels: Label[];
  scrap: ScrapItem[][]; // one list per cost line
  with_scrap: { low: number; high: number } | null;
};

export type FinalPlan = Omit<BasePlan, "routes"> & {
  routes: FinalRoute[];
  /** True when no route is "open" for this audience (only ask first or not open). */
  none_open: boolean;
};

export function computeBase(model: PlanOutput, spaces: SpaceDoc[], audience: Audience): BasePlan {
  const byId = new Map(spaces.map((s) => [s.id, s]));

  const routes: BaseRoute[] = model.routes.map((r) => {
    const space = byId.get(r.space_id)!;
    const trainings = trainingsFor(space, r.equipment_ids);
    const cost = routeCost(space, r.materials);
    return {
      space_id: space.id,
      space_name: space.name,
      space_location: space.location,
      equipment: r.equipment_ids.map((id) => {
        const e = space.equipment.find((x) => x.id === id)!;
        return { id, name: e.name, plain_name: e.plain_name };
      }),
      process: r.process,
      fit_reason: r.fit_reason,
      steps: r.steps,
      warnings: r.warnings,
      eligibility: eligibility(space, audience),
      trainings: trainings.map((t) => ({
        id: t.id,
        name: t.name,
        how_to_sign_up: t.how_to_sign_up,
        restricted_to: t.restricted_to,
      })),
      cost_lines: cost.lines,
      total: cost.total,
      prices_estimated: cost.prices_estimated,
    };
  });

  // Step 6: open first, then ask first, then not open. Stable for ties.
  const ordered = routes
    .map((r, i) => ({ r, i }))
    .sort((a, b) => eligibilityRank(a.r.eligibility.status) - eligibilityRank(b.r.eligibility.status) || a.i - b.i)
    .map(({ r }) => r);

  // Step 8: first visit for the top route.
  const top = ordered[0];
  const topSpace = top ? byId.get(top.space_id)! : null;
  const first_visit =
    top && topSpace ? firstVisit(topSpace, trainingsFor(topSpace, top.equipment.map((e) => e.id))) : [];

  return {
    summary: model.summary,
    audience,
    routes: ordered,
    first_visit,
    clarifying_question: model.clarifying_question,
    not_supported_reason: model.not_supported_reason,
  };
}

export function finalize(base: BasePlan, availableScrap: ScrapItem[]): FinalPlan {
  const withScrap = base.routes.map((r) => {
    const scrap = matchScrap(r.cost_lines, r.space_id, availableScrap);
    const free = new Set(scrap.map((s, i) => (s.length ? i : -1)).filter((i) => i >= 0));
    return { r, scrap, with_scrap: withScrapTotal(r.cost_lines, free) };
  });

  const labels = assignLabels(
    withScrap.map(({ r, with_scrap }) => ({
      status: r.eligibility.status,
      withScrapLow: with_scrap?.low ?? null,
      trainingCount: r.trainings.length,
    })),
  );

  return {
    ...base,
    routes: withScrap.map(({ r, scrap, with_scrap }, i) => ({ ...r, scrap, with_scrap, labels: labels[i] })),
    none_open: base.routes.length > 0 && base.routes.every((r) => r.eligibility.status !== "open"),
  };
}
