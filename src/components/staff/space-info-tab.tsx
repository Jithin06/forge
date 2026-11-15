"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/account/use-session";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { secondaryBtn } from "@/components/account/gate";
import { FactChip } from "@/components/badges";
import { ACCESS_LABELS, AUDIENCE_LABELS, WEEKDAY_LABELS } from "@/lib/labels";
import { ACCESS_STATUSES, AUDIENCES, WEEKDAYS, type AccessStatus, type GroupStatus, type SpaceDoc, type StatusGroup, type Weekday } from "@/lib/schemas";

const field = "field";
const NEUTRAL: Record<AccessStatus, string> = { open: "Open", ask_first: ACCESS_LABELS.ask_first, not_open: "Not open" };

type GroupProps = {
  id: StatusGroup;
  title: string;
  status: GroupStatus;
  note: { ok: boolean; text: string } | null;
  busy: boolean;
  onSave?: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
};

/** One group of facts: its chip, its fields, Save and Confirm. */
function Group({ id, title, status, note, busy, onSave, onConfirm, children }: GroupProps) {
  return (
    <section aria-labelledby={`g-${id}`} className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 id={`g-${id}`} className="text-[22px] font-bold">{title}</h3>
        <FactChip status={status} />
      </div>
      {children}
      <p role="status" className={note ? (note.ok ? "notice" : "alert") : "sr-only"}>
        {note?.text ?? ""}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onSave && (
          <button type="button" disabled={busy} onClick={onSave} className={secondaryBtn}>
            Save {title.toLowerCase()}
          </button>
        )}
        <button type="button" disabled={busy} onClick={onConfirm} className="btn btn-gold">
          Confirm {title.toLowerCase()}
        </button>
      </div>
    </section>
  );
}

