"use client";

import { CircleAlert, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { Band, Body } from "@/components/page";
import { profileForSignIn } from "@/components/profile-store";
import { useSession } from "./use-session";

const NOT_USC = "Forge is for USC accounts. Use your @usc.edu Google account.";
const primaryBtn = "btn btn-cardinal w-full sm:w-auto";
const secondaryBtn = "btn btn-plain w-full sm:w-auto";

/** The test picker shows only when the running server says it is in test mode. */
export function SignInPanel() {
  const mode = useSession()?.auth_mode ?? null;
  const [params, setParams] = useState<{ next: string; error: string | null }>({ next: "/", error: null });
  // A profile edited in this browser while signed out goes along, so signing in keeps it.
  const [carry, setCarry] = useState<{ name?: string; audience?: string; experience?: string }>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    Promise.resolve().then(() => {
      setParams({ next: q.get("next") || "/", error: q.get("error") });
      setCarry(profileForSignIn());
    });
  }, []);
  const carried = Object.entries(carry)
    .filter(([, v]) => v)
    .map(([k, v]) => `&${k}=${encodeURIComponent(v!)}`)
    .join("");

  const why = params.next.startsWith("/scrap")
    ? "Sign in to claim free scrap. It keeps claims to real USC students."
    : params.next.startsWith("/staff")
      ? "Sign in to open the staff portal."
      : "Sign in to save your plans and claim free scrap.";

  return (
    <>
      <Band title="Sign in with your USC Google account" size="md">
        <p>{why}</p>
      </Band>
      <Body>

      {params.error && (
        <p role="alert" className="alert">
          <CircleAlert aria-hidden className="size-5" />
          <span>{params.error === "not_usc" ? NOT_USC : "Sign-in did not finish. Please try again."}</span>
        </p>
      )}

      {mode === null ? (
        <p role="status" className="text-gray-text">Loading...</p>
      ) : mode === "google" ? (
        <a
          href={`/auth/start?next=${encodeURIComponent(params.next)}${carried}`}
          className={primaryBtn}
        >
          Sign in with Google
        </a>
      ) : (
        <section aria-labelledby="test-signin" className="card space-y-4 bg-gold-soft p-4">
          <h2 id="test-signin" className="flex items-center gap-2 text-[22px] font-bold">
            <FlaskConical aria-hidden className="size-5" />
            Test sign-in
          </h2>
          <p>Google sign-in is not connected yet. Pick a test account to try the app. These are not real people.</p>
          <div className="flex flex-col gap-3">
            {(
              [
                ["student", "Sign in as a test USC student", primaryBtn],
                ["staff", "Sign in as test Maker Space staff", secondaryBtn],
                ["nonusc", "Try a non-USC account", secondaryBtn],
              ] as const
            ).map(([persona, label, cls]) => (
              <form key={persona} method="post" action="/auth/test">
                <input type="hidden" name="persona" value={persona} />
                <input type="hidden" name="next" value={params.next} />
                <input type="hidden" name="name" value={carry.name ?? ""} />
                <input type="hidden" name="audience" value={carry.audience ?? ""} />
                <input type="hidden" name="experience" value={carry.experience ?? ""} />
                <button type="submit" className={cls}>{label}</button>
              </form>
            ))}
          </div>
        </section>
      )}
      </Body>
    </>
  );
}
