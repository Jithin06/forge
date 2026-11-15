import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Band, Body } from "@/components/page";
import { PlanForMe } from "@/components/plan/plan-for-me";
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
  return <PlanForMe initial={data} />;
}

function PlanSkeleton() {
  return (
    <div aria-busy="true">
      <Band title="Your plan" />
      <Body>
        <p role="status" className="text-gray-text">Loading your plan...</p>
        {[0, 1].map((k) => (
          <div key={k} aria-hidden className="card">
            <div className="ruler" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-4 w-full" />
            </div>
            <div className="stub p-4">
              <div className="skeleton h-9 w-1/3" />
            </div>
          </div>
        ))}
      </Body>
    </div>
  );
}
