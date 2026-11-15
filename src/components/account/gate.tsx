"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Band, Body, primaryBtn, secondaryBtn } from "@/components/page";

export { primaryBtn, secondaryBtn };

/** Shown in place of a page that needs sign-in. Says why, and returns here afterwards. */
export function SignInGate({ title, why }: { title: string; why: string }) {
  const pathname = usePathname();
  return (
    <>
      <Band title={title}>
        <p>{why}</p>
      </Band>
      <Body>
        <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`} className={primaryBtn}>
          Sign in with your USC account
        </Link>
      </Body>
    </>
  );
}

export function PageSkeleton({ title }: { title: string }) {
  return (
    <div aria-busy="true">
      <Band title={title} />
      <Body>
        <p role="status" className="text-gray-text">Loading...</p>
        <div aria-hidden className="card space-y-3 p-4">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
        </div>
        <div aria-hidden className="card space-y-3 p-4">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </Body>
    </div>
  );
}
