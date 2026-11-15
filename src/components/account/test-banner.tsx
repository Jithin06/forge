"use client";

import { useSession } from "./use-session";

/** Visible on every page while the server runs with AUTH_MODE=test. */
export function TestBanner() {
  const session = useSession();
  if (session?.auth_mode !== "test") return null;
  return (
    <aside aria-label="Test sign-in notice" className="bg-gold px-4 py-1.5 text-center text-[15px] text-black">
      <strong className="font-semibold">Test sign-in.</strong> Accounts on this site are for testing, not real USC sign-ins.
    </aside>
  );
}
