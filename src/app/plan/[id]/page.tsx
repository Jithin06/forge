import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlanView } from "@/components/plan/plan-view";
import { getPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Your plan" };

export default function PlanPage({ params }: PageProps<"/plan/[id]">) {
  return (
    <Suspense fallback={<PlanSkeleton />}>
      <PlanData params={params} />
    </Suspense>
  );
}

async function PlanData({ params }: { params: PageProps<"/plan/[id]">["params"] }) {
  const { id } = await params;
  const data = await getPlan(id);
  if (!data) notFound();
  return <PlanView data={data} />;
}

function PlanSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <h1 className="text-[28px] font-bold">Your plan</h1>
      <p role="status" className="text-gray-text">Loading your plan...</p>
      <div aria-hidden className="h-48 animate-pulse rounded-xl border border-gray-line" />
      <div aria-hidden className="h-48 animate-pulse rounded-xl border border-gray-line" />
    </div>
  );
}
