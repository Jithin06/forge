import { NO_STORE } from "@/lib/api";
import { authMode, currentUser, staffSpaceIds } from "@/lib/auth";

/** Light "who am I" for the header. Never an error: signed out is { user: null }. */
export async function GET() {
  const user = await currentUser();
  return Response.json(
    { user: user ? { email: user.email } : null, staff_space_ids: user ? await staffSpaceIds(user.email) : [], auth_mode: authMode() },
    { headers: NO_STORE },
  );
}
