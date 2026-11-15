import { afterSignIn, isUscEmail, safeNext } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase-server";

/** Google returns here. The server checks the domain; "hd" on the request is only a hint. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const fail = (error: string) => Response.redirect(new URL(`/sign-in?error=${error}&next=${encodeURIComponent(next)}`, url.origin), 303);

  const code = url.searchParams.get("code");
  if (!code) return fail("failed");
  const supabase = await supabaseAuth();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("failed");

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isUscEmail(user.email)) {
    await supabase.auth.signOut(); // signed out at once
    return fail("not_usc");
  }
  await afterSignIn(
    { id: user.id, email: user.email!.toLowerCase() },
    {
      displayName: (user.user_metadata?.full_name as string | undefined) ?? null,
      audience: url.searchParams.get("audience"),
      experience: url.searchParams.get("experience"),
      next,
    },
  );
  return Response.redirect(new URL(next, url.origin), 303);
}
