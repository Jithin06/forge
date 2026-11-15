"use client";

import { Camera, CircleAlert, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { primaryBtn, secondaryBtn } from "@/components/account/gate";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { resizeToJpeg } from "@/components/ask/resize-image";
import { SampleBanner } from "@/components/sample-banner";
import { CONDITION_LABELS, MATERIAL_LABELS } from "@/lib/labels";
import { MATERIAL_CATEGORIES, type MaterialCategory } from "@/lib/schemas";

const LOCKED = "Not for laser cutting or heating";
type Draft = {
  material_category: MaterialCategory;
  title: string;
  description: string;
  size_note: string;
  condition: keyof typeof CONDITION_LABELS;
  restrictions: string[];
  suggested_uses: string[];
  confidence: "low" | "medium" | "high";
  needs_staff_check: boolean;
};
type Step = { name: "photo" } | { name: "drafting" } | { name: "review"; fixture: boolean } | { name: "publishing" } | { name: "done"; title: string };

/** Photo -> AI draft -> staff edit -> publish. Nothing is listed until staff press Publish. */
export function PostScrap({ spaceId, onPublished }: { spaceId: string; onPublished: () => void }) {
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<Step>({ name: "photo" });
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const doneRef = useRef<HTMLParagraphElement>(null);
  // After publishing, the form and its button are gone: focus goes to the result.
  useEffect(() => {
    if (step.name === "done") doneRef.current?.focus();
  }, [step.name]);
  const file = useRef<HTMLInputElement>(null);
  const id = useId();
  const field = "field";

  async function send(path: string, body: unknown) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message ?? "Something went wrong. Please try again.");
    return data;
  }
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    try {
      setImage(await resizeToJpeg(f));
    } catch {
      setError("We could not read that photo. Try a JPEG or PNG.");
    }
  }
  async function makeDraft() {
    if (!image) return setError("Add a photo of the piece first.");
    setError(null);
    setStep({ name: "drafting" });
    try {
      const data = await send("/api/staff/scrap/draft", { space_id: spaceId, image, ...(note.trim() ? { note } : {}) });
      setDraft(data.draft);
      setStep({ name: "review", fixture: data.fixture });
    } catch (e) {
      setError((e as Error).message);
      setStep({ name: "photo" });
    }
  }
  /** The form's submit only opens the "what will happen" step. Nothing is listed until that is confirmed. */
  function askToPublish(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !image) return;
    if (!draft.title.trim()) return setError("Give the piece a short title.");
    setError(null);
    setAsking(true);
  }
  async function publish() {
    if (!draft || !image) return;
    const fixture = step.name === "review" && step.fixture;
    setError(null);
    setStep({ name: "publishing" });
    try {
      await send("/api/staff/scrap", {
        space_id: spaceId,
        material_category: draft.material_category,
        title: draft.title,
        description: draft.description,
        size_note: draft.size_note.trim() || null,
        condition: draft.condition,
        restrictions: draft.restrictions.filter((r) => r.trim() && r !== LOCKED),
        image,
      });
      setAsking(false);
      setStep({ name: "done", title: draft.title });
      setDraft(null);
      setImage(null);
      setNote("");
      onPublished();
    } catch (e) {
      setError((e as Error).message);
      setStep({ name: "review", fixture });
    }
  }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const alert = error && (
    <p role="alert" className="alert">
      <CircleAlert aria-hidden className="size-5" />
      <span>{error}</span>
    </p>
  );

  if (step.name === "done")
    return (
      <div className="space-y-4">
        <p ref={doneRef} tabIndex={-1} role="status" className="card flex items-center gap-3 bg-gold-soft p-3">
          <span aria-hidden className="stamp">In the<br />bin</span>
          <span>
            <strong className="font-bold">Published.</strong> “{step.title}” is in the scrap bin now.
          </span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => setStep({ name: "photo" })} className={primaryBtn}>Post another piece</button>
          <Link href="/scrap" className={secondaryBtn}>See the scrap bin</Link>
        </div>
      </div>
    );

  if ((step.name === "review" || step.name === "publishing") && draft) {
    const lockedOn = draft.material_category === "unknown_plastic";
    return (
      <form onSubmit={askToPublish} noValidate className="card space-y-4 p-4">
        {step.name === "review" && step.fixture && <SampleBanner />}
        <p>Check the draft and fix anything that is wrong. Nothing is listed until you publish.</p>
        {draft.needs_staff_check && (
          <p className="notice">
            <CircleAlert aria-hidden className="size-5" />
            The AI was not sure what this material is. Please check it yourself before publishing.
          </p>
        )}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="The photo you took" className="aspect-[4/3] w-full max-w-sm rounded-lg border-2 border-black object-cover" />
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-title`} className="label">Title</label>
          <input id={`${id}-title`} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={80} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cat`} className="label">Material</label>
          <select id={`${id}-cat`} value={draft.material_category} onChange={(e) => set("material_category", e.target.value as MaterialCategory)} className={field}>
            {MATERIAL_CATEGORIES.map((c) => (<option key={c} value={c}>{MATERIAL_LABELS[c]}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-desc`} className="label">Description</label>
          <textarea id={`${id}-desc`} value={draft.description} onChange={(e) => set("description", e.target.value)} rows={2} maxLength={300} className={field} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-size`} className="label">Size (approximate)</label>
            <input id={`${id}-size`} value={draft.size_note} onChange={(e) => set("size_note", e.target.value)} maxLength={120} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-cond`} className="label">Condition</label>
            <select id={`${id}-cond`} value={draft.condition} onChange={(e) => set("condition", e.target.value as Draft["condition"])} className={field}>
              {Object.entries(CONDITION_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-res`} className="label">Warnings for whoever takes it (one per line)</label>
          {lockedOn && (
            <p className="flex items-start gap-2 text-[15px]">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
              “{LOCKED}” is always added for unknown plastic and cannot be removed.
            </p>
          )}
          <textarea
            id={`${id}-res`}
            value={draft.restrictions.filter((r) => r !== LOCKED).join("\n")}
            onChange={(e) => set("restrictions", e.target.value.split("\n"))}
            rows={2}
            className={field}
          />
        </div>
        {draft.suggested_uses.length > 0 && <p className="text-[15px] text-gray-text">Ideas the AI suggested: {draft.suggested_uses.join(", ")}.</p>}
        {alert}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={step.name === "publishing"} className={primaryBtn}>
            {step.name === "publishing" ? "Publishing..." : "Publish to the scrap bin"}
          </button>
          <button type="button" onClick={() => { setDraft(null); setStep({ name: "photo" }); }} className={secondaryBtn}>Start over</button>
        </div>
        <ConfirmDialog
          open={asking}
          title="Publish this piece to the scrap bin?"
          confirmLabel="Publish to the scrap bin"
          busyLabel="Publishing..."
          cancelLabel="Keep editing"
          onConfirm={publish}
          onClose={() => setAsking(false)}
        >
          <p>
            <strong className="font-bold">{draft.title.trim()}</strong> ({MATERIAL_LABELS[draft.material_category]}) will show in the scrap bin at once, with your photo and the details you checked.
          </p>
          <p>Every USC student can see it, and a signed-in student can claim it. You can take it out again from the Claims tab.</p>
        </ConfirmDialog>
      </form>
    );
  }

  return (
    <div className="card space-y-4 p-4">
      <p>Take a photo of a leftover piece. The AI drafts the listing and you check it before it goes live.</p>
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={onPhoto} hidden />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => file.current?.click()} className={secondaryBtn}>
          <Camera aria-hidden className="size-5" />
          {image ? "Change the photo" : "Add a photo"}
        </button>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="The photo you chose" className="size-16 rounded-lg border-[1.5px] border-black object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-note`} className="label">Anything the photo does not show (optional)</label>
        <input id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="For example: 3 mm birch plywood" className={field} />
      </div>
      {alert}
      <button type="button" onClick={makeDraft} disabled={step.name === "drafting"} className={primaryBtn}>
        {step.name === "drafting" ? "Looking at the photo..." : "Draft the listing"}
      </button>
      {step.name === "drafting" && <p role="status" className="text-gray-text">Working out the material and size. This takes a few seconds.</p>}
    </div>
  );
}
