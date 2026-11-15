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
  const link = "flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-black";
  if (!session) return <span className="min-h-11 w-20" aria-hidden />;
  if (!session.user) {
    const next = pathname && pathname !== "/sign-in" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/sign-in${next}`} className={link}>
        <UserRound aria-hidden className="size-5" />
        Sign in
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-1">
      {session.staff_space_ids.length > 0 && (
        <Link href="/staff" className={link}>
          <Wrench aria-hidden className="size-5" />
          Staff
        </Link>
      )}
      <Link href="/me" className={link}>
        <UserRound aria-hidden className="size-5" />
        My stuff
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
        <AccountLinks pathname={pathname} />
      </div>
    </header>
  );
}
