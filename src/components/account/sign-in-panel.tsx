"use client";

import { CircleAlert, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudience, useExperience } from "@/components/profile-store";
import { useSession } from "./use-session";

const NOT_USC = "Forge is for USC accounts. Use your @usc.edu Google account.";
const primaryBtn =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-cardinal px-6 font-semibold text-white hover:bg-cardinal-pressed sm:w-auto";
const secondaryBtn =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-cardinal bg-white px-5 font-semibold text-cardinal hover:bg-gold-soft sm:w-auto";

/** The test picker shows only when the running server says it is in test mode. */
export function SignInPanel() {
  const mode = useSession()?.auth_mode ?? null;
  const [audience] = useAudience();
  const [experience] = useExperience();
  const [params, setParams] = useState<{ next: string; error: string | null }>({ next: "/", error: null });
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    Promise.resolve().then(() => setParams({ next: q.get("next") || "/", error: q.get("error") }));
  }, []);

  const why = params.next.startsWith("/scrap")
    ? "Sign in to claim free scrap. It keeps claims to real USC students."
    : params.next.startsWith("/staff")
      ? "Sign in to open the staff portal."
      : "Sign in to save your plans and claim free scrap.";

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-bold">Sign in with your USC Google account</h1>
      <p className="text-[18px]">{why}</p>

      {params.error && (
        <p role="alert" className="flex items-start gap-2 border-l-4 border-cardinal pl-4">
          <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
          {params.error === "not_usc" ? NOT_USC : "Sign-in did not finish. Please try again."}
        </p>
      )}

      {mode === null ? (
        <p role="status" className="text-gray-text">Loading...</p>
      ) : mode === "google" ? (
        <a
          href={`/auth/start?next=${encodeURIComponent(params.next)}${audience ? `&audience=${audience}` : ""}${experience ? `&experience=${experience}` : ""}`}
          className={primaryBtn}
        >
          Sign in with Google
        </a>
      ) : (
        <section aria-labelledby="test-signin" className="space-y-4 rounded-xl border-l-4 border-gold bg-gold-soft p-4">
          <h2 id="test-signin" className="flex items-center gap-2 text-[18px] font-semibold">
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
                <input type="hidden" name="audience" value={audience ?? ""} />
                <input type="hidden" name="experience" value={experience ?? ""} />
                <button type="submit" className={cls}>{label}</button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
