// app/api/admin/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    // ✅ SÉCURITÉ: Vérifier l'authentification admin
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const oldFileName = formData.get("oldFileName") as string | null;

        // Validation du fichier
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "Fichier trop gros (max 20 MB)" }, { status: 400 });
        }

        // Vérifier que c'est bien une image
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
        }

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${timestamp}.${ext}`;

        // Convertir le fichier en buffer
        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false // Ne pas écraser si existe déjà
            });

        if (uploadError) {
            console.error("❌ Erreur upload Supabase:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Récupérer l'URL publique
        const { data } = supabase.storage.from("images").getPublicUrl(fileName);

        console.log("✅ Image uploadée:", data.publicUrl);

        // Supprimer l'ancienne image si elle existe (optionnel)
        if (oldFileName && oldFileName.startsWith("http")) {
            try {
                // Extraire le nom du fichier de l'URL
                const oldFileNameOnly = oldFileName.split("/").pop();
                if (oldFileNameOnly) {
                    await supabase.storage
                        .from("images")
                        .remove([oldFileNameOnly]);
                    console.log("🗑️ Ancienne image supprimée:", oldFileNameOnly);
                }
            } catch (err) {
                console.warn("⚠️ Impossible de supprimer l'ancienne image:", err);
                // On continue quand même, ce n'est pas critique
            }
        }

        // Retourner l'URL complète
        return NextResponse.json({
            success: true,
            fileName: data.publicUrl,
            url: data.publicUrl
        });

    } catch (error) {
        console.error("❌ Erreur upload:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}