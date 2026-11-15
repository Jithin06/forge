import type { PlanOutput } from "../ai/schemas";
import type { SpaceDoc } from "../schemas";

export type GroundingResult = { ok: true } | { ok: false; errors: string[] };

const DOLLAR = /\$\s?\d|\d\s?(usd|dollars?)\b|\bdollars?\b/i;

/**
 * Step 1 of SPEC.md 6.3: every id the model used must exist, and belong to
 * the route's space; each material's category must match its id. Also
 * refuses any dollar amount, since prices come only from stored data.
 */
export function groundPlan(plan: PlanOutput, spaces: SpaceDoc[]): GroundingResult {
  const byId = new Map(spaces.map((s) => [s.id, s]));
  const allEquipment = new Map(spaces.flatMap((s) => s.equipment.map((e) => [e.id, s.id] as const)));
  const errors: string[] = [];

  plan.routes.forEach((route, i) => {
    const at = `routes[${i}]`;
    const space = byId.get(route.space_id);
    if (!space) {
      errors.push(`${at}.space_id "${route.space_id}" is not a known space`);
      return;
    }
    const equipmentHere = new Set(space.equipment.map((e) => e.id));
    for (const eid of route.equipment_ids) {
      if (equipmentHere.has(eid)) continue;
      const owner = allEquipment.get(eid);
      errors.push(
        owner
          ? `${at}: equipment "${eid}" belongs to space "${owner}", not "${space.id}"`
          : `${at}: equipment "${eid}" does not exist`,
      );
    }
    route.materials.forEach((m, j) => {
      if (m.material_id === null) return;
      const mat = space.materials.find((x) => x.id === m.material_id);
      if (!mat) {
        errors.push(`${at}.materials[${j}]: material "${m.material_id}" is not stocked at "${space.id}"`);
      } else if (mat.category !== m.category) {
        errors.push(
          `${at}.materials[${j}]: material "${m.material_id}" is category "${mat.category}", not "${m.category}"`,
        );
      }
    });
  });

  // Routes must be different ways: a different space or different equipment.
  // Two routes with the same space and the same tools are one way said twice.
  const seen = new Map<string, number>();
  plan.routes.forEach((route, i) => {
    const key = `${route.space_id}|${[...new Set(route.equipment_ids)].sort().join("+")}`;
    const first = seen.get(key);
    if (first !== undefined) {
      errors.push(
        `routes[${i}] uses the same space and the same equipment as routes[${first}]; a second route must be a different process or a different space, so remove it or change it`,
      );
    } else seen.set(key, i);
  });

  // The model lists the ways it considered before choosing routes. Its list
  // must name real spaces and agree with the routes it returned.
  for (const [i, w] of plan.ways_considered.entries()) {
    if (!byId.has(w.space_id)) errors.push(`ways_considered[${i}].space_id "${w.space_id}" is not a known space`);
  }
  const offered = plan.ways_considered.filter((w) => w.verdict === "offered").length;
  if (plan.routes.length > 0 && plan.routes.length < Math.min(offered, 3)) {
    errors.push(
      `ways_considered marks ${offered} ways as offered but there ${plan.routes.length === 1 ? "is 1 route" : `are ${plan.routes.length} routes`}; give a route for each offered way (up to 3), or mark the others left_out`,
    );
  }

  if (DOLLAR.test(JSON.stringify(plan))) {
    errors.push("the answer states a dollar amount; prices come only from stored data, so leave them out");
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Spaces the plan passed over although they list equipment for everything one
 * of its routes uses (hand tools aside). Not an error: the model is asked
 * once to add them or to give a reason about the equipment or the material.
 */
export function missedSpaces(plan: PlanOutput, spaces: SpaceDoc[]): string[] {
  if (plan.routes.length === 0 || plan.routes.length >= 3) return [];
  const used = new Set(plan.routes.map((r) => r.space_id));
  const notes: string[] = [];
  const flagged = new Set<string>();
  for (const route of plan.routes) {
    const here = spaces.find((s) => s.id === route.space_id);
    const caps = new Set(
      route.equipment_ids.flatMap((id) => here?.equipment.find((e) => e.id === id)?.capability ?? []).filter((c) => c !== "hand_tools"),
    );
    if (caps.size === 0) continue;
    for (const other of spaces) {
      if (used.has(other.id) || flagged.has(other.id)) continue;
      const has = new Set(other.equipment.map((e) => e.capability));
      if ([...caps].every((c) => has.has(c))) {
        flagged.add(other.id);
        notes.push(
          `space "${other.id}" also lists equipment for ${[...caps].join(" and ")}, the same as your route at "${route.space_id}", but it is not a route. Add it as a route. Leave it out only if its listed equipment cannot do this job, and then say so in ways_considered (and in single_route_reason if one route remains). Who may use a space is never a reason`,
        );
      }
    }
  }
  return notes;
}
