import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">We could not find that plan</h1>
      <p>The link may be mistyped. You can make a new plan in under a minute.</p>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center rounded-xl bg-cardinal px-5 font-semibold text-white hover:bg-cardinal-pressed"
      >
        Start a new plan
      </Link>
    </div>
  );
}
