"use client";

import type { ReactNode } from "react";
import { AudiencePicker } from "@/components/about-you";
import { EligibilityBadge } from "@/components/badges";
import { useAudience } from "@/components/profile-store";
import { eligibility } from "@/lib/compute/eligibility";
import { AUDIENCE_LABELS } from "@/lib/labels";
import { AUDIENCES, type SpaceDoc } from "@/lib/schemas";

/** Your badge up top, then who can use the space, for all four audiences. */
export function AccessSection({ space, statusChip }: { space: SpaceDoc; statusChip: ReactNode }) {
  const [audience] = useAudience();
  const mine = audience ? eligibility(space, audience) : null;

  return (
    <section aria-labelledby="who-can-use" className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="who-can-use" className="text-[22px] font-semibold">Can I use it?</h2>
        {statusChip}
      </div>

      <div aria-live="polite">
        {mine ? (
          <div className="space-y-1">
            <EligibilityBadge status={mine.status} />
            {mine.note && <p className="font-semibold">{mine.note}</p>}
            {mine.status === "ask_first" && <p>Ask the staff before your first visit.</p>}
          </div>
        ) : (
          <p>Pick who you are below to see whether this space is open to you.</p>
        )}
      </div>

      <AudiencePicker />

      <table className="w-full text-left">
        <caption className="sr-only">Who can use this space</caption>
        <thead>
          <tr className="border-b border-gray-line text-[15px] text-gray-text">
            <th scope="col" className="py-2 pr-3 font-normal">Who</th>
            <th scope="col" className="py-2 font-normal">Access</th>
          </tr>
        </thead>
        <tbody>
          {AUDIENCES.map((a) => {
            const e = eligibility(space, a);
            const isMe = a === audience;
            return (
              <tr key={a} className="border-b border-gray-line align-top last:border-0">
                <th scope="row" className={isMe ? "py-2 pr-3 font-semibold" : "py-2 pr-3 font-normal"}>
                  {AUDIENCE_LABELS[a]}
                  {isMe && <span className="block text-[15px] font-normal text-gray-text">That is you</span>}
                </th>
                <td className="py-2">
                  <EligibilityBadge status={e.status} neutral className={isMe ? "" : "font-normal"} />
                  {e.note && <span className="mt-1 block text-[15px]">{e.note}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
