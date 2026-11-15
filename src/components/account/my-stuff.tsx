"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/labels";
import { Band, Body } from "@/components/page";
import { PageSkeleton, primaryBtn, secondaryBtn } from "./gate";
import { ProfileSection } from "./profile-section";

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
  const [cancelling, setCancelling] = useState<{ id: string; title: string } | null>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

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
    await load();
  }

  if (state.status === "loading") return <PageSkeleton title="My stuff" />;
  if (state.status === "signed_out")
    return (
      <>
        <Band title="My stuff">
          <p>You are not signed in. Your profile is kept in this browser.</p>
        </Band>
        <Body>
          <ProfileSection />
          <section aria-labelledby="keep-it" className="panel-free space-y-3 p-4">
            <h2 id="keep-it" className="text-[22px] font-bold">Sign in to keep it</h2>
            <p>Signed in, your profile is saved to your account and follows you to any device. You can also save plans and claim free scrap.</p>
            <Link href="/sign-in?next=%2Fme" className={primaryBtn}>Sign in with your USC account</Link>
          </section>
        </Body>
      </>
    );
  if (state.status === "error")
    return (
      <>
        <Band title="My stuff" />
        <Body>
          <p role="alert" className="alert">
            <CircleAlert aria-hidden className="size-5" />
            <span>We could not load your plans and claims. Check your connection and try again.</span>
          </p>
          <button type="button" onClick={load} className={primaryBtn}>Try again</button>
        </Body>
      </>
    );

  const { me } = state;
  return (
    <>
      <Band title="My stuff">
        <p className="text-[16px] break-all">Signed in as {me.profile.email}</p>
      </Band>
      <Body>
      <ProfileSection />

      <section aria-labelledby="my-plans" className="space-y-3">
        <h2 id="my-plans" className="text-[24px] font-bold tracking-[-0.01em]">My plans</h2>
        {me.plans.length === 0 ? (
          <div className="space-y-3">
            <p>No plans yet. Describe something you want to make and it will be saved here.</p>
            <Link href="/" className={primaryBtn}>Plan something</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {me.plans.map((p) => (
              <li key={p.id} className="card relative p-3 has-[a:hover]:bg-gold-soft">
                <Link href={`/plan/${p.id}`} className="link after:absolute after:inset-0 after:rounded-xl">
                  {p.summary ?? p.idea_text.slice(0, 80)}
                </Link>
                <p className="text-[15px]">Made {formatDate(p.created_at.slice(0, 10))}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-claims" className="space-y-3">
        <h2 id="my-claims" className="text-[24px] font-bold tracking-[-0.01em]">My claims</h2>
        <p ref={noticeRef} tabIndex={-1} role="status" className={notice ? "notice" : "sr-only"}>{notice}</p>
        {me.claims.length === 0 ? (
          <div className="space-y-3">
            <p>No claims yet. Free leftover material shows up in your plans and in the Scrap tab.</p>
            <Link href="/scrap" className={secondaryBtn}>See free scrap</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {me.claims.map((c) => (
              <li key={c.id} className={`flex flex-wrap items-center justify-between gap-3 p-3 ${c.status === "active" ? "panel-free" : "panel"}`}>
                <div>
                  <p className="font-bold">{c.item?.title ?? "A piece that is no longer listed"}</p>
                  <p className="text-[15px]">
                    {CLAIM_STATUS[c.status]}
                    {c.status === "active" ? `. Pick it up by ${when(c.hold_until)}.` : "."}
                  </p>
                </div>
                {c.status === "active" && (
                  <button type="button" onClick={() => setCancelling({ id: c.id, title: c.item?.title ?? "this piece" })} className={`${secondaryBtn} btn-sm`}>
                    Cancel<span className="sr-only"> claim on {c.item?.title}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel your claim?"
        confirmLabel="Cancel my claim"
        busyLabel="Cancelling..."
        cancelLabel="Keep my claim"
        onConfirm={() => (cancelling ? cancel(cancelling.id) : undefined)}
        onClose={() => setCancelling(null)}
        fallbackFocus={noticeRef}
      >
        <p>
          <strong className="font-bold">{cancelling?.title}</strong> goes back in the scrap bin right away, and someone else can claim it.
        </p>
        <p>This cannot be undone. If the piece is still in the bin later, you can claim it again.</p>
      </ConfirmDialog>

      <form method="post" action="/auth/sign-out" className="border-t-2 border-dashed border-black pt-5">
        <button type="submit" className={secondaryBtn}>Sign out</button>
      </form>
      </Body>
    </>
  );
}
