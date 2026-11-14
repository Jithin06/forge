import type { Metadata } from "next";

export const metadata: Metadata = { title: "Scrap" };

export default function ScrapPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">Free scrap</h1>
      <p>Leftover material that spaces are giving away. Claim a piece and pick it up.</p>
    </section>
  );
}
