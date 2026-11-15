import { CircleAlert, PiggyBank, Sprout, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { EligibilityBadge } from "@/components/badges";
import { SampleBanner } from "@/components/sample-banner";
import type { FinalRoute } from "@/lib/compute/plan";
import { moneyRange, quantity } from "@/lib/format";
import type { PlanView as PlanData } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { CopyLink } from "./copy-link";
import { PlanClaim } from "./plan-claim";

const primaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-cardinal px-6 font-semibold text-white hover:bg-cardinal-pressed";
const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-cardinal bg-white px-5 font-semibold text-cardinal hover:bg-gold-soft";

export function PlanView({ data }: { data: PlanData }) {
  const { plan } = data;
  const editHref = `/?from=${data.id}`;

  if (plan.routes.length === 0) {
    return (
      <div className="space-y-5">
        {data.fixture && <SampleBanner />}
        <h1 className="text-[28px] font-bold">{plan.clarifying_question ? "We need a little more" : "We could not find a way yet"}</h1>
        <p className="text-[18px]">{plan.summary}</p>
        <p className="border-l-4 border-cardinal pl-4">
          {plan.clarifying_question ??
            plan.not_supported_reason ??
            "None of the listed spaces can make this. Ask the staff at any space what they would suggest."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={editHref} className={primaryBtn}>Change my answers</Link>
          <Link href="/spaces" className={secondaryBtn}>See all spaces</Link>
        </div>
      </div>
    );
  }

  const spaceNames = Object.fromEntries(plan.routes.map((r) => [r.space_id, r.space_name]));
  return (
    <div className="space-y-8">
      {data.fixture && <SampleBanner />}
      <header className="space-y-2">
        <h1 className="text-[28px] font-bold">Your plan</h1>
        <p className="text-[18px]">{plan.summary}</p>
      </header>

      {plan.none_open && (
        <div className="space-y-2 border-l-4 border-cardinal pl-4">
          <p className="flex items-start gap-2 font-semibold">
            <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
            None of these spaces is open to you without asking first.
          </p>
          <ul className="list-disc space-y-1 pl-6">
            {uniqueSpaces(plan.routes).map((r) => (
              <li key={r.space_id}>
                {r.space_name}: {r.eligibility.note ?? "Ask the staff whether you can use it."}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section aria-label="Ways to build it" className="space-y-5">
        {plan.routes.map((r, i) => (
          <RouteCard key={i} route={r} top={i === 0} n={i + 1} of={plan.routes.length} planId={data.id} spaceNames={spaceNames} />
        ))}
      </section>

      {plan.first_visit.length > 0 && (
        <section aria-labelledby="first-visit" className="space-y-3">
          <h2 id="first-visit" className="text-[22px] font-semibold">Your first visit</h2>
          <p className="text-[15px] text-gray-text">For the first way above, at {plan.routes[0].space_name}.</p>
          <ol className="list-decimal space-y-2 pl-6">
            {plan.first_visit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-line pt-5 sm:flex-row sm:items-center">
        <Link href={editHref} className={secondaryBtn}>Change my answers</Link>
        <CopyLink />
      </div>
    </div>
  );
}

function uniqueSpaces(routes: FinalRoute[]): FinalRoute[] {
  const seen = new Set<string>();
  return routes.filter((r) => (seen.has(r.space_id) ? false : (seen.add(r.space_id), true)));
}

function RouteCard({ route: r, top, n, of, planId, spaceNames }: { route: FinalRoute; top: boolean; n: number; of: number; planId: string; spaceNames: Record<string, string> }) {
  const hid = `route-${n}`;
  const anyFree = r.scrap.some((s) => s.length > 0);
  return (
    <article aria-labelledby={hid} className="overflow-hidden rounded-xl border border-gray-line bg-white shadow-sm">
      {top && <div aria-hidden className="ruler-strip" />}
      <div className="space-y-4 p-4">
        <header className="space-y-2">
          {r.labels.length > 0 && (
            <p className="flex flex-wrap gap-2">
              {r.labels.includes("cheapest") && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-[15px] font-semibold text-black">
                  <PiggyBank aria-hidden className="size-4" />
                  Cheapest
                </span>
              )}
              {r.labels.includes("easiest") && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-[15px] font-semibold text-black">
                  <Sprout aria-hidden className="size-4" />
                  Easiest for a first build
                </span>
              )}
            </p>
          )}
          <p className="text-[15px] text-gray-text">{of > 1 ? `Way ${n} of ${of}` : "How to build it"}</p>
          <h2 id={hid} className="text-[22px] font-semibold">{r.process}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={`/spaces/${r.space_id}`} className="inline-flex min-h-11 items-center font-semibold text-cardinal underline underline-offset-4">
              {r.space_name}
            </Link>
            <EligibilityBadge status={r.eligibility.status} />
          </div>
          {r.eligibility.status !== "open" && r.eligibility.note && <p className="font-semibold">{r.eligibility.note}</p>}
          <p>{r.fit_reason}</p>
        </header>

        {r.equipment.length > 0 && (
          <Block title="Tools you will use">
            <ul className="list-disc space-y-1 pl-6">
              {r.equipment.map((e) => (
                <li key={e.id}>{e.plain_name}</li>
              ))}
            </ul>
          </Block>
        )}

        <Block title="Training you need first">
          {r.trainings.length === 0 ? (
            <p>No training is listed for these tools. Ask the staff to be sure.</p>
          ) : (
            <ul className="space-y-2">
              {r.trainings.map((t) => (
                <li key={t.id}>
                  <span className="font-semibold">{t.name}.</span> {t.how_to_sign_up ?? "Ask the staff how to sign up."}
                  {t.restricted_to && <span className="block text-[15px]">Only for: {t.restricted_to}</span>}
                </li>
              ))}
            </ul>
          )}
        </Block>

        {r.cost_lines.length > 0 && (
          <Block title="Materials">
            <ul className="space-y-2">
              {r.cost_lines.map((l, i) => {
                const free = r.scrap[i] ?? [];
                return (
                  <li key={i} className={cn("rounded-lg p-2", free.length > 0 ? "border-l-4 border-gold bg-gold-soft" : "border-l-2 border-gray-line")}>
                    <p className="flex flex-wrap justify-between gap-x-4 tabular">
                      <span>
                        <span className="font-semibold">{l.name}</span>, {quantity(l.quantity_low, l.quantity_high, l.unit)}
                      </span>
                      <span>
                        {free.length > 0
                          ? "Free with scrap"
                          : l.low_usd !== null && l.high_usd !== null
                            ? moneyRange({ low: l.low_usd, high: l.high_usd })
                            : "Ask staff for the price"}
                      </span>
                    </p>
                    {free.map((s) => (
                      <div key={s.id} className="mt-2 flex flex-wrap items-center gap-3">
                        {s.photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photo_url} alt={`Photo of ${s.title}`} loading="lazy" className="size-16 rounded-lg border border-gray-line object-cover" />
                        )}
                        <p className="min-w-40 flex-1 text-[15px]">
                          <span className="font-semibold">Free piece: {s.title}</span>
                          {s.size_note ? `. ${s.size_note}` : ""}
                          {s.space_id !== r.space_id ? `. At another space: ${spaceNames[s.space_id] ?? s.space_id}` : ""}
                          {s.restrictions.length > 0 ? `. ${s.restrictions.join(". ")}` : ""}.
                        </p>
                        <PlanClaim itemId={s.id} title={s.title} planId={planId} />
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
            {r.total ? (
              <div className="mt-3 space-y-1 tabular">
                <p className="font-semibold">
                  Materials: {moneyRange(r.total)}
                  {r.prices_estimated ? ", estimated prices" : ""}
                </p>
                {anyFree && r.with_scrap && <p className="font-semibold">With scrap: {moneyRange(r.with_scrap)}</p>}
                {r.cost_lines.some((l) => l.low_usd === null) && (
                  <p className="text-[15px]">Some materials have no listed price and are not in this total.</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-[15px]">No prices are listed for these yet. Ask the staff what they cost.</p>
            )}
          </Block>
        )}

        {r.warnings.length > 0 && (
          <Block title="Watch out for">
            <ul className="space-y-2">
              {r.warnings.map((w) => (
                <li key={w.issue} className="flex items-start gap-2">
                  <TriangleAlert aria-hidden className="mt-1 size-5 shrink-0" />
                  <span>
                    <span className="font-semibold">{w.issue}.</span> {w.fix}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <Block title="Steps">
          <ol className="list-decimal space-y-2 pl-6">
            {r.steps.map((s) => (
              <li key={s.title}>
                <span className="font-semibold">{s.title}.</span> {s.detail}
              </li>
            ))}
          </ol>
        </Block>
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[18px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}
