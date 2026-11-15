import type { AccessStatus, Audience, Capability, Experience, Weekday } from "./schemas";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  viterbi_undergrad: "Viterbi undergrad",
  viterbi_grad: "Viterbi grad student",
  usc_undergrad_other: "Other USC undergrad",
  usc_grad_other: "Other USC grad student",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  never: "Never built anything",
  basic_tools: "Used basic tools",
  workshop: "Comfortable in a workshop",
};

export const CAPABILITY_LABELS: Record<Capability, string> = {
  fdm_3d_printing: "3D printing",
  resin_3d_printing: "Resin 3D printing (very fine detail)",
  laser_cutting: "Laser cutting",
  woodworking: "Woodworking",
  metalworking: "Metalworking",
  cnc_machining: "CNC machining (computer-guided cutting)",
  electronics: "Electronics",
  hand_tools: "Hand tools",
  textiles: "Sewing and textiles",
  video_production: "Video",
  audio_recording: "Audio recording",
  photography: "Photography",
};

export const ACCESS_LABELS: Record<AccessStatus, string> = {
  open: "Open to you",
  ask_first: "Ask first",
  not_open: "Not open to you",
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** "11:00" -> "11 AM", "17:30" -> "5:30 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2026-11-14" -> "Nov 14, 2026", without time-zone drift. */
export function formatDate(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
