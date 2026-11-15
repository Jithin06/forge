"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProfile } from "@/components/profile-store";
import { AUDIENCE_LABELS } from "@/lib/labels";
import type { PlanView as PlanData } from "@/lib/plans";
import { PlanView } from "./plan-view";

/**
 * Shows the plan with badges for whoever is looking. The server sends it for
 * the audience it was made for; if this browser's profile says otherwise, or
 * the profile changes while the page is open, the badges, order and first
 * visit are fetched again for that audience. Nothing is reloaded.
 */
export function PlanForMe({ initial }: { initial: PlanData }) {
  const { audience, ready } = useProfile();
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(false);
  const shown = data.plan.audience;
  const wanted = ready && audience ? audience : shown;

  useEffect(() => {
    if (wanted === shown) return;
    let live = true;
    fetch(`/api/plan/${initial.id}?audience=${wanted}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PlanData>) : Promise.reject()))
      .then((d) => live && (setData(d), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [wanted, shown, initial.id]);

  return (
    <PlanView
      data={data}
      whoFor={
        <p className="mt-1 text-[16px]" aria-live="polite">
          Badges are for: {AUDIENCE_LABELS[shown]}.{" "}
          <Link href="/me#profile" className="inline-flex min-h-11 items-center font-bold underline">Change<span className="sr-only"> your profile</span></Link>
          {failed && " We could not update the badges for your profile. Reload to try again."}
        </p>
      }
    />
  );
}
