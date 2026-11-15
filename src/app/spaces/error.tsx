"use client";

import { CircleAlert } from "lucide-react";

export default function SpacesError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">Spaces</h1>
      <div role="alert" className="space-y-4 border-l-4 border-cardinal pl-4">
        <p className="flex items-start gap-2">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          We could not load the spaces just now. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-12 rounded-xl bg-cardinal px-5 font-semibold text-white hover:bg-cardinal-pressed"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
