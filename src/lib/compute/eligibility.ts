import type { AccessStatus, Audience, SpaceDoc } from "../schemas";

export type Eligibility = { status: AccessStatus; note: string | null };

const ORDER: Record<AccessStatus, number> = { open: 0, ask_first: 1, not_open: 2 };

/**
 * Who may use a space comes only from the space document, never from model
 * output. Unknown or missing access falls back to "ask_first", never "open".
 */
export function eligibility(space: Pick<SpaceDoc, "access">, audience: Audience): Eligibility {
  const entry = space.access.find((a) => a.audience === audience);
  if (!entry) return { status: "ask_first", note: null };
  return { status: entry.status, note: entry.note };
}

/** Sort key: open first, then ask first, then not open. */
export function eligibilityRank(status: AccessStatus): number {
  return ORDER[status];
}
