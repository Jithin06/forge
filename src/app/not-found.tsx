import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">We could not find that page</h1>
      <p>The link may be old or mistyped. You can start from the beginning.</p>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center rounded-xl bg-cardinal px-5 font-semibold text-white hover:bg-cardinal-pressed"
      >
        Plan something to build
      </Link>
    </div>
  );
}
