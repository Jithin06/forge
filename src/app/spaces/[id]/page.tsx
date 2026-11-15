import { ExternalLink, GraduationCap, HandHelping, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FactChip } from "@/components/badges";
import { Band, Body } from "@/components/page";
import { Swatch } from "@/components/swatch";
import { AccessSection } from "@/components/spaces/access-section";
import { CAPABILITY_LABELS, WEEKDAY_LABELS, formatDate, formatTime } from "@/lib/labels";
import { CAPABILITIES, WEEKDAYS, type GroupStatus, type SpaceDoc } from "@/lib/schemas";
import { getAvailableScrap, getSpace, type ScrapCard } from "@/lib/spaces";

/** The tab title is the space's name, so several open spaces can be told apart. */
export async function generateMetadata({ params }: PageProps<"/spaces/[id]">): Promise<Metadata> {
  const { id } = await params;
  const space = await getSpace(id).catch(() => null);
  return { title: space?.name ?? "Space" };
}

export default function SpacePage({ params }: PageProps<"/spaces/[id]">) {
  return (
    <Suspense fallback={<SpaceSkeleton />}>
      <SpaceData params={params} />
    </Suspense>
  );
}

async function SpaceData({ params }: { params: PageProps<"/spaces/[id]">["params"] }) {
  const { id } = await params;
  const space = await getSpace(id);
  if (!space) notFound();
  const scrap = await getAvailableScrap(id);
  return <SpaceView space={space} scrap={scrap} />;
}

