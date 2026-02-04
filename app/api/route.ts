import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const diagnostics = {
    env_url: process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ MANQUANT",
    env_key_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_key_preview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + "...",
  };

  // Test 1: Connexion basique
  try {
    const { data, error, count } = await supabase
      .from("panier")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        success: false,
        diagnostics,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      });
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      tableExists: true,
      rowCount: count,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      diagnostics,
      catchError: err.message,
    });
  }
}
