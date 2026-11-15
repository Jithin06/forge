import Link from "next/link";

export default function SpaceNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">We could not find that space</h1>
      <p>The link may be old, or the space may have been removed.</p>
      <Link
        href="/spaces"
        className="inline-flex min-h-12 items-center rounded-xl bg-cardinal px-5 font-semibold text-white hover:bg-cardinal-pressed"
      >
        See all spaces
      </Link>
    </div>
  );
}
