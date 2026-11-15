"use client";

import { CircleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/account/use-session";
import { formatWhen } from "@/lib/labels";

type Result =
  | { state: "idle" | "working" }
  | { state: "claimed"; where: string; by: string; pickup: string | null }
  | { state: "gone" }
  | { state: "error"; message: string };

/**
 * Claim one piece of scrap. Signed out: go to sign-in and come back to this
 * exact item (?claim=<id>), where the claim completes on its own.
 */
export function ClaimButton({ itemId, title, planId, onGone }: { itemId: string; title: string; planId?: string; onGone?: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const [result, setResult] = useState<Result>({ state: "idle" });
  const resumed = useRef(false);

  const claim = useCallback(async () => {
    setResult({ state: "working" });
    try {
      const res = await fetch(`/api/scrap/${itemId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planId ? { plan_id: planId } : {}),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        const back = `${pathname}?claim=${itemId}`;
        // A full page load on purpose: it closes the item sheet this button may be
        // inside. A client-side move would leave that sheet open and blocking taps.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/sign-in?next=${encodeURIComponent(back)}`;
        return;
      }
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
  }, [itemId, planId, pathname, onGone]);

  // Back from sign-in: finish the claim the student started.
  useEffect(() => {
    if (resumed.current || !session?.user) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("claim") !== itemId) return;
    resumed.current = true;
    q.delete("claim");
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
    Promise.resolve().then(claim);
  }, [session, itemId, claim]);

  if (result.state === "claimed")
    return (
      <p role="status" className="card flex w-full items-center gap-3 bg-gold-soft p-3">
        <span aria-hidden className="stamp">Held<br />for you</span>
        <span>
          <strong className="font-bold">Claimed.</strong> Pick it up at {result.where} by {result.by}.{" "}
          {result.pickup ?? "Ask at the front desk for it."} It is also listed under My stuff.
        </span>
      </p>
    );
  if (result.state === "gone")
    return (
      <p role="status" className="panel flex w-full items-start gap-2 p-3">
        <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
        <span>
          <strong className="font-bold">Just claimed.</strong> Someone else got this piece a moment ago.
        </span>
      </p>
    );
  return (
    <span className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={claim}
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
    </span>
  );
}
