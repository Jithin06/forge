import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your plan" };

export default function PlanPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">Your plan</h1>
      <p>Your routes, costs and first-visit checklist will appear here.</p>
    </section>
  );
}
