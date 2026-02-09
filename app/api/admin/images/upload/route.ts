// app/api/admin/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    // Vérifier l'authentification admin
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "Fichier trop gros (max 20 MB)" }, { status: 400 });
        }

        const timestamp = Date.now();
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${timestamp}.${ext}`;

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);

        const { error } = await supabase.storage
            .from("images")
            .upload(fileName, buffer, { contentType: file.type });

        if (error) {
            console.error("❌ Erreur Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data } = supabase.storage.from("images").getPublicUrl(fileName);

        console.log("✅ Image uploadée:", data.publicUrl);

        return NextResponse.json({ success: true, fileName: data.publicUrl });

    } catch (error) {
        console.error("❌ Erreur upload:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}