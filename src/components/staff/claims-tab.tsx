"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { secondaryBtn } from "@/components/account/gate";
import { MATERIAL_LABELS, formatWhen } from "@/lib/labels";
import type { MaterialCategory } from "@/lib/schemas";

type Claim = { id: string; hold_until: string; item: { id: string; title: string; size_note: string | null }; claimant: { name: string | null; email: string | null } };
type Item = { id: string; title: string; material_category: MaterialCategory; status: "available" | "reserved" };

export function ClaimsTab({ spaceId, version }: { spaceId: string; version: number }) {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState<
    | { kind: "picked_up" | "release"; itemId: string; title: string; who: string }
    | { kind: "remove"; itemId: string; title: string }
    | null
  >(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  const load = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        fetch(`/api/staff/claims?space_id=${spaceId}`, { cache: "no-store" }),
        fetch(`/api/staff/scrap?space_id=${spaceId}`, { cache: "no-store" }),
      ]);
      if (!c.ok || !i.ok) throw new Error();
      setClaims((await c.json()).claims);
      setItems((await i.json()).items);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [spaceId]);
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, version]);

  async function setStatus(itemId: string, status: string, done: string) {
    setNotice(null);
    const res = await fetch(`/api/staff/scrap/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setNotice(res.ok ? done : "That did not work. Please try again.");
    await load();
  }

  if (failed)
    return (
      <div className="space-y-3">
        <p role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          <span>We could not load the claims. Check your connection and try again.</span>
        </p>
        <button type="button" onClick={load} className={secondaryBtn}>Try again</button>
      </div>
    );
  if (!claims) return <p role="status" className="text-gray-text">Loading claims...</p>;
  const inBin = items.filter((i) => i.status === "available");

  return (
    <div className="space-y-8">
      <p ref={noticeRef} tabIndex={-1} role="status" className={notice ? "notice" : "sr-only"}>{notice}</p>
      <section aria-labelledby="held" className="space-y-3">
        <h3 id="held" className="text-[22px] font-bold">On hold for students</h3>
        {claims.length === 0 ? (
          <p>No pieces are on hold right now. When a student claims one, it shows here with their name.</p>
        ) : (
          <ul className="space-y-4">
            {claims.map((c) => (
              <li key={c.id} className="card space-y-2 p-3">
                <p className="font-bold">{c.item.title}</p>
                <p className="text-[15px]">
                  For {c.claimant.name ?? "a student"} ({c.claimant.email ?? "no email"}). Held until {formatWhen(c.hold_until)}.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setAsking({ kind: "picked_up", itemId: c.item.id, title: c.item.title, who: c.claimant.name ?? c.claimant.email ?? "a student" })} className="btn btn-gold btn-sm">
                    Picked up<span className="sr-only">: {c.item.title}</span>
                  </button>
                  <button type="button" onClick={() => setAsking({ kind: "release", itemId: c.item.id, title: c.item.title, who: c.claimant.name ?? c.claimant.email ?? "a student" })} className={`${secondaryBtn} btn-sm`}>
                    Release<span className="sr-only">: {c.item.title}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="in-bin" className="space-y-3">
        <h3 id="in-bin" className="text-[22px] font-bold">In the bin now</h3>
        {inBin.length === 0 ? (
          <p>Nothing from your space is in the bin. Post a piece from the Post scrap tab.</p>
        ) : (
          <ul className="space-y-3">
            {inBin.map((i) => (
              <li key={i.id} className="panel flex flex-wrap items-center justify-between gap-3 p-3">
                <span>
                  <span className="font-bold">{i.title}</span>
                  <span className="block text-[15px] text-gray-text">{MATERIAL_LABELS[i.material_category]}</span>
                </span>
                <button type="button" onClick={() => setAsking({ kind: "remove", itemId: i.id, title: i.title })} className={`${secondaryBtn} btn-sm`}>
                  Remove<span className="sr-only">: {i.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={asking?.kind === "picked_up"}
        title="Mark this piece as picked up?"
        confirmLabel="Mark as picked up"
        busyLabel="Saving..."
        cancelLabel="Not yet"
        tone="gold"
        onConfirm={() => (asking ? setStatus(asking.itemId, "picked_up", "Marked as picked up. Thank you.") : undefined)}
        onClose={() => setAsking(null)}
        fallbackFocus={noticeRef}
      >
        <p>
          <strong className="font-bold">{asking?.title}</strong>, held for {asking && "who" in asking ? asking.who : "a student"}.
        </p>
        <p>This ends the hold, takes the piece off every list for good, and adds one to the count of pieces reused on the home page. It cannot be undone here.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={asking?.kind === "release"}
        title="Release this hold?"
        confirmLabel="Release the hold"
        busyLabel="Releasing..."
        cancelLabel="Keep the hold"
        onConfirm={() => (asking ? setStatus(asking.itemId, "available", "Released. The piece is back in the bin.") : undefined)}
        onClose={() => setAsking(null)}
        fallbackFocus={noticeRef}
      >
        <p>
          The hold on <strong className="font-bold">{asking?.title}</strong> for {asking && "who" in asking ? asking.who : "a student"} ends now.
        </p>
        <p>The piece goes back in the bin and any student can claim it. Forge does not tell the student, and the hold cannot be given back.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={asking?.kind === "remove"}
        title="Remove this piece from the bin?"
        confirmLabel="Remove from the bin"
        busyLabel="Removing..."
        cancelLabel="Keep it in the bin"
        onConfirm={() => (asking ? setStatus(asking.itemId, "removed", "Removed from the bin.") : undefined)}
        onClose={() => setAsking(null)}
        fallbackFocus={noticeRef}
      >
        <p>
          <strong className="font-bold">{asking?.title}</strong> will no longer be shown to students.
        </p>
        <p>This cannot be undone. To list it again you would have to post it again with a new photo.</p>
      </ConfirmDialog>
    </div>
  );
}
