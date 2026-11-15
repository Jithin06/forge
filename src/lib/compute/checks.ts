import type { SpaceDoc } from "../schemas";
import type { FinalRoute } from "./plan";

type RouteLike = Pick<FinalRoute, "bring_your_own"> & {
  cost_lines: { low_usd: number | null; typical?: boolean }[];
  equipment: { id: string }[];
};

/**
 * A space that sells no material must never show a price of its own on
 * something the student makes there. Used by the eval on every live plan.
 *
 * One exemption: a 3D print made by work order is charged by the material
 * used, and that charge is the space's own. So a priced line is fine when the
 * route includes equipment that staff run through a service, whether the
 * whole route is a work order or the student also does other work there.
 */
export function ownPriceWhereNothingIsSold(route: RouteLike, space: Pick<SpaceDoc, "equipment" | "services">): boolean {
  if (!route.bring_your_own) return false;
  if (!route.cost_lines.some((l) => l.low_usd !== null && !l.typical)) return false;
  const staffRun = route.equipment.some(
    (e) => space.equipment.find((x) => x.id === e.id)?.staff_operated === true && space.services.some((sv) => sv.equipment_ids?.includes(e.id)),
  );
  return !staffRun;
}
