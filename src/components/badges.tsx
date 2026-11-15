import { Ban, Check, CircleQuestionMark } from "lucide-react";
import { ACCESS_LABELS, formatDate } from "@/lib/labels";
import type { AccessStatus, GroupStatus } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const base =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[15px] font-semibold leading-6";

const NEUTRAL_LABELS: Record<AccessStatus, string> = { open: "Open", ask_first: "Ask first", not_open: "Not open" };

/**
 * Eligibility badge. Icon and words, never color alone. `neutral` drops
 * "to you" for rows that describe another audience.
 */
export function EligibilityBadge({
  status,
  className,
  neutral = false,
}: {
  status: AccessStatus;
  className?: string;
  neutral?: boolean;
}) {
  const Icon = status === "open" ? Check : status === "ask_first" ? CircleQuestionMark : Ban;
  return (
    <span
      className={cn(
        base,
        status === "open" && "border-black bg-black text-gold",
        status === "ask_first" && "border-gold bg-gold text-black",
        status === "not_open" && "border-gray-text bg-white text-gray-text",
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      {neutral ? NEUTRAL_LABELS[status] : ACCESS_LABELS[status]}
    </span>
  );
}

/** "Estimated" or "Confirmed by staff on <date>" beside a group of facts. */
export function FactChip({ status }: { status: GroupStatus }) {
  if (status.state === "confirmed") {
    return (
      <span className={cn(base, "border-black bg-black font-normal text-gold")}>
        <Check aria-hidden className="size-4" />
        Confirmed by staff on {formatDate(status.confirmed_on)}
      </span>
    );
  }
  return (
    <span className={cn(base, "border-gold bg-gold font-normal text-black")}>
      <CircleQuestionMark aria-hidden className="size-4" />
      Estimated
    </span>
  );
}
