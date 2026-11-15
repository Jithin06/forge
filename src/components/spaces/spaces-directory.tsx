"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AudiencePicker } from "@/components/about-you";
import { EligibilityBadge } from "@/components/badges";
import { useAudience } from "@/components/profile-store";
import { eligibility, eligibilityRank } from "@/lib/compute/eligibility";
import { CAPABILITY_LABELS } from "@/lib/labels";
import { CAPABILITIES, type Capability, type SpaceDoc } from "@/lib/schemas";

export function SpacesDirectory({ spaces }: { spaces: SpaceDoc[] }) {
  const [audience] = useAudience();
  const [capability, setCapability] = useState<Capability | "">("");
  const [openOnly, setOpenOnly] = useState(false);
  const selectId = useId();

  // Only offer the capabilities some space actually has, in vocabulary order.
  const offered = CAPABILITIES.filter((c) => spaces.some((s) => s.capabilities.includes(c)));

  const rows = spaces
    .map((s) => ({ space: s, elig: audience ? eligibility(s, audience) : null }))
    .filter(({ space }) => !capability || space.capabilities.includes(capability))
    .filter(({ elig }) => !openOnly || !elig || elig.status === "open")
    .sort((a, b) => (a.elig && b.elig ? eligibilityRank(a.elig.status) - eligibilityRank(b.elig.status) : 0));

  if (spaces.length === 0) {
    return (
      <p>
        No spaces are listed yet. Check back soon, or ask at the front desk of a campus workshop.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <AudiencePicker hint={audience ? undefined : "Pick one to see which spaces you can use."} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={selectId} className="font-semibold">
            What do you need?
          </label>
          <select
            id={selectId}
            value={capability}
            onChange={(e) => setCapability(e.target.value as Capability | "")}
            className="min-h-12 rounded-lg border border-gray-text bg-white px-3 text-[16px]"
          >
            <option value="">Anything</option>
            {offered.map((c) => (
              <option key={c} value={c}>
                {CAPABILITY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        {audience && (
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="size-5 accent-cardinal"
            />
            Only spaces open to me
          </label>
        )}
      </div>

      <p aria-live="polite" className="text-[15px] text-gray-text">
        {rows.length === 1 ? "1 space" : `${rows.length} spaces`}
      </p>

      {rows.length === 0 ? (
        <div className="space-y-3">
          <p>
            {openOnly
              ? "None of these spaces is open to you without asking first. Spaces marked Ask first may still let you in."
              : "No space here has that yet."}
          </p>
          <button
            type="button"
            onClick={() => {
              setCapability("");
              setOpenOnly(false);
            }}
            className="min-h-12 rounded-xl border-[1.5px] border-cardinal bg-white px-4 font-semibold text-cardinal hover:bg-gold-soft"
          >
            Show all spaces
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ space, elig }) => (
            <li key={space.id}>
              <SpaceCard space={space} elig={elig} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpaceCard({ space, elig }: { space: SpaceDoc; elig: ReturnType<typeof eligibility> | null }) {
  return (
    <article className="relative rounded-xl border border-gray-line bg-white p-4 shadow-sm has-[a:hover]:border-cardinal">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-[22px] font-semibold">
          <Link
            href={`/spaces/${space.id}`}
            className="text-cardinal underline underline-offset-4 after:absolute after:inset-0 after:rounded-xl"
          >
            {space.name}
          </Link>
        </h2>
        {elig && <EligibilityBadge status={elig.status} />}
      </div>
      <p className="mt-1 text-[15px] text-gray-text">{space.location}</p>
      {elig && elig.status !== "open" && elig.note && (
        <p className="mt-2 font-semibold">{elig.note}</p>
      )}
      <p className="mt-2">{space.blurb}</p>
      <p className="mt-2 text-[15px] text-gray-text">
        {space.capabilities.length > 0 ? space.capabilities.map((c) => CAPABILITY_LABELS[c]).join(" · ") : "Equipment not listed. Ask the staff."}
      </p>
    </article>
  );
}
