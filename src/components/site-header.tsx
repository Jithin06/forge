"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "./account/use-session";
import { NAV_TABS, isActive } from "./nav-tabs";

/** Top right: "Sign in" when signed out, "My stuff" when signed in, plus "Staff" for staff. */
function AccountLinks({ pathname }: { pathname: string }) {
  const session = useSession();
  const link = "flex min-h-11 items-center rounded-full";
  const pill = "flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[15px] font-semibold leading-none text-gold";
  if (!session) return <span className="min-h-11 w-20" aria-hidden />;
  if (!session.user) {
    const next = pathname && pathname !== "/sign-in" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/sign-in${next}`} className={link}>
        <span className={pill}>
          <UserRound aria-hidden className="size-4" />
          Sign in
        </span>
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-2">
      {session.staff_space_ids.length > 0 && (
        <Link href="/staff" className={link}>
          <span className={pill}>
            <Wrench aria-hidden className="size-4" />
            Staff
          </span>
        </Link>
      )}
      <Link href="/me" className={link}>
        <span className={pill}>
          <UserRound aria-hidden className="size-4" />
          My stuff
        </span>
      </Link>
    </span>
  );
}

function SiteHeaderLive() {
  return <SiteHeaderView pathname={usePathname()} />;
}

/** Without Suspense, usePathname() blocks prerendering; the fallback shows no active tab. */
export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderView pathname="" />}>
      <SiteHeaderLive />
    </Suspense>
  );
}

function SiteHeaderView({ pathname }: { pathname: string }) {
  return (
    <header className="peg on-dark">
      {/* 66 px is three rows of the 22 px pegboard, so the dots run on into the page band. */}
      <div className="mx-auto flex h-[66px] max-w-[680px] items-center justify-between gap-3 px-5">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-[22px] font-bold tracking-[-0.01em] text-white">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
            <rect x="1" y="1" width="24" height="24" rx="6" strokeWidth="2" className="fill-gold stroke-black" />
            <path d="M8 18V8h10M8 13h7" fill="none" strokeWidth="2.6" strokeLinecap="round" className="stroke-black" />
          </svg>
          Forge
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-2">
            {NAV_TABS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center px-3 font-semibold text-white",
                      active && "underline decoration-gold decoration-4 underline-offset-8",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <AccountLinks pathname={pathname} />
      </div>
    </header>
  );
}
