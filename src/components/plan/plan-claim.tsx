"use client";

import { useRouter } from "next/navigation";
import { ClaimButton } from "@/components/scrap/claim";

/** Claim from inside a plan. If someone else got it first, reload the plan so the next match shows. */
export function PlanClaim({ itemId, title, planId }: { itemId: string; title: string; planId: string }) {
  const router = useRouter();
  return <ClaimButton itemId={itemId} title={title} planId={planId} onGone={() => setTimeout(() => router.refresh(), 2500)} />;
}
