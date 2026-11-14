import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff portal" };

export default function StaffPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">Staff portal</h1>
      <p>For space staff: post scrap, manage claims and keep your space&apos;s details current.</p>
    </section>
  );
}
