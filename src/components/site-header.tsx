"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_TABS, isActive } from "./nav-tabs";

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
    <header className="border-b border-gray-line bg-white">
      <div className="mx-auto flex h-14 max-w-[680px] items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex min-h-11 items-center text-[22px] font-bold text-cardinal"
        >
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
                      "flex min-h-11 items-center px-3",
                      active
                        ? "font-semibold text-cardinal underline underline-offset-4"
                        : "text-black",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link
          href="/me"
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-black"
        >
          <UserRound aria-hidden className="size-5" />
          My stuff
        </Link>
      </div>
    </header>
  );
}
