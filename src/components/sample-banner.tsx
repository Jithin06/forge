import { Info } from "lucide-react";

/** Shown on any screen built from a fixture (SPEC 4.1). */
export function SampleBanner() {
  return (
    <p className="flex items-start gap-2 rounded-xl border-l-4 border-gold bg-gold-soft p-3 text-[15px]">
      <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
      <span>
        <strong className="font-semibold">Sample data.</strong> This comes from a saved example, not a live AI answer.
      </span>
    </p>
  );
}
