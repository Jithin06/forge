"use client";

import { useEffect, useState } from "react";
import type { Audience, Experience } from "@/lib/schemas";

export type Session = {
  user: { email: string } | null;
  /** The signed-in user's saved profile. null when signed out. */
  profile: { display_name: string | null; audience: Audience | null; experience: Experience | null } | null;
  staff_space_ids: string[];
  auth_mode: "test" | "google";
};

// One request per page load, shared by the header, the banner and gated screens.
// Signing in or out is always a full page load, so this never goes stale.
let shared: Promise<Session> | null = null;
export function loadSession(): Promise<Session> {
  shared ??= fetch("/api/session", { cache: "no-store" })
    .then((r) => r.json() as Promise<Session>)
    .catch(() => ({ user: null, profile: null, staff_space_ids: [], auth_mode: "google" as const }));
  return shared;
}

/** Who is signed in, and which sign-in mode the server is in. null while loading. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let live = true;
    loadSession().then((s) => live && setSession(s));
    return () => {
      live = false;
    };
  }, []);
  return session;
}
