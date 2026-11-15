"use client";

import { CircleAlert, ImageOff, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PageSkeleton, primaryBtn, secondaryBtn } from "@/components/account/gate";
import { CONDITION_LABELS, MATERIAL_LABELS } from "@/lib/labels";
import { MATERIAL_CATEGORIES, type MaterialCategory } from "@/lib/schemas";
import { ClaimButton } from "./claim";

type Item = {
  id: string;
  space_id: string;
  space_name: string;
  space_location: string | null;
  pickup_note: string | null;
  material_category: MaterialCategory;
  title: string;
  description: string;
  size_note: string | null;
  condition: keyof typeof CONDITION_LABELS;
  restrictions: string[];
  photo_url: string | null;
};
type Data = { items: Item[]; spaces: { id: string; name: string }[] };

function Photo({ item, className }: { item: Item; className: string }) {
  return item.photo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.photo_url} alt={`Photo of ${item.title}`} loading="lazy" className={`${className} object-cover`} />
  ) : (
    <span className={`${className} flex items-center justify-center bg-gold-soft`}>
      <ImageOff aria-hidden className="size-6" />
      <span className="sr-only">No photo</span>
    </span>
  );
}

export function ScrapBin() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState("");
  const [space, setSpace] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const [goneNote, setGoneNote] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { cat: useId(), space: useId() };
  const autoOpened = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scrap", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => {
      const q = new URLSearchParams(window.location.search);
      if (q.get("space_id")) setSpace(q.get("space_id")!);
      load();
    });
  }, [load]);

  // Coming back from sign-in with ?claim=<id>: reopen that item so the claim can finish.
  useEffect(() => {
    if (!data || autoOpened.current) return;
    const id = new URLSearchParams(window.location.search).get("claim");
    const item = id && data.items.find((i) => i.id === id);
    if (item) {
      autoOpened.current = true;
      Promise.resolve().then(() => setOpen(item));
    }
  }, [data]);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  if (failed)
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-bold">Free scrap</h1>
        <p role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-4">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          We could not load the scrap bin. Check your connection and try again.
        </p>
        <button type="button" onClick={load} className={primaryBtn}>Try again</button>
      </div>
    );
  if (!data) return <PageSkeleton title="Free scrap" />;

  const shown = data.items.filter((i) => (!category || i.material_category === category) && (!space || i.space_id === space));
  const cats = MATERIAL_CATEGORIES.filter((c) => data.items.some((i) => i.material_category === c));
  const select = "min-h-12 w-full rounded-lg border border-gray-text bg-white px-3 text-[16px]";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-bold">Free scrap</h1>
        <p>Leftover material that campus spaces are giving away. Claim a piece and it is held for you for 48 hours.</p>
      </header>

      {data.items.length === 0 ? (
        <div className="space-y-3">
          <p>The scrap bin is empty right now. Staff add leftovers through the week, so check back soon.</p>
          <Link href="/" className={secondaryBtn}>Plan something to build</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.cat} className="font-semibold">Material</label>
              <select id={ids.cat} value={category} onChange={(e) => setCategory(e.target.value)} className={select}>
                <option value="">Any material</option>
                {cats.map((c) => (
                  <option key={c} value={c}>{MATERIAL_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.space} className="font-semibold">Space</label>
              <select id={ids.space} value={space} onChange={(e) => setSpace(e.target.value)} className={select}>
                <option value="">Any space</option>
                {data.spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p aria-live="polite" className="text-[15px] text-gray-text">
            {goneNote && "Someone just claimed that piece. Here is what is still free. "}
            {shown.length === 1 ? "1 piece" : `${shown.length} pieces`}
          </p>

          {shown.length === 0 ? (
            <div className="space-y-3">
              <p>Nothing matches those filters right now.</p>
              <button type="button" onClick={() => { setCategory(""); setSpace(""); }} className={secondaryBtn}>Show all scrap</button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shown.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => { setGoneNote(false); setOpen(item); }}
                    className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-line bg-white text-left hover:border-cardinal"
                  >
                    <Photo item={item} className="aspect-[4/3] w-full" />
                    <span className="flex flex-1 flex-col gap-0.5 p-3">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-[15px] text-gray-text">{MATERIAL_LABELS[item.material_category]}</span>
                      <span className="text-[15px] text-gray-text">{item.space_name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        aria-labelledby="scrap-item-title"
        className="m-auto w-[calc(100%-2rem)] max-w-[520px] rounded-xl border border-gray-line p-0 backdrop:bg-black/60"
      >
        {open && (
          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="scrap-item-title" className="text-[22px] font-semibold">{open.title}</h2>
              <button type="button" onClick={() => setOpen(null)} className="flex size-11 shrink-0 items-center justify-center rounded-lg">
                <X aria-hidden className="size-6" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <Photo item={open} className="aspect-[4/3] w-full rounded-lg" />
            {open.description && <p>{open.description}</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-gray-text">Material</dt><dd>{MATERIAL_LABELS[open.material_category]}</dd>
              {open.size_note && (<><dt className="text-gray-text">Size</dt><dd>{open.size_note}</dd></>)}
              <dt className="text-gray-text">Condition</dt><dd>{CONDITION_LABELS[open.condition]}</dd>
              <dt className="text-gray-text">Where</dt><dd>{[open.space_name, open.space_location].filter(Boolean).join(", ")}</dd>
            </dl>
            {open.restrictions.length > 0 && (
              <div className="border-l-4 border-cardinal pl-3">
                <p className="font-semibold">Before you use it</p>
                <ul className="list-disc pl-5">
                  {open.restrictions.map((r) => (<li key={r}>{r}</li>))}
                </ul>
              </div>
            )}
            <p className="text-[15px]">{open.pickup_note ?? "Ask at the front desk when you come to pick it up."}</p>
            <ClaimButton key={open.id} itemId={open.id} title={open.title} onGone={() => { setGoneNote(true); load(); }} />
          </div>
        )}
      </dialog>
    </div>
  );
}
