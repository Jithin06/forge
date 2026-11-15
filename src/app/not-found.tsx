import type { Metadata } from "next";
import Link from "next/link";
import { Band, Body, primaryBtn } from "@/components/page";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Band title="We could not find that page" size="md" />
      <Body>
        <p>The link may be old or mistyped. You can start from the beginning.</p>
        <Link href="/" className={primaryBtn}>Plan something to build</Link>
      </Body>
    </>
  );
}
