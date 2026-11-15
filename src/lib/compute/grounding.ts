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

  if (DOLLAR.test(JSON.stringify(plan))) {
    errors.push("the answer states a dollar amount; prices come only from stored data, so leave them out");
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
