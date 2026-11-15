import Link from "next/link";
import { connection } from "next/server";
import { SampleTag } from "@/components/badges";
import { Body } from "@/components/page";
import { Swatch } from "@/components/swatch";
import { isSample } from "@/lib/sample";
import { listAvailable } from "@/lib/scrap";

export function HowItWorks() {
  return (
    <Body>
      <section aria-labelledby="how" className="space-y-3">
        <h2 id="how" className="text-[24px] font-bold tracking-[-0.01em]">How it works</h2>
        <ol className="steps steps-boxed">
          <li>
            <b className="block">Say what you want to make</b>
            <span className="text-[15px] text-gray-text">Plain words are fine. Answer a few quick questions if we ask.</span>
          </li>
          <li>
            <b className="block">See where and how</b>
            <span className="text-[15px] text-gray-text">Which spaces you can use, the training first, and a rough cost.</span>
          </li>
          <li>
            <b className="block">Pick up free leftovers</b>
            <span className="text-[15px] text-gray-text">Claim material another builder did not need.</span>
          </li>
        </ol>
      </section>
    </Body>
  );
}

/** A strip of what is in the scrap bin right now. Each card opens the Scrap tab. */
export async function FreeNow() {
  await connection();
  let items;
  try {
    items = (await listAvailable()).slice(0, 8);
  } catch {
    return null; // the strip is not worth breaking the page for
  }
  if (items.length === 0) return null;
  return (
    <Body className="pt-0">
      <section aria-labelledby="free-now" className="space-y-3">
        <h2 id="free-now" className="text-[24px] font-bold tracking-[-0.01em]">Free right now</h2>
        <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-3">
          {items.map((item) => (
            <li key={item.id} className="w-[150px] shrink-0">
              <Link href="/scrap" className="card relative block h-full p-2">
                <span className="tag tag-free">Free</span>
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo_url} alt="" loading="lazy" className="h-[84px] w-full rounded-lg border-[1.5px] border-black object-cover" />
                ) : (
                  <Swatch category={item.material_category} className="h-[84px] w-full" />
                )}
                <b className="mt-2 block leading-[1.2]">{item.title}</b>
                {isSample(item.description) && <span className="block"><SampleTag /></span>}
                {item.size_note && <span className="block text-[15px] leading-[1.3] text-gray-text">{item.size_note}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/scrap" className="link inline-flex min-h-11 items-center">See all free scrap</Link>
      </section>
    </Body>
  );
}
