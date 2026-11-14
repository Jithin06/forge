"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_TABS, isActive } from "./nav-tabs";

/** Bottom tab bar, phones only. Desktop uses the links in the header. */
function TabBarLive() {
  return <TabBarView pathname={usePathname()} />;
}

/** Without Suspense, usePathname() blocks prerendering; the fallback shows no active tab. */
export function TabBar() {
  return (
    <Suspense fallback={<TabBarView pathname="" />}>
      <TabBarLive />
    </Suspense>
  );
}

function TabBarView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-[680px]">
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[15px]",
                  active ? "font-semibold text-cardinal" : "text-black",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
