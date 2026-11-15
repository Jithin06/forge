import { ChevronDown, CircleAlert, GraduationCap, TriangleAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { EligibilityBadge } from "@/components/badges";
import { Band, Body, primaryBtn, secondaryBtn } from "@/components/page";
import { SampleBanner } from "@/components/sample-banner";
import { Swatch } from "@/components/swatch";
import type { FinalRoute } from "@/lib/compute/plan";
import { moneyRange, quantity } from "@/lib/format";
import type { PlanView as PlanData } from "@/lib/plans";
import { CopyLink } from "./copy-link";
import { PlanClaim } from "./plan-claim";

/** `whoFor` is a line in the band saying whose badges these are. */
export function PlanView({ data, whoFor }: { data: PlanData; whoFor?: React.ReactNode }) {
  const { plan } = data;
  const editHref = `/?from=${data.id}`;

  if (plan.routes.length === 0) {
    return (
      <>
        <Band title={plan.clarifying_question ? "We need a little more" : "We could not find a way yet"} size="md">
          <p>{plan.summary}</p>
        </Band>
        <Body>
          <p className="alert">
            <CircleAlert aria-hidden className="size-5" />
            <span>
              {plan.clarifying_question ??
                plan.not_supported_reason ??
                "None of the listed spaces can make this. Ask the staff at any space what they would suggest."}
            </span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={editHref} className={primaryBtn}>Change my answers</Link>
            <Link href="/spaces" className={secondaryBtn}>See all spaces</Link>
          </div>
          {data.fixture && <SampleBanner />}
        </Body>
      </>
    );
  }

  const spaceNames = Object.fromEntries(plan.routes.map((r) => [r.space_id, r.space_name]));
  const n = plan.routes.length;
  return (
    <>
      <Band title="Your plan" size="lg">
        <p>{plan.summary}</p>
        <p className="mt-1 font-semibold">{n === 1 ? "One way to build it." : `${n} ways to build it. The best fit for you is first.`}</p>
        {whoFor}
      </Band>
      <Body>
        {data.fixture && <SampleBanner />}

        {n === 1 && plan.single_route_reason && (
          <div className="panel p-3">
            <p className="font-bold">Why there is only one way</p>
            <p>{plan.single_route_reason}</p>
          </div>
        )}

        {plan.none_open && (
          <div className="alert">
            <CircleAlert aria-hidden className="size-5" />
            <div className="space-y-2">
              <p className="font-bold">None of these spaces is open to you without asking first.</p>
              <ul className="list-disc space-y-1 pl-5">
                {uniqueSpaces(plan.routes).map((r) => (
                  <li key={r.space_id}>
                    {r.space_name}: {r.eligibility.note ?? "Ask the staff whether you can use it."}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <section aria-label="Ways to build it" className="space-y-8 pt-2">
          {plan.routes.map((r, i) => (
            <RouteCard key={i} route={r} top={i === 0} n={i + 1} of={n} planId={data.id} spaceNames={spaceNames} />
          ))}
        </section>

        {plan.first_visit.length > 0 && (
          <section aria-labelledby="first-visit" className="card space-y-3 p-4">
            <div>
              <h2 id="first-visit" className="text-[22px] font-bold">Your first visit</h2>
              <p className="text-[15px] text-gray-text">For the first way above, at {plan.routes[0].space_name}.</p>
            </div>
            <ol className="steps">
              {plan.first_visit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            {plan.routes[0].hours_listed === false && plan.routes[0].space_url && (
              <p className="text-[15px]">
                Opening hours are not known.{" "}
                <a href={plan.routes[0].space_url} target="_blank" rel="noopener noreferrer" className="link">
                  Check the space&apos;s own page<span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                before you go.
              </p>
            )}
            {plan.routes[0].estimate_notes && (
              <p className="text-[14px] text-gray-text">
                Lines that say &ldquo;likely&rdquo; or &ldquo;typically&rdquo; are not from this space&apos;s page: {plan.routes[0].estimate_notes.basis}.
              </p>
            )}
          </section>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={editHref} className={secondaryBtn}>Change my answers</Link>
          <CopyLink />
        </div>
      </Body>
    </>
  );
}

function uniqueSpaces(routes: FinalRoute[]): FinalRoute[] {
  const seen = new Set<string>();
  return routes.filter((r) => (seen.has(r.space_id) ? false : (seen.add(r.space_id), true)));
}

const bare = (r: { low: number; high: number }) => moneyRange(r).replace(/^about /, "");

/** "about $6" for a listed price; for the general table, who buys it is spelled out. */
function costText(l: { low_usd: number | null; high_usd: number | null; typical?: boolean }, bringYourOwn: boolean): string {
  const range = moneyRange({ low: l.low_usd!, high: l.high_usd! });
  if (!l.typical) return range;
  return bringYourOwn ? "Bring your own, " + range + " to buy" : range + ", typical price if you buy it yourself";
}

/** One way to build it, drawn as a workshop job ticket: ruler, body, tear line, cost stub. */
function RouteCard({ route: r, top, n, of, planId, spaceNames }: { route: FinalRoute; top: boolean; n: number; of: number; planId: string; spaceNames: Record<string, string> }) {
  const hid = `route-${n}`;
  const anyFree = r.scrap.some((s) => s.length > 0);
  const est = r.prices_estimated ? ", estimated prices" : "";
  return (
    <article aria-labelledby={hid} className="card drop-in relative" style={{ animationDelay: `${(n - 1) * 120}ms` }}>
      {r.labels.length > 0 && (
        <p className="absolute -top-4 right-3 z-10 flex gap-2">
          {r.labels.includes("easiest") && <span className="tag tag-white">Easiest for a first build</span>}
          {r.labels.includes("cheapest") && <span className="tag">Cheapest</span>}
        </p>
      )}
      <div aria-hidden className="ruler" />

      <div className="space-y-4 p-4">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1">
            <Link href={`/spaces/${r.space_id}`} className="link inline-flex min-h-11 items-center">
              {r.space_name}
            </Link>
            <EligibilityBadge status={r.eligibility.status} />
          </div>
          <p className="text-[15px] text-gray-text">
            {of > 1 ? `Way ${n} of ${of}` : "How to build it"}
            {r.kind === "staff_fabrication" ? ". Staff make it for you" : ""}
          </p>
          <h2 id={hid} className="text-[22px] font-bold leading-[1.12] tracking-[-0.01em]">{r.process}</h2>
          {r.eligibility.status !== "open" && r.eligibility.note && <p className="font-bold">{r.eligibility.note}</p>}
          <p>{r.fit_reason}</p>
        </header>

        {r.equipment.length > 0 && (
          <Block title="Tools you will use">
            <ul className="grid gap-2">
              {r.equipment.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5">
                  <span className="ico"><Wrench aria-hidden className="size-5" /></span>
                  <div className="leading-[1.3]">
                    <b>{e.name}</b>
                    {e.explain !== false && e.plain_name !== e.name && <span className="block text-[15px]">{e.plain_name}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <Block title="Training you need first">
          {r.kind === "staff_fabrication" ? (
            <div className="space-y-1">
              <p>
                <b>None.</b> Staff make this for you, so you do not use the machine yourself.
              </p>
              {r.service && (
                <p className="text-[15px]">
                  <b>{r.service.name}.</b> {r.service.how_to_request}
                </p>
              )}
              {r.service?.url && (
                <a href={r.service.url} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-11 items-center">
                  Open the request form<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          ) : r.trainings.length === 0 ? (
            <div className="space-y-1">
              <p>No training is listed for these tools. Ask the staff to be sure.</p>
              {r.estimate_notes?.training && (
                <p className="text-[15px] text-gray-text">
                  {r.estimate_notes.training} (Not from this space&apos;s page: {r.estimate_notes.basis}.)
                </p>
              )}
            </div>
          ) : (
            <ul className="grid gap-2">
              {r.trainings.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5">
                  <span className="ico"><GraduationCap aria-hidden className="size-5" /></span>
                  <div className="leading-[1.3]">
                    <b>{t.name}.</b> {t.duration_note ? t.duration_note + " " : ""}{t.how_to_sign_up ?? "Ask the staff how to sign up."}
                    {t.restricted_to && <span className="block text-[15px]">Only for: {t.restricted_to}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {r.cost_lines.length > 0 && (
          <Block title="Materials">
            <ul className="grid gap-2">
              {r.cost_lines.map((l, i) => {
                const free = r.scrap[i] ?? [];
                return (
                  <li key={i} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Swatch category={l.category} className="size-[34px]" />
                      <p className="leading-[1.25] tabular">
                        <b>{l.name}</b>, {quantity(l.quantity_low, l.quantity_high, l.unit)}
                        <span className={free.length > 0 ? "block text-[15px] font-bold" : "block text-[15px] text-gray-text"}>
                          {free.length > 0
                            ? "Free with scrap"
                            : l.low_usd !== null && l.high_usd !== null
                              ? costText(l, !!r.bring_your_own)
                              : r.bring_your_own && !l.material_id
                                ? "Bring your own"
                                : "Ask staff for the price"}
                        </span>
                      </p>
                    </div>
                    {free.map((s) => (
                      <div key={s.id} className="panel-free flex flex-wrap items-center gap-2.5 p-2.5">
                        {s.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photo_url} alt={`Photo of ${s.title}`} loading="lazy" className="size-14 rounded-lg border-[1.5px] border-black object-cover" />
                        ) : (
                          <Swatch category={s.material_category} className="size-14" />
                        )}
                        <p className="min-w-40 flex-1 text-[15px] leading-[1.3]">
                          <b>Free piece: {s.title}</b>
                          {s.size_note ? `. ${s.size_note}` : ""}
                          {s.space_id !== r.space_id ? `. At another space: ${spaceNames[s.space_id] ?? s.space_id}` : ""}
                          {s.restrictions.length > 0 ? `. ${s.restrictions.join(". ")}` : ""}.
                        </p>
                        <PlanClaim itemId={s.id} title={s.title} where={s.space_id === r.space_id ? `${r.space_name}, ${r.space_location}` : spaceNames[s.space_id]} planId={planId} />
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
          </Block>
        )}
      </div>

      {r.cost_lines.length > 0 && (
        <div className="stub space-y-1 px-4 py-3.5">
          {r.total ? (
            anyFree && r.with_scrap ? (
              <>
                <p>
                  <span className="block text-[15px]">With free scrap, about</span>
                  <span className="figure block">{bare(r.with_scrap)}</span>
                </p>
                <p className="text-[15px] text-gray-text tabular">Materials: {moneyRange(r.total)} new{est}</p>
              </>
            ) : (
              <>
                <p>
                  <span className="block text-[15px]">{r.typical_from ? (r.bring_your_own ? "Bring your own material. To buy it, about" : "Materials, if you buy them yourself, about") : "Materials, about"}</span>
                  <span className="figure block">{bare(r.total)}</span>
                </p>
                {r.prices_estimated && !r.typical_from && <p className="text-[15px] text-gray-text">Estimated prices</p>}
              </>
            )
          ) : (
            <>
              <p className="text-[22px] font-bold leading-[1.15]">{r.bring_your_own ? "Bring your own material" : "Ask staff for prices"}</p>
              <p className="text-[15px] text-gray-text">
                {r.bring_your_own
                  ? "This space sells no material. What it has on hand is for its members' use and is never sold."
                  : "No prices are listed for these yet. Ask the staff what they cost."}
              </p>
            </>
          )}
          {r.typical_from && (
            <p className="text-[15px] text-gray-text">
              {r.bring_your_own ? "This space sells no material. " : "This space lists no prices. "}
              This is a typical price if you buy it yourself, estimated; what you pay may differ.
            </p>
          )}
          {r.estimate_notes?.cost && !r.typical_from && <p className="text-[15px] text-gray-text">{r.estimate_notes.cost}</p>}
          {r.total && r.cost_lines.some((l) => l.low_usd === null) && (
            <p className="text-[15px]">Some materials have no price here and are not in this total.</p>
          )}
        </div>
      )}

      <details open={top} className="group border-t-[1.5px] border-black">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-b-xl px-4 [&::-webkit-details-marker]:hidden">
          <span className="link">See the steps</span>
          <ChevronDown aria-hidden className="size-5 group-open:rotate-180" />
        </summary>
        <div className="space-y-4 px-4 pb-4">
          {r.warnings.length > 0 && (
            <Block title="Watch out for">
              <ul className="grid gap-2">
                {r.warnings.map((w) => (
                  <li key={w.issue} className="flex items-start gap-2.5">
                    <span className="ico"><TriangleAlert aria-hidden className="size-5" /></span>
                    <span className="leading-[1.35]">
                      <b>{w.issue.replace(/[.\s]+$/, "")}.</b> {w.fix}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <Block title="Steps">
            <ol className="steps">
              {r.steps.map((s) => (
                <li key={s.title} className="leading-[1.35]">
                  <b>{s.title.replace(/[.\s]+$/, "")}.</b> {s.detail}
                </li>
              ))}
            </ol>
          </Block>
        </div>
      </details>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[16px] font-bold">{title}</h3>
      {children}
    </div>
  );
}
