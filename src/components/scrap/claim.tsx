"use client";

import { CircleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/account/use-session";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatWhen } from "@/lib/labels";

type Result =
  | { state: "idle" | "working" }
  | { state: "claimed"; where: string; by: string; pickup: string | null }
  | { state: "gone" }
  | { state: "error"; message: string };

type Props = {
  itemId: string;
  title: string;
  /** Where to pick it up, e.g. "Baum Family Maker Space, ground floor". */
  where?: string;
  pickup?: string | null;
  planId?: string;
  onGone?: () => void;
};

/**
 * Claim one piece of scrap, after a step that says what will happen.
 * Signed out: go to sign-in and come back to this exact item (?claim=<id>),
 * where that step opens again. Nothing is claimed until it is confirmed.
 */
export function ClaimButton({ itemId, title, where, pickup, planId, onGone }: Props) {
  const pathname = usePathname();
  const session = useSession();
  const [result, setResult] = useState<Result>({ state: "idle" });
  const [asking, setAsking] = useState(false);
  const resumed = useRef(false);
  const outcome = useRef<HTMLParagraphElement>(null);

  const toSignIn = useCallback(() => {
    const back = `${pathname}?claim=${itemId}`;
    // A full page load on purpose: it closes the item sheet this button may be
    // inside. A client-side move would leave that sheet open and blocking taps.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/sign-in?next=${encodeURIComponent(back)}`;
  }, [pathname, itemId]);

  const claim = useCallback(async () => {
    setResult({ state: "working" });
    try {
      const res = await fetch(`/api/scrap/${itemId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planId ? { plan_id: planId } : {}),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) return toSignIn();
      if (res.status === 201) {
        return setResult({
          state: "claimed",
          where: [data.space.name, data.space.location].filter(Boolean).join(", "),
          by: formatWhen(data.claim.hold_until),
          pickup: data.pickup_note,
        });
      }
      if (data?.error?.code === "ALREADY_CLAIMED") {
        setResult({ state: "gone" });
        return onGone?.();
      }
      setResult({ state: "error", message: data?.error?.message ?? "We could not claim this piece. Please try again." });
    } catch {
      setResult({ state: "error", message: "We could not claim this piece. Check your connection and try again." });
    }
  }, [itemId, planId, toSignIn, onGone]);

  // Back from sign-in: reopen the "what will happen" step for the piece the student chose.
  useEffect(() => {
    if (resumed.current || !session?.user) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("claim") !== itemId) return;
    resumed.current = true;
    q.delete("claim");
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
    Promise.resolve().then(() => setAsking(true));
  }, [session, itemId]);

  // The claim button is gone once there is an outcome, so focus goes to the outcome.
  useEffect(() => {
    if (result.state === "claimed" || result.state === "gone") outcome.current?.focus();
  }, [result.state]);

  if (result.state === "claimed")
    return (
      <p ref={outcome} tabIndex={-1} role="status" className="card flex w-full items-center gap-3 bg-gold-soft p-3">
        <span aria-hidden className="stamp">Held<br />for you</span>
        <span>
          <strong className="font-bold">Claimed.</strong> Pick it up at {result.where} by {result.by}.{" "}
          {result.pickup ?? "Ask at the front desk for it."} It is also listed under My stuff.
        </span>
      </p>
    );
  if (result.state === "gone")
    return (
      <p ref={outcome} tabIndex={-1} role="status" className="panel flex w-full items-start gap-2 p-3">
        <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
        <span>
          <strong className="font-bold">Just claimed.</strong> Someone else got this piece a moment ago.
        </span>
      </p>
    );
  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={() => (session && !session.user ? toSignIn() : setAsking(true))}
        disabled={result.state === "working"}
        className="btn btn-gold"
      >
        {result.state === "working" ? "Claiming..." : "Claim this piece"}
        <span className="sr-only">: {title}</span>
      </button>
      {result.state === "error" && (
        <span role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          {result.message}
        </span>
      )}
      <ConfirmDialog
        open={asking}
        title="Claim this piece?"
        confirmLabel="Claim this piece"
        busyLabel="Claiming..."
        cancelLabel="Not now"
        tone="gold"
        onConfirm={claim}
        onClose={() => setAsking(false)}
      >
        <p>
          <strong className="font-bold">{title}</strong> will be held for you for 48 hours. Nobody else can claim it in that time.
        </p>
        <p>
          {where ? `Pick it up at ${where}.` : "Pick it up at the space that posted it."} {pickup ?? "Ask at the front desk for it."}
        </p>
        <p>If you do not pick it up within 48 hours, it goes back in the bin for someone else. You can cancel the claim under My stuff.</p>
      </ConfirmDialog>
    </div>
  );
}
