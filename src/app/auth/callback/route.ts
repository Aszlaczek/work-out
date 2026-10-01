import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/?error=invalid_callback", request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: (type as "signup" | "email") || "signup",
  });

  if (error) {
    return NextResponse.redirect(new URL("/?error=confirmation_failed", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
