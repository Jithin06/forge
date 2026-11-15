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

/** Step 8: the "Your first visit" checklist for the top route. */
export function firstVisit(space: SpaceDoc, trainings: Training[]): string[] {
  const items: string[] = [];
  const hours = hoursSummary(space.hours);
  items.push(
    hours
      ? `Go to ${space.name}, ${space.location}. Listed hours: ${hours}.`
      : `Go to ${space.name}, ${space.location}. ${space.hours_note ?? "Hours are not listed, so check the official page first."}`,
  );
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
    items.push(`Take ${t.name}. ${t.how_to_sign_up ?? "Ask the staff how to sign up."}`);
  }
  return items;
}
