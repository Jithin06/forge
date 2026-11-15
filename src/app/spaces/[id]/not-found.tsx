import Link from "next/link";
import { Band, Body, primaryBtn } from "@/components/page";

export default function SpaceNotFound() {
  return (
    <>
      <Band title="We could not find that space" size="md" />
      <Body>
        <p>The link may be old, or the space may have been removed.</p>
        <Link href="/spaces" className={primaryBtn}>See all spaces</Link>
      </Body>
    </>
  );
}
