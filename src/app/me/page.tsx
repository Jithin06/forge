import type { Metadata } from "next";

export const metadata: Metadata = { title: "My stuff" };

export default function MePage() {
  return (
    <section className="space-y-3">
      <h1 className="text-[28px] font-bold">My stuff</h1>
      <p>Your saved plans and scrap claims will show here once you sign in.</p>
    </section>
  );
}
