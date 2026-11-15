import type { PlanOutput } from "../ai/schemas";
import type { AccessStatus, Audience, SpaceDoc } from "../schemas";
import { TYPICAL_PRICES } from "../typical-prices";
import { routeCost, withScrapTotal, type CostLine, type TypicalPrice } from "./cost";
import { eligibility, eligibilityRank } from "./eligibility";
import { firstVisit, staffService } from "./firstVisit";
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
  trainings: { id: string; name: string; how_to_sign_up: string | null; restricted_to: string | null; duration_note?: string | null }[];
  cost_lines: CostLine[];
  total: { low: number; high: number } | null;
  prices_estimated: boolean;
  /** Fields below are absent on plans stored before Nov 15. */
  /** "staff_fabrication": staff make the piece from a request; the student uses no machine and needs no training. */
  kind?: "self_use" | "staff_fabrication";
  /** The request the student makes, for a staff_fabrication route. */
  service?: { name: string; how_to_request: string | null; url: string | null } | null;
  /** Set when a material on this route is priced from the general table of typical prices. */
  typical_from?: string | null;
  /** Typical-practice notes for a space whose page is silent. Worded as likely, shown as estimated. */
  estimate_notes?: { basis: string; training: string | null; cost: string | null } | null;
  space_url?: string;
  hours_listed?: boolean;
  /** The space sells no material: the student brings their own. */
  bring_your_own?: boolean;
  /** True when the student would run tools at a space that lists no trainings, so what is needed is not known. */
  training_unknown?: boolean;
};

/** Kinds of work whose material a student could buy, so a typical price makes sense. Not posters or recordings. */
const MAKES_FROM_MATERIAL = new Set<string>([
  "fdm_3d_printing", "resin_3d_printing", "laser_cutting", "woodworking", "metalworking", "cnc_machining", "electronics", "hand_tools", "textiles",
]);

/** Sentences that name a file type. No space's page states one, so they are removed from steps and warnings. */
const FILE_TYPE = /\b(pdf|stl|svg|dxf|obj|step|png|jpe?g|gcode|g-code|\.ai)\b/i;
export function withoutFileTypes(text: string, fallback: string): string {
  if (!FILE_TYPE.test(text)) return text;
  const kept = text.split(/(?<=[.!?])\s+/).filter((sentence) => !FILE_TYPE.test(sentence));
  return kept.length ? kept.join(" ") : fallback;
}

/** What the student does when staff make the piece. Titles are fixed; details come from the space's service. */
const FAB_TITLES = ["Prepare the file", "Submit the work order", "Collect and pay"] as const;
function fabricationSteps(model: { title: string; detail: string }[], service: { how_to_request: string | null; steps?: string[] }, spaceName: string) {
  const norm = (t: string) => t.trim().toLowerCase().replace(/[.\s]+$/, "");
  // The model was asked for exactly these three; keep its wording when it complied.
  if (model.length === 3 && model.every((st, i) => norm(st.title) === FAB_TITLES[i].toLowerCase())) return model;
  const design = model[0]?.detail ?? "Make or find a 3D model of your piece and check its size.";
  const [submit, , collect] = service.steps ?? [];
  return [
    { title: FAB_TITLES[0], detail: design },
    { title: FAB_TITLES[1], detail: submit ?? service.how_to_request ?? `Ask the staff at ${spaceName} how to send your request.` },
    { title: FAB_TITLES[2], detail: collect ?? `Collect the piece at ${spaceName} when staff tell you it is ready, and pay for the material.` },
  ];
}

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

/** A typical price applies only to routes that make something from material the student could buy. */
function comparable(space: SpaceDoc, equipmentIds: string[]): boolean {
  if (equipmentIds.length === 0) return false;
  return equipmentIds.every((id) => MAKES_FROM_MATERIAL.has(space.equipment.find((e) => e.id === id)?.capability ?? ""));
}

/** The space's typical-practice training note may be about some kinds of equipment only. */
function noteApplies(space: SpaceDoc, equipmentIds: string[]): boolean {
  const only = space.estimates?.training_note_for;
  if (!only?.length) return true;
  return equipmentIds.some((id) => only.includes(space.equipment.find((e) => e.id === id)!.capability));
}

const firstVisitFor = (space: SpaceDoc, equipmentIds: string[]) =>
  firstVisit(space, trainingsFor(space, equipmentIds), staffService(space, equipmentIds));

/** A request any student may make is open to them, whatever the space's own access says. */
function routeEligibility(space: SpaceDoc, audience: Audience, service: { open_to_all?: boolean } | null) {
  return service?.open_to_all ? { status: "open" as const, note: null } : eligibility(space, audience);
}

