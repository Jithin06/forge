"use client";

import { useSyncExternalStore } from "react";
import { AUDIENCES, EXPERIENCES, type Audience, type Experience } from "@/lib/schemas";

/**
 * "I am a..." and "I have..." choices, remembered in this browser.
 * Storage can be blocked (private mode), so every access is guarded and the
 * app works without it for the current page view.
 */
const KEYS = { audience: "forge.audience", experience: "forge.experience" } as const;
type Key = keyof typeof KEYS;

const memory: Partial<Record<Key, string>> = {};
const listeners = new Set<() => void>();

function read(key: Key): string | null {
  try {
    return window.localStorage.getItem(KEYS[key]) ?? memory[key] ?? null;
  } catch {
    return memory[key] ?? null;
  }
}

function write(key: Key, value: string) {
  memory[key] = value;
  try {
    window.localStorage.setItem(KEYS[key], value);
  } catch {
    /* storage blocked: keep the in-memory value */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS.audience || e.key === KEYS.experience) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAudience(): [Audience | null, (a: Audience) => void] {
  const raw = useSyncExternalStore(subscribe, () => read("audience"), () => null);
  const value = AUDIENCES.includes(raw as Audience) ? (raw as Audience) : null;
  return [value, (a) => write("audience", a)];
}

export function useExperience(): [Experience | null, (e: Experience) => void] {
  const raw = useSyncExternalStore(subscribe, () => read("experience"), () => null);
  const value = EXPERIENCES.includes(raw as Experience) ? (raw as Experience) : null;
  return [value, (e) => write("experience", e)];
}
