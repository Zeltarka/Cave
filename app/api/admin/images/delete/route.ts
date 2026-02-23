// app/api/admin/images/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    const fileName = req.nextUrl.searchParams.get("fileName");
    if (!fileName) return NextResponse.json({ error: "fileName manquant" }, { status: 400 });

    const { error } = await supabaseAdmin.storage.from("images").remove([fileName]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}