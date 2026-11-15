import { connection } from "next/server";
import { impactCount } from "@/lib/scrap";

/** Pieces of scrap picked up, counted in SQL (rule 5.3.6). The page's one black band. */
export async function ImpactCounter() {
  await connection();
  let n: number;
  try {
    n = await impactCount();
  } catch {
    return null; // the counter is not worth breaking the page for
  }
  return (
    <div className="band-black">
      <p className="mx-auto flex max-w-[680px] items-center gap-4 px-5 py-6">
        <span className="n">{n}</span>
        <span className="text-[18px] leading-[1.25]">
          {n === 0
            ? "leftover pieces picked up yet. Yours could be the first."
            : n === 1
              ? "leftover piece picked up and reused so far."
              : "leftover pieces picked up and reused so far."}
        </span>
      </p>
    </div>
  );
}
