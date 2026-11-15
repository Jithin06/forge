import { cookies } from "next/headers";
import { TEST_COOKIE, authMode } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase-server";

export async function POST() {
  if (authMode() === "test") (await cookies()).delete(TEST_COOKIE);
  else await (await supabaseAuth()).auth.signOut();
  return new Response(null, { status: 303, headers: { Location: "/" } });
}
