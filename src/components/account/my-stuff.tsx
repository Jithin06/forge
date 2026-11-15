"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/labels";
import { PageSkeleton, SignInGate, primaryBtn, secondaryBtn } from "./gate";

type Me = {
  profile: { email: string; display_name: string | null };
  plans: { id: string; created_at: string; idea_text: string; summary: string | null }[];
  claims: {
    id: string;
    status: "active" | "picked_up" | "expired" | "cancelled";
    hold_until: string;
    item: { id: string; title: string; size_note: string | null; space_id: string } | null;
  }[];
};

const CLAIM_STATUS = { active: "On hold for you", picked_up: "Picked up", expired: "Hold ended", cancelled: "Cancelled" } as const;
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function MyStuff() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "signed_out" } | { status: "error" } | { status: "ready"; me: Me }
  >({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) return setState({ status: "signed_out" });
      if (!res.ok) throw new Error();
      setState({ status: "ready", me: await res.json() });
    } catch {
      setState({ status: "error" });
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function cancel(id: string) {
    setNotice(null);
    const res = await fetch(`/api/claims/${id}`, { method: "DELETE" });
    setNotice(res.ok ? "Cancelled. The piece is free for someone else now." : "We could not cancel that claim. Please try again.");
    load();
  }

  if (state.status === "loading") return <PageSkeleton title="My stuff" />;
  if (state.status === "signed_out")
    return <SignInGate title="My stuff" why="Sign in to see the plans you saved and the scrap you claimed." />;
  if (state.status === "error")
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-bold">My stuff</h1>
        <p role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-4">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          We could not load your plans and claims. Check your connection and try again.
        </p>
        <button type="button" onClick={load} className={primaryBtn}>Try again</button>
      </div>
    );

  const { me } = state;
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-[28px] font-bold">My stuff</h1>
        <p className="text-[15px] text-gray-text">Signed in as {me.profile.email}</p>
      </header>

      <section aria-labelledby="my-plans" className="space-y-3">
        <h2 id="my-plans" className="text-[22px] font-semibold">My plans</h2>
        {me.plans.length === 0 ? (
          <div className="space-y-3">
            <p>No plans yet. Describe something you want to make and it will be saved here.</p>
            <Link href="/" className={primaryBtn}>Plan something</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {me.plans.map((p) => (
              <li key={p.id} className="border-l-2 border-gray-line pl-3">
                <Link href={`/plan/${p.id}`} className="inline-flex min-h-11 items-center font-semibold text-cardinal underline underline-offset-4">
                  {p.summary ?? p.idea_text.slice(0, 80)}
                </Link>
                <p className="text-[15px] text-gray-text">Made {formatDate(p.created_at.slice(0, 10))}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-claims" className="space-y-3">
        <h2 id="my-claims" className="text-[22px] font-semibold">My claims</h2>
        <p role="status">{notice}</p>
        {me.claims.length === 0 ? (
          <div className="space-y-3">
            <p>No claims yet. Free leftover material shows up in your plans and in the Scrap tab.</p>
            <Link href="/scrap" className={secondaryBtn}>See free scrap</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {me.claims.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-gray-line pl-3">
                <div>
                  <p className="font-semibold">{c.item?.title ?? "A piece that is no longer listed"}</p>
                  <p className="text-[15px]">
                    {CLAIM_STATUS[c.status]}
                    {c.status === "active" ? `. Pick it up by ${when(c.hold_until)}.` : "."}
                  </p>
                </div>
                {c.status === "active" && (
                  <button type="button" onClick={() => cancel(c.id)} className={secondaryBtn}>
                    Cancel<span className="sr-only"> claim on {c.item?.title}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form method="post" action="/auth/sign-out" className="border-t border-gray-line pt-5">
        <button type="submit" className={secondaryBtn}>Sign out</button>
      </form>
    </div>
  );
}
