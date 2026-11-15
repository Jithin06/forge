"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function CopyLink() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 4000);
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="btn btn-plain"
      >
        {state === "copied" ? <Check aria-hidden className="size-5" /> : <Link2 aria-hidden className="size-5" />}
        Copy link
      </button>
      <span role="status" className="text-[15px]">
        {state === "copied" && "Link copied. Anyone with it can see this plan."}
        {state === "failed" && "Could not copy. Copy the address from your browser bar."}
      </span>
    </span>
  );
}
