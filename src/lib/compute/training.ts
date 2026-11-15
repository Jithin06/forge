import type { SpaceDoc, Training } from "../schemas";

/**
 * Step 3: the union of required trainings for the route's equipment, plus
 * their prerequisites (transitively), with prerequisites listed first.
 */
export function trainingsFor(space: SpaceDoc, equipmentIds: string[]): Training[] {
  const byId = new Map(space.trainings.map((t) => [t.id, t]));
  const ordered: Training[] = [];
  const seen = new Set<string>();

  const visit = (id: string, path: Set<string>) => {
    if (seen.has(id) || path.has(id)) return;
    const t = byId.get(id);
    if (!t) return;
    path.add(id);
    t.prerequisite_ids.forEach((p) => visit(p, path));
    path.delete(id);
    seen.add(id);
    ordered.push(t);
  };

  for (const eid of equipmentIds) {
    const eq = space.equipment.find((e) => e.id === eid);
    eq?.required_training_ids.forEach((tid) => visit(tid, new Set()));
  }
  return ordered;
}
