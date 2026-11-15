"use client";

import { CircleAlert, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PageSkeleton } from "@/components/account/gate";
import { Band, Body, primaryBtn, secondaryBtn } from "@/components/page";
import { Swatch } from "@/components/swatch";
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
    <span className={`${className} block`}>
      <Swatch category={item.material_category} className="size-full" />
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
      <>
        <Band title="Free scrap" />
        <Body>
          <p role="alert" className="alert">
            <CircleAlert aria-hidden className="size-5" />
            <span>We could not load the scrap bin. Check your connection and try again.</span>
          </p>
          <button type="button" onClick={load} className={primaryBtn}>Try again</button>
        </Body>
      </>
    );
  if (!data) return <PageSkeleton title="Free scrap" />;

  const shown = data.items.filter((i) => (!category || i.material_category === category) && (!space || i.space_id === space));
  const cats = MATERIAL_CATEGORIES.filter((c) => data.items.some((i) => i.material_category === c));

  return (
    <>
      <Band title="Free scrap">
        <p>Leftover material that campus spaces are giving away. Claim a piece and it is held for you for 48 hours.</p>
      </Band>
      <Body>
        {data.items.length === 0 ? (
          <div className="space-y-4">
            <p>The scrap bin is empty right now. Staff add leftovers through the week, so check back soon.</p>
            <Link href="/" className={secondaryBtn}>Plan something to build</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <fieldset className="min-w-0 space-y-2">
                <legend className="label">Material</legend>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1.5">
                  {["", ...cats].map((c) => (
                    <label key={c || "any"} className={`chip relative shrink-0 whitespace-nowrap ${category === c ? "chip-on" : ""}`}>
                      <input type="radio" name={ids.cat} value={c} checked={category === c} onChange={() => setCategory(c)} className="sr-only" />
                      {c ? MATERIAL_LABELS[c as MaterialCategory] : "Any material"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-col gap-1.5 sm:max-w-xs">
                <label htmlFor={ids.space} className="label">Space</label>
                <select id={ids.space} value={space} onChange={(e) => setSpace(e.target.value)} className="field">
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
              <div className="space-y-4">
                <p>Nothing matches those filters right now.</p>
                <button type="button" onClick={() => { setCategory(""); setSpace(""); }} className={secondaryBtn}>Show all scrap</button>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3">
                {shown.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => { setGoneNote(false); setOpen(item); }}
                      className="card group relative flex h-full w-full flex-col p-2 text-left"
                    >
                      <span aria-hidden className="tag tag-free">Free</span>
                      <Photo item={item} className="aspect-[4/3] w-full overflow-hidden rounded-lg border-[1.5px] border-black" />
                      <span className="flex flex-1 flex-col gap-0.5 px-1 pt-2">
                        <b className="leading-[1.2]">{item.title}</b>
                        <span className="text-[15px] leading-[1.3] text-gray-text">
                          {MATERIAL_LABELS[item.material_category]} · {CONDITION_LABELS[item.condition].toLowerCase()}
                        </span>
                        <span className="text-[15px] leading-[1.3] text-gray-text">{item.space_name}</span>
                      </span>
                      <span className="btn btn-gold btn-sm mt-2 w-full group-active:translate-x-0.5 group-active:translate-y-0.5">See and claim</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Body>

      <dialog
        ref={dialog}
        onClose={(e) => {
          // React passes a nested dialog's close event up to this one; only our own counts.
          if (e.target === e.currentTarget) setOpen(null);
        }}
        aria-labelledby="scrap-item-title"
        className="m-auto w-[calc(100%-2rem)] max-w-[520px] rounded-[14px] border-2 border-black p-0 shadow-[6px_6px_0_var(--black)] backdrop:bg-black/60"
      >
        {open && (
          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="scrap-item-title" className="text-[24px] font-bold leading-[1.12] tracking-[-0.01em]">{open.title}</h2>
              <button type="button" onClick={() => setOpen(null)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-black">
                <X aria-hidden className="size-6" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <Photo item={open} className="aspect-[4/3] w-full overflow-hidden rounded-lg border-[1.5px] border-black" />
            {open.description && <p>{open.description}</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-gray-text">Material</dt><dd>{MATERIAL_LABELS[open.material_category]}</dd>
              {open.size_note && (<><dt className="text-gray-text">Size</dt><dd>{open.size_note}</dd></>)}
              <dt className="text-gray-text">Condition</dt><dd>{CONDITION_LABELS[open.condition]}</dd>
              <dt className="text-gray-text">Where</dt><dd>{[open.space_name, open.space_location].filter(Boolean).join(", ")}</dd>
            </dl>
            {open.restrictions.length > 0 && (
              <div className="border-l-4 border-cardinal pl-3">
                <p className="font-bold">Before you use it</p>
                <ul className="list-disc pl-5">
                  {open.restrictions.map((r) => (<li key={r}>{r}</li>))}
                </ul>
              </div>
            )}
            <p className="text-[15px]">{open.pickup_note ?? "Ask at the front desk when you come to pick it up."}</p>
            <ClaimButton key={open.id} itemId={open.id} title={open.title} where={[open.space_name, open.space_location].filter(Boolean).join(", ")} pickup={open.pickup_note} onGone={() => { setGoneNote(true); load(); }} />
          </div>
        )}
      </dialog>
    </>
  );
}
