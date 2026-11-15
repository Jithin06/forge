import { Ban, Check, CircleQuestionMark, FlaskConical, Info } from "lucide-react";
import { ACCESS_LABELS, formatDate } from "@/lib/labels";
import type { AccessStatus, GroupStatus } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const base = "badge";

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
        status === "ask_first" && "bg-gold text-black",
        status === "not_open" && "border-gray-text bg-white text-gray-text",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" strokeWidth={3} />
      {neutral ? NEUTRAL_LABELS[status] : ACCESS_LABELS[status]}
    </span>
  );
}

/**
 * Beside a group of facts. Confirmed facts are what should stand out, so
 * "Confirmed by staff" is the strong black and gold badge. Estimated is the
 * normal state: small gray text with an info icon that opens a one-line
 * explanation. A confirmation made with a test account says so.
 */
export function FactChip({ status }: { status: GroupStatus }) {
  if (status.state === "confirmed") {
    return (
      <span className={cn(base, status.test ? "border-black bg-white text-black" : "bg-black text-gold")}>
        {status.test ? <FlaskConical aria-hidden className="size-3.5" strokeWidth={3} /> : <Check aria-hidden className="size-3.5" strokeWidth={3} />}
        {status.test ? "Test confirmation" : "Confirmed by staff"} on {formatDate(status.confirmed_on)}
      </span>
    );
  }
  return <EstimatedNote />;
}

/** The quiet "Estimated" label. A native disclosure, so it works by tap, keyboard and screen reader with no script. */
export function EstimatedNote({ label = "Estimated" }: { label?: string }) {
  return (
    <details className="estimated group/est basis-full text-[14px] text-gray-text sm:basis-auto">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md [&::-webkit-details-marker]:hidden">
        <Info aria-hidden className="size-4" />
        <span className="underline decoration-dotted underline-offset-4">{label}</span>
        <span className="sr-only">: what this means</span>
      </summary>
      <p className="mb-2 max-w-[46ch] rounded-lg border-[1.5px] border-gray-text bg-white p-2.5 text-[15px] leading-[1.35] text-black">
        Staff at this space have not confirmed this detail yet. It comes from the space&apos;s public pages, and where those are silent it may be based on what is typical for campus workshops. Check with the space before you rely on it.
      </p>
    </details>
  );
}
