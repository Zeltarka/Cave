// app/api/admin/images/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    const { fileName, contentType } = await req.json();

    const { data, error } = await supabaseAdmin.storage
        .from("images")
        .createSignedUploadUrl(fileName);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
}