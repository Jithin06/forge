"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const primaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-cardinal px-6 font-semibold text-white hover:bg-cardinal-pressed";
export const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-cardinal bg-white px-5 font-semibold text-cardinal hover:bg-gold-soft";

/** Shown in place of a page that needs sign-in. Says why, and returns here afterwards. */
export function SignInGate({ title, why }: { title: string; why: string }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">{title}</h1>
      <p>{why}</p>
      <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`} className={primaryBtn}>
        Sign in with your USC account
      </Link>
    </div>
  );
}

export function PageSkeleton({ title }: { title: string }) {
  return (
    <div aria-busy="true" className="space-y-4">
      <h1 className="text-[28px] font-bold">{title}</h1>
      <p role="status" className="text-gray-text">Loading...</p>
      <div aria-hidden className="h-24 animate-pulse rounded-xl border border-gray-line" />
      <div aria-hidden className="h-24 animate-pulse rounded-xl border border-gray-line" />
    </div>
  );
}
