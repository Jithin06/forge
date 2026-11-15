"use client";

import { CircleAlert } from "lucide-react";
import { Band, Body, primaryBtn } from "@/components/page";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <Band title="Something went wrong" size="md" />
      <Body>
        <p role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          <span>We could not load this page just now. Check your connection and try again.</span>
        </p>
        <button type="button" onClick={() => retry()} className={primaryBtn}>
          Try again
        </button>
      </Body>
    </>
  );
}