/** Staff edit hours, access and prices, and confirm each group of facts. */
export function SpaceInfoTab({ spaceId }: { spaceId: string }) {
  const [space, setSpace] = useState<SpaceDoc | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState<{ group: string; ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<{ id: StatusGroup; title: string } | null>(null);
  const email = useSession()?.user?.email ?? null;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setSpace((await res.json()).space);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [spaceId]);
  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  async function patch(group: string, body: unknown, done: string) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/staff/space/${spaceId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "That did not save. Please try again.");
      setSpace(data.space);
      setNote({ group, ok: true, text: done });
    } catch (e) {
      setNote({ group, ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (failed)
    return (
      <div className="space-y-3">
        <p role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          <span>We could not load your space. Check your connection and try again.</span>
        </p>
        <button type="button" onClick={load} className={secondaryBtn}>Try again</button>
      </div>
    );
  if (!space) return <p role="status" className="text-gray-text">Loading your space...</p>;

  const group = (id: StatusGroup, title: string, onSave?: () => void) => ({
    id,
    title,
    status: space.status[id],
    note: note?.group === id ? note : null,
    busy,
    onSave,
    onConfirm: () => setConfirming({ id, title }),
  });

  const setHours = (d: Weekday, v: { open: string; close: string } | null) =>
    setSpace((s) => (s ? { ...s, hours: { ...(s.hours ?? {}), [d]: v } as SpaceDoc["hours"] } : s));

  return (
    <div className="space-y-6">
      <p>Fix anything that is wrong, then confirm each group. Students see “Estimated” until you confirm. Leave a price blank if you do not know it.</p>

      <Group {...group("hours", "Hours", () => patch("hours", { hours: space.hours }, "Hours saved."))}>
        <ul className="space-y-3">
          {WEEKDAYS.map((d) => {
            const h = space.hours?.[d] ?? null;
            return (
              <li key={d}>
                <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <legend className="float-left w-24 pt-3 font-bold">{WEEKDAY_LABELS[d]}</legend>
                  <label className="flex min-h-12 items-center gap-2">
                    <input type="checkbox" checked={!h} onChange={(e) => setHours(d, e.target.checked ? null : { open: "09:00", close: "17:00" })} className="check" />
                    Not listed
                  </label>
                  {h && (
                    <>
                      <label className="flex items-center gap-2">
                        <span className="sr-only">{WEEKDAY_LABELS[d]} </span>Opens
                        <input type="time" value={h.open} onChange={(e) => setHours(d, { ...h, open: e.target.value })} className={`${field} w-auto`} />
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="sr-only">{WEEKDAY_LABELS[d]} </span>Closes
                        <input type="time" value={h.close} onChange={(e) => setHours(d, { ...h, close: e.target.value })} className={`${field} w-auto`} />
                      </label>
                    </>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group {...group("access", "Access", () => patch("access", { access: space.access }, "Access saved."))}>
        <ul className="space-y-4">
          {AUDIENCES.map((a) => {
            const entry = space.access.find((x) => x.audience === a)!;
            const update = (v: Partial<typeof entry>) =>
              setSpace((s) => (s ? { ...s, access: s.access.map((x) => (x.audience === a ? { ...x, ...v } : x)) } : s));
            return (
              <li key={a} className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <label className="flex flex-col gap-1">
                  <span className="font-bold">{AUDIENCE_LABELS[a]}</span>
                  <select value={entry.status} onChange={(e) => update({ status: e.target.value as AccessStatus })} className={field}>
                    {ACCESS_STATUSES.map((s) => (<option key={s} value={s}>{NEUTRAL[s]}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[15px]">Note shown to this group (who to ask, or why)</span>
                  <input value={entry.note ?? ""} onChange={(e) => update({ note: e.target.value || null })} maxLength={200} className={field} />
                </label>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group
        {...group("prices", "Prices", () =>
          patch("prices", { prices: space.materials.map((m) => ({ material_id: m.id, unit_price_usd: m.unit_price_usd, price_unit: m.price_unit })) }, "Prices saved. New plans use them within a minute."),
        )}
      >
        {space.materials.length === 0 ? (
          <p>No materials are listed for this space yet. Ask the Forge team to add them.</p>
        ) : (
          <ul className="space-y-3">
            {space.materials.map((m) => {
              const update = (v: Partial<typeof m>) => setSpace((s) => (s ? { ...s, materials: s.materials.map((x) => (x.id === m.id ? { ...x, ...v } : x)) } : s));
              return (
                <li key={m.id}>
                  <fieldset className="grid grid-cols-2 items-end gap-2">
                    <legend className="mb-1 font-bold">{m.name}</legend>
                    <label className="flex flex-col gap-1 text-[15px]">
                      Price in dollars
                      <input
                        type="number" inputMode="decimal" min="0" step="0.01"
                        value={m.unit_price_usd ?? ""}
                        onChange={(e) => update({ unit_price_usd: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                        className={`${field} tabular`}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[15px]">
                      Per (sheet, g, ml)
                      <input value={m.price_unit ?? ""} onChange={(e) => update({ price_unit: e.target.value || null })} maxLength={30} className={field} />
                    </label>
                  </fieldset>
                </li>
              );
            })}
          </ul>
        )}
      </Group>

      <Group {...group("trainings", "Trainings")}>
        <p>{space.trainings.length} trainings are listed. Check them on your space page. To change one, ask the Forge team.</p>
      </Group>
      <Group {...group("equipment", "Equipment")}>
        <p>{space.equipment.length} pieces of equipment are listed. Check them on your space page. To change one, ask the Forge team.</p>
      </Group>

      <ConfirmDialog
        open={!!confirming}
        title={`Confirm ${confirming?.title.toLowerCase() ?? "these facts"} for ${space.name}?`}
        confirmLabel={`Confirm ${confirming?.title.toLowerCase() ?? ""}`}
        busyLabel="Confirming..."
        cancelLabel="Do not confirm"
        tone="gold"
        onConfirm={() =>
          confirming
            ? patch(confirming.id, { confirm: confirming.id }, `Confirmed. Students now see "Confirmed by staff" next to ${confirming.title.toLowerCase()}.`)
            : undefined
        }
        onClose={() => setConfirming(null)}
      >
        <p>
          This will show as <strong className="font-bold">“Confirmed by staff”</strong> to every student, in place of “Estimated”, under your name
          {email ? ` (${email})` : ""} and today&apos;s date ({new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}).
        </p>
        <p>Confirm only what you have checked yourself. Students will rely on it.</p>
        <p>Changes you have typed but not saved are not included. Save them first.</p>
      </ConfirmDialog>
    </div>
  );
}