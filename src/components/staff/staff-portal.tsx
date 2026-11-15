"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSkeleton, SignInGate, secondaryBtn } from "@/components/account/gate";
import { useSession } from "@/components/account/use-session";
import { cn } from "@/lib/utils";
import { ClaimsTab } from "./claims-tab";
import { PostScrap } from "./post-scrap";
import { SpaceInfoTab } from "./space-info-tab";

const TABS = [
  { id: "post", label: "Post scrap" },
  { id: "claims", label: "Claims" },
  { id: "info", label: "Space info" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** Signed-in, allow-listed staff only. Every API route behind it enforces the same rule. */
export function StaffPortal() {
  const session = useSession();
  const [tab, setTab] = useState<TabId>("post");
  const [chosen, setChosen] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => r.json())
      .then((d) => setNames(Object.fromEntries(d.spaces.map((s: { id: string; name: string }) => [s.id, s.name]))))
      .catch(() => {});
  }, []);

  if (!session) return <PageSkeleton title="Staff portal" />;
  if (!session.user) return <SignInGate title="Staff portal" why="This page is for staff of a campus space. Sign in to open it." />;
  if (session.staff_space_ids.length === 0)
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-bold">Staff portal</h1>
        <p>
          You are signed in as {session.user.email}, which is not on the staff list for any space. If you work at a space, ask
          the Forge team to add your USC email.
        </p>
        <Link href="/spaces" className={secondaryBtn}>See all spaces</Link>
      </div>
    );

  const spaceId = chosen ?? session.staff_space_ids[0];
  const spaceName = names[spaceId];
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-bold">Staff portal</h1>
        {session.staff_space_ids.length > 1 ? (
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Space</span>
            <select value={spaceId} onChange={(e) => setChosen(e.target.value)} className="min-h-12 rounded-lg border border-gray-text bg-white px-3">
              {session.staff_space_ids.map((s) => (<option key={s} value={s}>{names[s] ?? s}</option>))}
            </select>
          </label>
        ) : (
          <p className="text-[15px] text-gray-text">
            You are staff for{" "}
            <Link href={`/spaces/${spaceId}`} className="inline-flex min-h-11 items-center text-cardinal underline underline-offset-4">
              {spaceName ?? "your space"}
            </Link>
            .
          </p>
        )}
      </header>

      <div role="tablist" aria-label="Staff tasks" className="flex gap-1 border-b border-gray-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              // Arrow keys move between tabs, as screen-reader users expect.
              const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const i = TABS.findIndex((x) => x.id === t.id);
              const next = TABS[(i + dir + TABS.length) % TABS.length].id;
              setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
            className={cn(
              "-mb-px min-h-12 border-b-4 px-3 text-[16px]",
              tab === t.id ? "border-cardinal font-semibold text-cardinal" : "border-transparent text-black",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <h2 className="sr-only">{TABS.find((t) => t.id === tab)!.label}</h2>
        {tab === "post" && <PostScrap spaceId={spaceId} onPublished={() => setVersion((v) => v + 1)} />}
        {tab === "claims" && <ClaimsTab spaceId={spaceId} version={version} />}
        {tab === "info" && <SpaceInfoTab spaceId={spaceId} />}
      </section>
    </div>
  );
}