export function computeBase(model: PlanOutput, spaces: SpaceDoc[], audience: Audience, typicalPrices: TypicalPrice[] = TYPICAL_PRICES): BasePlan {
  const byId = new Map(spaces.map((s) => [s.id, s]));

  const routes: BaseRoute[] = model.routes.map((r) => {
    const space = byId.get(r.space_id)!;
    const service = staffService(space, r.equipment_ids);
    const trainings = trainingsFor(space, r.equipment_ids);
    const cost = routeCost(space, r.materials, audience, typicalPrices, comparable(space, r.equipment_ids));
    const selfUse = r.equipment_ids.some((id) => space.equipment.find((e) => e.id === id)?.staff_operated !== true);
    const est = space.estimates;
    return {
      space_id: space.id,
      space_name: space.name,
      space_location: space.location,
      space_url: space.official_url,
      hours_listed: !!space.hours,
      bring_your_own: space.sells_materials === false,
      training_unknown: !service && selfUse && space.trainings.length === 0,
      kind: service ? "staff_fabrication" : "self_use",
      service: service ? { name: service.name, how_to_request: service.how_to_request, url: service.url ?? null } : null,
      equipment: r.equipment_ids.map((id) => {
        const e = space.equipment.find((x) => x.id === id)!;
        return { id, name: e.name, plain_name: e.plain_name };
      }),
      process: r.process,
      fit_reason: r.fit_reason,
      steps: (service ? fabricationSteps(r.steps, service, space.name) : r.steps).map((st) => ({
        title: st.title,
        detail: withoutFileTypes(st.detail, "Get your file ready and check its size."),
      })),
      warnings: r.warnings.map((w) => ({ issue: withoutFileTypes(w.issue, "Check your file before you go."), fix: withoutFileTypes(w.fix, "Ask the space's staff what they need from you.") })),
      eligibility: routeEligibility(space, audience, service),
      trainings: trainings.map((t) => ({
        id: t.id,
        name: t.name,
        how_to_sign_up: t.how_to_sign_up,
        restricted_to: t.restricted_to,
        duration_note: t.duration_note,
      })),
      cost_lines: cost.lines,
      total: cost.total,
      prices_estimated: cost.prices_estimated,
      typical_from: cost.typical_from,
      estimate_notes: est
        ? {
            basis: est.basis,
            // Only where the space lists no training of its own for tools the student would run.
            training:
              trainings.length === 0 && r.equipment_ids.length > 0 && !service && selfUse && noteApplies(space, r.equipment_ids)
                ? est.training_note
                : null,
            cost: cost.typical_from || cost.total === null ? est.cost_note : null,
          }
        : null,
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
    top && topSpace ? firstVisitFor(topSpace, top.equipment.map((e) => e.id)) : [];

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
 * first-visit list are worked out again from the space data, and materials
 * are priced again because a space may charge audiences differently. Routes,
 * steps and quantities are not touched. `modelOrder` is the order the model
 * gave the routes in, so the result matches a plan made for that audience.
 */
export function forAudience(
  base: BasePlan,
  spaces: SpaceDoc[],
  audience: Audience,
  modelOrder: { space_id: string; process: string }[] = [],
  typicalPrices: TypicalPrice[] = TYPICAL_PRICES,
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
      if (!space) return { r, i, o: original(r) };
      // Prices can differ by audience, so the cost lines are priced again from the same quantities.
      const ids = r.equipment.map((e) => e.id);
      const cost = routeCost(space, r.cost_lines, audience, typicalPrices, comparable(space, ids));
      return {
        r: { ...r, eligibility: routeEligibility(space, audience, staffService(space, ids)), cost_lines: cost.lines, total: cost.total, prices_estimated: cost.prices_estimated, typical_from: cost.typical_from },
        i,
        o: original(r),
      };
    })
    .sort((a, b) => eligibilityRank(a.r.eligibility.status) - eligibilityRank(b.r.eligibility.status) || a.o - b.o || a.i - b.i)
    .map(({ r }) => r);
  const top = routes[0];
  const topSpace = top ? byId.get(top.space_id) : undefined;
  return {
    ...base,
    audience,
    routes,
    first_visit: top && topSpace ? firstVisitFor(topSpace, top.equipment.map((e) => e.id)) : base.first_visit,
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
      // "Cheapest" follows the price on screen, without scrap. A typical price from the general table cannot win it.
      shownLow: r.typical_from ? null : (r.total?.low ?? null),
      withScrapLow: r.typical_from ? null : (with_scrap?.low ?? null),
      trainingCount: r.trainings.length,
      staffMade: r.kind === "staff_fabrication",
      trainingUnknown: !!r.training_unknown,
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
