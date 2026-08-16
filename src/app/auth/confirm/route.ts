import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: string | null): string | null {
  if (!value) return "/optimizer";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = getSafeRedirectPath(next);
  const home = new URL("/", request.nextUrl.origin);

  if (!tokenHash || !type || !safeNext) {
    home.searchParams.set("error", "auth_confirm");
    return NextResponse.redirect(home);
  }

  const supabase = await getServerSupabaseClient();
  if (!supabase) {
    home.searchParams.set("error", "auth_confirm");
    return NextResponse.redirect(home);
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    home.searchParams.set("error", "auth_confirm");
    return NextResponse.redirect(home);
  }

  return NextResponse.redirect(new URL(safeNext, request.nextUrl.origin));
}
