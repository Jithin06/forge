import { Info } from "lucide-react";

/** Shown on any screen built from a fixture (SPEC 4.1). */
export function SampleBanner() {
  return (
    <p className="notice text-[15px]">
      <Info aria-hidden className="size-5" />
      <span>
        <strong className="font-semibold">Sample data.</strong> This comes from a saved example, not a live AI answer.
      </span>
    </p>
  );
}
