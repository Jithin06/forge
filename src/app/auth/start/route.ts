import { authMode, safeNext } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase-server";

/** Start Google sign-in through Supabase (AUTH_MODE=google). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  if (authMode() === "test") return Response.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}`, url.origin), 303);

  const callback = new URL("/auth/callback", url.origin);
  callback.searchParams.set("next", next);
  for (const k of ["audience", "experience", "name"]) {
    const v = url.searchParams.get(k);
    if (v) callback.searchParams.set(k, v);
  }
  const supabase = await supabaseAuth();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), queryParams: { hd: "usc.edu", prompt: "select_account" } },
  });
  if (error || !data.url) return Response.redirect(new URL(`/sign-in?error=failed&next=${encodeURIComponent(next)}`, url.origin), 303);
  return Response.redirect(data.url, 303);
}
