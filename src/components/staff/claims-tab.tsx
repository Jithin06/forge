"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
    load();
  }

  if (failed)
    return (
      <div className="space-y-3">
        <p role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-4">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          We could not load the claims. Check your connection and try again.
        </p>
        <button type="button" onClick={load} className={secondaryBtn}>Try again</button>
      </div>
    );
  if (!claims) return <p role="status" className="text-gray-text">Loading claims...</p>;
  const inBin = items.filter((i) => i.status === "available");

  return (
    <div className="space-y-8">
      <p role="status" className={notice ? "rounded-lg bg-gold-soft p-3" : "sr-only"}>{notice}</p>
      <section aria-labelledby="held" className="space-y-3">
        <h3 id="held" className="text-[18px] font-semibold">On hold for students</h3>
        {claims.length === 0 ? (
          <p>No pieces are on hold right now. When a student claims one, it shows here with their name.</p>
        ) : (
          <ul className="space-y-4">
            {claims.map((c) => (
              <li key={c.id} className="space-y-2 border-l-2 border-gray-line pl-3">
                <p className="font-semibold">{c.item.title}</p>
                <p className="text-[15px]">
                  For {c.claimant.name ?? "a student"} ({c.claimant.email ?? "no email"}). Held until {formatWhen(c.hold_until)}.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setStatus(c.item.id, "picked_up", "Marked as picked up. Thank you.")} className={secondaryBtn}>
                    Picked up<span className="sr-only">: {c.item.title}</span>
                  </button>
                  <button type="button" onClick={() => setStatus(c.item.id, "available", "Released. The piece is back in the bin.")} className={secondaryBtn}>
                    Release<span className="sr-only">: {c.item.title}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="in-bin" className="space-y-3">
        <h3 id="in-bin" className="text-[18px] font-semibold">In the bin now</h3>
        {inBin.length === 0 ? (
          <p>Nothing from your space is in the bin. Post a piece from the Post scrap tab.</p>
        ) : (
          <ul className="space-y-3">
            {inBin.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-gray-line pl-3">
                <span>
                  <span className="font-semibold">{i.title}</span>
                  <span className="block text-[15px] text-gray-text">{MATERIAL_LABELS[i.material_category]}</span>
                </span>
                <button type="button" onClick={() => setStatus(i.id, "removed", "Removed from the bin.")} className={secondaryBtn}>
                  Remove<span className="sr-only">: {i.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
