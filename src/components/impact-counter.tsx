import { Recycle } from "lucide-react";
import { connection } from "next/server";
import { impactCount } from "@/lib/scrap";

/** Pieces of scrap picked up, counted in SQL (rule 5.3.6). */
export async function ImpactCounter() {
  await connection();
  let n: number;
  try {
    n = await impactCount();
  } catch {
    return null; // the counter is not worth breaking the page for
  }
  return (
    <p className="flex items-center gap-2 border-t border-gray-line pt-5 tabular">
      <Recycle aria-hidden className="size-5 shrink-0" />
      {n === 0
        ? "No leftover pieces picked up yet. Yours could be the first."
        : n === 1
          ? "1 leftover piece picked up and reused so far."
          : `${n} leftover pieces picked up and reused so far.`}
    </p>
  );
}
