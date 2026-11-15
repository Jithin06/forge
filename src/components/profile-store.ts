"use client";

import { useSyncExternalStore } from "react";
import { AUDIENCES, EXPERIENCES, type Audience, type Experience } from "@/lib/schemas";
import { loadSession } from "./account/use-session";

/**
 * The student's profile: name, "I am a..." and "I have...".
 * Signed out, it lives in this browser. Signed in, the account is the source
 * of truth: it is read once per page load and every change is saved to it.
 * Storage can be blocked (private mode), so every access is guarded and the
 * app works without it for the current page view.
 *
 * Every component reads the profile through this one store, so a change
 * shows everywhere at once, and in other open tabs through the storage event.
 */
const KEYS = { name: "forge.name", audience: "forge.audience", experience: "forge.experience" } as const;
type Key = keyof typeof KEYS;
export type ProfilePatch = { name?: string; audience?: Audience; experience?: Experience };
export type SaveResult = "account" | "browser" | "error";

/** Set when the profile is changed while signed out, so the next sign-in carries the change to the account. */
const EDITED_KEY = "forge.profile_edited";
const memory: Partial<Record<Key, string>> = {};
const listeners = new Set<() => void>();
let signedIn = false;
let ready = false; // true once we know whether an account profile exists
let syncStarted = false;

function read(key: Key): string | null {
  try {
    return window.localStorage.getItem(KEYS[key]) ?? memory[key] ?? null;
  } catch {
    return memory[key] ?? null;
  }
}

function writeLocal(key: Key, value: string) {
  memory[key] = value;
  try {
    window.localStorage.setItem(KEYS[key], value);
  } catch {
    /* storage blocked: keep the in-memory value */
  }
}

function setEdited(on: boolean) {
  try {
    if (on) window.localStorage.setItem(EDITED_KEY, "1");
    else window.localStorage.removeItem(EDITED_KEY);
  } catch {
    /* storage blocked */
  }
}

/** What to send along with a sign-in: the profile as edited in this browser, or nothing. */
export function profileForSignIn(): { name?: string; audience?: string; experience?: string } {
  try {
    if (window.localStorage.getItem(EDITED_KEY) !== "1") return {};
  } catch {
    return {};
  }
  return { name: read("name") || undefined, audience: read("audience") ?? undefined, experience: read("experience") ?? undefined };
}

const emit = () => listeners.forEach((l) => l());

async function patchAccount(patch: ProfilePatch): Promise<boolean> {
  try {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: patch.name, audience: patch.audience, experience: patch.experience }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Once per page load: bring the account's profile into this browser, or fill the account's gaps from it. */
function startSync() {
  if (syncStarted) return;
  syncStarted = true;
  loadSession().then((s) => {
    signedIn = !!s.user;
    const p = s.profile;
    if (s.user && p) {
      setEdited(false); // sign-in already carried any browser-only changes to the account
      if (p.display_name) writeLocal("name", p.display_name);
      const missing: ProfilePatch = {};
      for (const key of ["audience", "experience"] as const) {
        const local = read(key);
        if (p[key]) writeLocal(key, p[key]!);
        else if (key === "audience" && AUDIENCES.includes(local as Audience)) missing.audience = local as Audience;
        else if (key === "experience" && EXPERIENCES.includes(local as Experience)) missing.experience = local as Experience;
      }
      if (Object.keys(missing).length) void patchAccount(missing);
    }
    ready = true;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startSync();
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || Object.values(KEYS).includes(e.key as (typeof KEYS)[Key])) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Save a change. The screen updates at once; the result says where it was kept. */
export async function saveProfile(patch: ProfilePatch): Promise<SaveResult> {
  if (patch.name !== undefined) writeLocal("name", patch.name);
  if (patch.audience) writeLocal("audience", patch.audience);
  if (patch.experience) writeLocal("experience", patch.experience);
  emit();
  if (!signedIn) {
    setEdited(true);
    return "browser";
  }
  return (await patchAccount(patch)) ? "account" : "error";
}

const useKey = (key: Key) => useSyncExternalStore(subscribe, () => read(key), () => null);

export function useAudience(): [Audience | null, (a: Audience) => void] {
  const raw = useKey("audience");
  const value = AUDIENCES.includes(raw as Audience) ? (raw as Audience) : null;
  return [value, (a) => void saveProfile({ audience: a })];
}

export function useExperience(): [Experience | null, (e: Experience) => void] {
  const raw = useKey("experience");
  const value = EXPERIENCES.includes(raw as Experience) ? (raw as Experience) : null;
  return [value, (e) => void saveProfile({ experience: e })];
}

export type Profile = {
  name: string;
  audience: Audience | null;
  experience: Experience | null;
  /** False until the browser has been read and, if signed in, the account too. */
  ready: boolean;
  signedIn: boolean;
};

export function useProfile(): Profile {
  const name = useKey("name") ?? "";
  const [audience] = useAudience();
  const [experience] = useExperience();
  const isReady = useSyncExternalStore(subscribe, () => ready, () => false);
  const isSignedIn = useSyncExternalStore(subscribe, () => signedIn, () => false);
  return { name, audience, experience, ready: isReady, signedIn: isSignedIn };
}
