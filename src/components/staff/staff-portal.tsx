"use client";

import Link from "next/link";
import { useSession } from "@/components/account/use-session";
import { PageSkeleton, SignInGate, secondaryBtn } from "@/components/account/gate";

/** Staff portal shell. Signed-in, allow-listed staff only; the API enforces the same rule. */
export function StaffPortal() {
  const session = useSession();
  if (!session) return <PageSkeleton title="Staff portal" />;
  if (!session.user) return <SignInGate title="Staff portal" why="This page is for staff of a campus space. Sign in to open it." />;
  if (session.staff_space_ids.length === 0)
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-bold">Staff portal</h1>
        <p>
          You are signed in as {session.user.email}, which is not on the staff list for any space. If you work at a space, ask
          the Forge team to add your USC email.
        </p>
        <Link href="/spaces" className={secondaryBtn}>See all spaces</Link>
      </div>
    );
  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold">Staff portal</h1>
      <p>You are staff for: {session.staff_space_ids.join(", ")}. Posting scrap and managing claims are coming next.</p>
    </div>
  );
}
