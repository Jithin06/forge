import type { Metadata } from "next";

export const metadata: Metadata = { title: "Spaces" };

export default function SpacesPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">Spaces</h1>
      <p>Places at USC where you can build things, and whether each one is open to you.</p>
    </section>
  );
}
