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
  /** Set when there is exactly one route: why no second real way exists. Absent on plans stored before Nov 15. */
  single_route_reason?: string | null;
};

export type FinalRoute = Omit<BaseRoute, "equipment"> & {
  /** explain is true the first time a tool (or its plain description) appears in the plan. */
  equipment: (BaseRoute["equipment"][number] & { explain: boolean })[];
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
    single_route_reason: ordered.length === 1 ? (model.single_route_reason?.trim() || null) : null,
  };
}

/**
 * The same stored plan, seen by a different audience: badges, order and the
 * first-visit list are worked out again from the space data. Routes, steps,
 * materials and costs are not touched. `modelOrder` is the order the model
 * gave the routes in, so the result matches a plan made for that audience.
 */
export function forAudience(
  base: BasePlan,
  spaces: SpaceDoc[],
  audience: Audience,
  modelOrder: { space_id: string; process: string }[] = [],
): BasePlan {
  if (audience === base.audience) return base;
  const byId = new Map(spaces.map((s) => [s.id, s]));
  const original = (r: BaseRoute) => {
    const i = modelOrder.findIndex((m) => m.space_id === r.space_id && m.process === r.process);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const routes = base.routes
    .map((r, i) => {
      const space = byId.get(r.space_id);
      return { r: space ? { ...r, eligibility: eligibility(space, audience) } : r, i, o: original(r) };
    })
    .sort((a, b) => eligibilityRank(a.r.eligibility.status) - eligibilityRank(b.r.eligibility.status) || a.o - b.o || a.i - b.i)
    .map(({ r }) => r);
  const top = routes[0];
  const topSpace = top ? byId.get(top.space_id) : undefined;
  return {
    ...base,
    audience,
    routes,
    first_visit: top && topSpace ? firstVisit(topSpace, trainingsFor(topSpace, top.equipment.map((e) => e.id))) : base.first_visit,
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

  // Each tool's plain description is shown once per plan, where it first appears.
  const explained = new Set<string>();
  const once = (e: BaseRoute["equipment"][number]) => {
    const keys = [e.id, e.plain_name.trim().toLowerCase()];
    const explain = !keys.some((k) => explained.has(k));
    keys.forEach((k) => explained.add(k));
    return { ...e, explain };
  };

  return {
    ...base,
    routes: withScrap.map(({ r, scrap, with_scrap }, i) => ({
      ...r,
      equipment: r.equipment.map(once),
      scrap,
      with_scrap,
      labels: labels[i],
    })),
    none_open: base.routes.length > 0 && base.routes.every((r) => r.eligibility.status !== "open"),
  };
}
