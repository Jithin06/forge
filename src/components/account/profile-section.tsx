"use client";

import { CircleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ChoiceChips } from "@/components/choice-chips";
import { saveProfile, useProfile, type ProfilePatch } from "@/components/profile-store";
import { AUDIENCE_LABELS, EXPERIENCE_LABELS } from "@/lib/labels";
import { AUDIENCES, EXPERIENCES } from "@/lib/schemas";

/**
 * Name, "I am a..." and "I have...", each editable. Signed in, a change is
 * saved to the account; signed out, in this browser. Either way every badge
 * on every screen follows at once, because they all read the same store.
 */
export function ProfileSection() {
  const profile = useProfile();
  const nameId = useId();
  const [name, setName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // Show the stored name until the person starts typing.
  useEffect(() => {
    if (!dirty) Promise.resolve().then(() => setName(profile.name));
  }, [profile.name, dirty]);

  // Arriving from "Change" on another page: bring the section into view.
  useEffect(() => {
    if (profile.ready && window.location.hash === "#profile") document.getElementById("profile")?.scrollIntoView();
  }, [profile.ready]);

  async function save(patch: ProfilePatch, what: string) {
    setNote(null);
    const where = await saveProfile(patch);
    setNote(
      where === "error"
        ? { kind: "error", text: `We could not save ${what} to your account. It is changed on this screen only. Check your connection and try again.` }
        : { kind: "ok", text: where === "account" ? "Saved to your account." : "Saved in this browser." },
    );
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return setNote({ kind: "error", text: "Type a name first." });
    setDirty(false);
    void save({ name: clean }, "your name");
  }

  return (
    <section id="profile" aria-labelledby="profile-h" aria-busy={!profile.ready} className="card scroll-mt-4 space-y-5 p-4">
      <div>
        <h2 id="profile-h" className="text-[24px] font-bold tracking-[-0.01em]">Profile</h2>
        <p className="text-[15px] text-gray-text">We use this to show which spaces are open to you and to pitch plans at your level.</p>
      </div>

      <form onSubmit={saveName} noValidate className="space-y-2">
        <label htmlFor={nameId} className="label">Name</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={nameId}
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            maxLength={60}
            autoComplete="name"
            placeholder="What should we call you?"
            className="field sm:flex-1"
          />
          <button type="submit" className="btn btn-plain">Save name</button>
        </div>
      </form>

      <ChoiceChips name="profile-audience" legend="I am a..." options={AUDIENCES} labels={AUDIENCE_LABELS} value={profile.audience} onChange={(audience) => save({ audience }, "that")} />
      <ChoiceChips name="profile-experience" legend="I have..." options={EXPERIENCES} labels={EXPERIENCE_LABELS} value={profile.experience} onChange={(experience) => save({ experience }, "that")} />

      {note?.kind === "error" ? (
        <p role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          <span>{note.text}</span>
        </p>
      ) : (
        <p role="status" className={note ? "notice" : "sr-only"}>{note?.text}</p>
      )}
    </section>
  );
}
