import { WEEKDAY_LABELS, formatTime } from "../labels";
import { WEEKDAYS, type SpaceDoc, type Training } from "../schemas";

/** "Monday to Friday 11 AM to 10 PM; Saturday 10 AM to 5 PM" or null. */
export function hoursSummary(hours: SpaceDoc["hours"]): string | null {
  if (!hours) return null;
  const parts: string[] = [];
  let i = 0;
  while (i < WEEKDAYS.length) {
    const h = hours[WEEKDAYS[i]];
    if (!h) {
      i++;
      continue;
    }
    let j = i;
    while (
      j + 1 < WEEKDAYS.length &&
      hours[WEEKDAYS[j + 1]]?.open === h.open &&
      hours[WEEKDAYS[j + 1]]?.close === h.close
    )
      j++;
    const days = i === j ? WEEKDAY_LABELS[WEEKDAYS[i]] : `${WEEKDAY_LABELS[WEEKDAYS[i]]} to ${WEEKDAY_LABELS[WEEKDAYS[j]]}`;
    parts.push(`${days} ${formatTime(h.open)} to ${formatTime(h.close)}`);
    i = j + 1;
  }
  return parts.length ? parts.join("; ") : null;
}

type Service = SpaceDoc["services"][number];

/** The service through which staff run this equipment for the student, if every tool on the route is covered by one. */
export function staffService(space: SpaceDoc, equipmentIds: string[]): Service | null {
  if (equipmentIds.length === 0) return null;
  const tools = equipmentIds.map((id) => space.equipment.find((e) => e.id === id));
  if (!tools.every((e) => e?.staff_operated === true)) return null;
  return space.services.find((sv) => equipmentIds.every((id) => sv.equipment_ids?.includes(id))) ?? { name: "Ask staff to make it", how_to_request: null };
}

/**
 * Step 8: the "Your first visit" checklist for the top route.
 * When staff make the piece (a work order), the list is the service's own
 * steps and there is no training to take.
 */
export function firstVisit(space: SpaceDoc, trainings: Training[], service: Service | null = null): string[] {
  const hours = hoursSummary(space.hours);
  const where = hours
    ? `${space.name}, ${space.location}. Listed hours: ${hours}.`
    : `${space.name}, ${space.location}. ${space.hours_note ?? "Hours are not listed, so check the official page first."}`;
  if (service) {
    const steps = service.steps?.length ? service.steps : [service.how_to_request ?? `Ask the staff at ${space.name} how to request this.`];
    return [...steps, `Pick-up is at ${where}`];
  }
  const items: string[] = [`Go to ${where}`];
  items.push(...space.access_steps);
  // Short name: "Level 1: Orientation and safety" -> "level 1".
  const short = (name: string) => name.split(":")[0].trim().toLowerCase();
  const mentions = (step: string, name: string) => {
    const s = step.toLowerCase();
    return s.includes(name.toLowerCase()) || new RegExp(`\\b${short(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(s);
  };
  for (const t of trainings) {
    // A step already covers this training only if it is about this one alone.
    const already = space.access_steps.some(
      (step) => mentions(step, t.name) && !space.trainings.some((o) => o.id !== t.id && mentions(step, o.name)),
    );
    if (already) continue;
    items.push(`Take ${t.name}. ${t.duration_note ? `${t.duration_note} ` : ""}${t.how_to_sign_up ?? "Ask the staff how to sign up."}`);
  }
  // Where the official page is silent: typical practice, worded as likely, never as fact.
  for (const line of space.estimates?.first_visit ?? []) items.push(line);
  return items;
}
