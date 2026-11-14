import type { Metadata } from "next";

export const metadata: Metadata = { title: "Space" };

export default function SpacePage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">Space</h1>
      <p>Hours, who can use it, trainings, equipment and prices for this space.</p>
    </section>
  );
}