function SpaceView({ space, scrap }: { space: SpaceDoc; scrap: ScrapCard[] }) {
  const trainingName = new Map(space.trainings.map((t) => [t.id, t.name]));
  const byCapability = CAPABILITIES.map((c) => ({
    capability: c,
    items: space.equipment.filter((e) => e.capability === c),
  })).filter((g) => g.items.length > 0);

  return (
    <article>
      <Band
        title={space.name}
        size="md"
        above={
          <p>
            <Link href="/spaces" className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-4">
              All spaces
            </Link>
          </p>
        }
      >
        <p className="text-[16px]">
          {space.school} · {space.location}
        </p>
      </Band>
      <Body>
      <p className="text-[18px]">{space.blurb}</p>

      <AccessSection space={space} statusChip={<FactChip status={space.status.access} />} />

      {space.access_steps.length > 0 && (
        <Section title="Your first visit" status={space.status.access}>
          <ol className="steps">
            {space.access_steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="Hours" status={space.status.hours}>
        {space.hours ? (
          <table className="w-full max-w-sm text-left tabular">
            <caption className="sr-only">Opening hours</caption>
            <tbody>
              {WEEKDAYS.map((d) => {
                const h = space.hours?.[d] ?? null;
                return (
                  <tr key={d} className="border-b border-gray-line last:border-0">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {WEEKDAY_LABELS[d]}
                    </th>
                    <td className="py-2">
                      {h ? `${formatTime(h.open)} to ${formatTime(h.close)}` : <span className="text-gray-text">Not listed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>{space.hours_note ?? "Hours are not listed. Check the official page before you go."}</p>
        )}
      </Section>

      <Section title="Equipment" status={space.status.equipment}>
        {byCapability.length === 0 ? (
          <p>No equipment is listed yet. Ask the staff what they have.</p>
        ) : (
          <div className="space-y-5">
            {byCapability.map(({ capability, items }) => (
              <div key={capability} className="space-y-2">
                <h3 className="text-[18px] font-bold">{CAPABILITY_LABELS[capability]}</h3>
                <ul className="space-y-3">
                  {items.map((e) => (
                    <li key={e.id} className="panel flex items-start gap-3 p-3">
                      <span className="ico"><Wrench aria-hidden className="size-5" /></span>
                      <div>
                      <p className="font-bold">{e.plain_name}</p>
                      <p className="text-[15px] text-gray-text">{e.name}</p>
                      {e.work_area_note && <p className="text-[15px] tabular">{e.work_area_note}</p>}
                      {e.good_for.length > 0 && <p className="text-[15px]">Works with: {e.good_for.join(", ")}</p>}
                      {e.required_training_ids.length > 0 && (
                        <p className="text-[15px]">
                          Training needed: {e.required_training_ids.map((t) => trainingName.get(t) ?? t).join(", ")}
                        </p>
                      )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      {space.services.length > 0 && (
        <Section title="What staff can help with" status={space.status.equipment}>
          <ul className="space-y-3">
            {space.services.map((sv) => (
              <li key={sv.name} className="panel flex items-start gap-3 p-3">
                <span className="ico"><HandHelping aria-hidden className="size-5" /></span>
                <div>
                  <p className="font-bold">{sv.name}</p>
                  <p className="text-[15px]">{sv.how_to_request ?? "Ask the staff how to request this."}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Trainings" status={space.status.trainings}>
        {space.trainings.length === 0 ? (
          <p>No trainings are listed. Ask the staff what you need before you start.</p>
        ) : (
          <ul className="space-y-3">
            {space.trainings.map((t) => (
              <li key={t.id} className="panel flex items-start gap-3 p-3">
                <span className="ico"><GraduationCap aria-hidden className="size-5" /></span>
                <div className="space-y-0.5">
                <p className="font-bold">{t.name}</p>
                <p>{t.covers}</p>
                {t.prerequisite_ids.length > 0 && (
                  <p className="text-[15px]">
                    Take first: {t.prerequisite_ids.map((p) => trainingName.get(p) ?? p).join(", ")}
                  </p>
                )}
                {t.duration_note && <p className="text-[15px]">{t.duration_note}</p>}
                {t.restricted_to && <p className="text-[15px]">Only for: {t.restricted_to}</p>}
                <p className="text-[15px]">{t.how_to_sign_up ?? "Ask the staff how to sign up."}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Material prices" status={space.status.prices}>
        {space.usage_fee_note && <p className="mb-3">{space.usage_fee_note}</p>}
        {space.materials.length === 0 ? (
          <p>No materials are listed. Ask the staff what they sell and what to bring.</p>
        ) : (
          <table className="w-full text-left">
            <caption className="sr-only">Materials and prices</caption>
            <thead>
              <tr className="border-b-[1.5px] border-black text-[15px] text-gray-text">
                <th scope="col" className="py-2 pr-4 font-normal">Material</th>
                <th scope="col" className="py-2 font-normal">Price</th>
              </tr>
            </thead>
            <tbody>
              {space.materials.map((m) => (
                <tr key={m.id} className="border-b border-gray-line last:border-0">
                  <th scope="row" className="py-2 pr-4 font-normal">
                    <span className="flex items-center gap-2.5">
                      <Swatch category={m.category} className="size-7" />
                      {m.name}
                    </span>
                  </th>
                  <td className="py-2 tabular">
                    {m.unit_price_usd === null ? (
                      <span className="text-gray-text">Ask staff for the price</span>
                    ) : (
                      `$${m.unit_price_usd.toFixed(2)}${m.price_unit ? ` per ${m.price_unit}` : ""}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {(space.scrap_policy.offers_scrap || scrap.length > 0) && (
        <section aria-labelledby="free-here" className="space-y-3">
          <h2 id="free-here" className="text-[24px] font-bold tracking-[-0.01em]">Free here now</h2>
          {scrap.length === 0 ? (
            <p>No free scrap here right now. Check the Scrap tab later.</p>
          ) : (
            <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 pt-3">
              {scrap.map((s) => (
                <li key={s.id} className="w-[150px] shrink-0">
                  <Link href={`/scrap?space_id=${space.id}`} className="card relative block h-full p-2">
                    <span className="tag tag-free">Free</span>
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt="" loading="lazy" className="h-[84px] w-full rounded-lg border-[1.5px] border-black object-cover" />
                    ) : (
                      <Swatch category={s.material_category} className="h-[84px] w-full" />
                    )}
                    <b className="mt-2 block leading-[1.2]">{s.title}</b>
                    {s.size_note && <span className="block text-[15px] leading-[1.3] text-gray-text">{s.size_note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {space.scrap_policy.pickup_note && <p className="text-[15px]">{space.scrap_policy.pickup_note}</p>}
        </section>
      )}

      <footer className="space-y-2 border-t-2 border-dashed border-black pt-4">
        <a
          href={space.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="link inline-flex min-h-11 items-center gap-1.5"
        >
          See the official page
          <ExternalLink aria-hidden className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <p className="text-[15px] text-gray-text">
          Facts come from the space&apos;s official pages, checked on {formatDate(space.source.checked_on)}. Anything
          marked Estimated has not been confirmed by staff yet.
        </p>
      </footer>
      </Body>
    </article>
  );
}

function Section({ title, status, children }: { title: string; status: GroupStatus; children: React.ReactNode }) {
  const id = `s-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id={id} className="text-[24px] font-bold tracking-[-0.01em]">{title}</h2>
        <FactChip status={status} />
      </div>
      {children}
    </section>
  );
}

function SpaceSkeleton() {
  return (
    <div aria-busy="true">
      <Band title="Loading this space" size="md" />
      <Body>
        <p role="status" className="text-gray-text">Loading this space...</p>
        <div aria-hidden className="card space-y-3 p-4">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </Body>
    </div>
  );
}
