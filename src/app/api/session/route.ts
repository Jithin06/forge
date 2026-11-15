import { NO_STORE } from "@/lib/api";
import { authMode, currentUser, staffSpaceIds } from "@/lib/auth";
import { db } from "@/lib/db";

/** Light "who am I" for the header and the profile. Never an error: signed out is { user: null }. */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ user: null, profile: null, staff_space_ids: [], auth_mode: authMode() }, { headers: NO_STORE });
  }
  const [staff, profile] = await Promise.all([
    staffSpaceIds(user.email),
    db().from("profiles").select("display_name, audience, experience").eq("user_id", user.id).maybeSingle(),
  ]);
  return Response.json(
    {
      user: { email: user.email },
      profile: profile.data ?? { display_name: null, audience: null, experience: null },
      staff_space_ids: staff,
      auth_mode: authMode(),
    },
    { headers: NO_STORE },
  );
}
