import Link from "next/link";
import { Band, Body, primaryBtn } from "@/components/page";

export default function PlanNotFound() {
  return (
    <>
      <Band title="We could not find that plan" size="md" />
      <Body>
        <p>The link may be mistyped. You can make a new plan in under a minute.</p>
        <Link href="/" className={primaryBtn}>Start a new plan</Link>
      </Body>
    </>
  );
}
