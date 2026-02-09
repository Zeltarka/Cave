// app/api/admin/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        console.log("🔵 Début upload");

        const formData = await request.formData();
        const file = formData.get("file");
        const oldFileName = formData.get("oldFileName");

        console.log("📦 File:", file);
        console.log("🗑️ Old file:", oldFileName);

        if (!file || !(file instanceof File)) {
            console.log("❌ Pas de fichier");
            return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
        }

        // Vérifier la taille
        if (file.size > 20 * 1024 * 1024) {
            console.log("❌ Fichier trop gros");
            return NextResponse.json({ error: "Fichier trop volumineux (max 20 MB)" }, { status: 400 });
        }

        // Générer un nom unique
        const timestamp = Date.now();
        const extension = file.name.split(".").pop() || "jpg";
        const fileName = `${timestamp}.${extension}`;

        console.log("📝 Nouveau nom:", fileName);

        // Convertir en buffer
        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);

        console.log("📤 Upload vers Supabase...");

        // Upload
        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, buffer, {
                contentType: file.type,
            });

        if (uploadError) {
            console.error("❌ Erreur Supabase:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // URL publique
        const { data: { publicUrl } } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        console.log("✅ Succès:", publicUrl);

        return NextResponse.json({
            success: true,
            fileName: publicUrl,
        });

    } catch (error) {
        console.error("❌ Erreur catch:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}