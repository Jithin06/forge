import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FactChip } from "@/components/badges";
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
    <article className="space-y-8">
      <header className="space-y-2">
        <p>
          <Link href="/spaces" className="inline-flex min-h-11 items-center text-cardinal underline underline-offset-4">
            All spaces
          </Link>
        </p>
        <h1 className="text-[28px] font-bold">{space.name}</h1>
        <p className="text-[15px] text-gray-text">
          {space.school} · {space.location}
        </p>
        <p className="text-[18px]">{space.blurb}</p>
      </header>

      <AccessSection space={space} statusChip={<FactChip status={space.status.access} />} />

      {space.access_steps.length > 0 && (
        <Section title="Your first visit" status={space.status.access}>
          <ol className="list-decimal space-y-2 pl-6">
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
          <p>Hours are not listed. Check the official page before you go.</p>
        )}
      </Section>

      <Section title="Equipment" status={space.status.equipment}>
        {byCapability.length === 0 ? (
          <p>No equipment is listed yet. Ask the staff what they have.</p>
        ) : (
          <div className="space-y-5">
            {byCapability.map(({ capability, items }) => (
              <div key={capability} className="space-y-2">
                <h3 className="text-[18px] font-semibold">{CAPABILITY_LABELS[capability]}</h3>
                <ul className="space-y-3">
                  {items.map((e) => (
                    <li key={e.id} className="border-l-2 border-gray-line pl-3">
                      <p className="font-semibold">{e.plain_name}</p>
                      <p className="text-[15px] text-gray-text">{e.name}</p>
                      {e.work_area_note && <p className="text-[15px] tabular">{e.work_area_note}</p>}
                      {e.good_for.length > 0 && <p className="text-[15px]">Works with: {e.good_for.join(", ")}</p>}
                      {e.required_training_ids.length > 0 && (
                        <p className="text-[15px]">
                          Training needed: {e.required_training_ids.map((t) => trainingName.get(t) ?? t).join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Trainings" status={space.status.trainings}>
        {space.trainings.length === 0 ? (
          <p>No trainings are listed. Ask the staff what you need before you start.</p>
        ) : (
          <ul className="space-y-4">
            {space.trainings.map((t) => (
              <li key={t.id} className="space-y-0.5">
                <p className="font-semibold">{t.name}</p>
                <p>{t.covers}</p>
                {t.prerequisite_ids.length > 0 && (
                  <p className="text-[15px]">
                    Take first: {t.prerequisite_ids.map((p) => trainingName.get(p) ?? p).join(", ")}
                  </p>
                )}
                {t.duration_note && <p className="text-[15px]">{t.duration_note}</p>}
                {t.restricted_to && <p className="text-[15px]">Only for: {t.restricted_to}</p>}
                <p className="text-[15px]">{t.how_to_sign_up ?? "Ask the staff how to sign up."}</p>
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
              <tr className="border-b border-gray-line text-[15px] text-gray-text">
                <th scope="col" className="py-2 pr-4 font-normal">Material</th>
                <th scope="col" className="py-2 font-normal">Price</th>
              </tr>
            </thead>
            <tbody>
              {space.materials.map((m) => (
                <tr key={m.id} className="border-b border-gray-line last:border-0">
                  <th scope="row" className="py-2 pr-4 font-normal">{m.name}</th>
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
          <h2 id="free-here" className="text-[22px] font-semibold">Free here now</h2>
          {scrap.length === 0 ? (
            <p>No free scrap here right now. Check the Scrap tab later.</p>
          ) : (
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {scrap.map((s) => (
                <li key={s.id} className="w-40 shrink-0 rounded-xl border-l-4 border-gold bg-gold-soft p-3">
                  <p className="font-semibold">{s.title}</p>
                  {s.size_note && <p className="text-[15px]">{s.size_note}</p>}
                </li>
              ))}
            </ul>
          )}
          {space.scrap_policy.pickup_note && <p className="text-[15px]">{space.scrap_policy.pickup_note}</p>}
        </section>
      )}

      <footer className="space-y-2 border-t border-gray-line pt-4">
        <a
          href={space.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-cardinal underline underline-offset-4"
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
    </article>
  );
}

function Section({ title, status, children }: { title: string; status: GroupStatus; children: React.ReactNode }) {
  const id = `s-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id={id} className="text-[22px] font-semibold">{title}</h2>
        <FactChip status={status} />
      </div>
      {children}
    </section>
  );
}

function SpaceSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <h1 className="sr-only">Loading this space</h1>
      <p className="text-gray-text">Loading this space...</p>
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-gold-soft" />
      <div className="h-24 animate-pulse rounded-xl border border-gray-line" />
      <div className="h-40 animate-pulse rounded-xl border border-gray-line" />
    </div>
  );
}
