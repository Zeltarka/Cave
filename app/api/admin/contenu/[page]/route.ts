// app/api/admin/contenu/[page]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ page: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { page: pageName } = await params;
        console.log(`🗑️  Suppression page: ${pageName}`);

        const { error } = await supabaseAdmin
            .from("contenu")
            .delete()
            .eq("page", pageName);

        if (error) {
            console.error("❌ Erreur suppression:", error);
            throw error;
        }

        console.log(`✅ Page ${pageName} supprimée`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("❌ Erreur suppression contenu:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ page: string }> }
) {


    try {
        const { page: pageName } = await params;
        console.log(`🔍 Récupération contenu page: ${pageName}`);

        const { data: page, error } = await supabaseAdmin
            .from("contenu")
            .select("*")
            .eq("page", pageName)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Page non trouvée" },
                    { status: 404 }
                );
            }
            console.error("❌ Erreur Supabase:", error);
            throw error;
        }

        const pageFormatted = {
            id: page.id,
            page: page.page,
            contenu: page.contenu,
            updatedAt: page.updated_at
        };

        console.log(`✅ Page ${pageName} récupérée`);
        return NextResponse.json(pageFormatted);

    } catch (error) {
        console.error("❌ Erreur récupération contenu:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ page: string }> }
) {
    // ✅ SÉCURITÉ: Vérification d'authentification JWT
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { page: pageName } = await params;
        console.log(`✏️  Mise à jour contenu page: ${pageName}`);

        const body = await req.json();
        const { contenu } = body;

        // ✅ SÉCURITÉ: Validation des données
        if (!contenu) {
            return NextResponse.json(
                { error: "Contenu manquant" },
                { status: 400 }
            );
        }

        console.log("📝 Contenu reçu:", contenu);

        // Vérifier si la page existe
        const { data: existing } = await supabaseAdmin
            .from("contenu")
            .select("id")
            .eq("page", pageName)
            .single();

        let page;
        if (existing) {
            // Mettre à jour
            const { data, error } = await supabaseAdmin
                .from("contenu")
                .update({
                    contenu: contenu,
                    updated_at: new Date().toISOString()
                })
                .eq("page", pageName)
                .select()
                .single();

            if (error) {
                console.error("❌ Erreur update:", error);
                throw error;
            }
            page = data;
        } else {
            // Créer
            const { data, error } = await supabaseAdmin
                .from("contenu")
                .insert({
                    page: pageName,
                    contenu: contenu
                })
                .select()
                .single();

            if (error) {
                console.error("❌ Erreur insert:", error);
                throw error;
            }
            page = data;
        }

        const pageFormatted = {
            id: page.id,
            page: page.page,
            contenu: page.contenu,
            updatedAt: page.updated_at
        };

        console.log(`✅ Page ${pageName} mise à jour`);
        return NextResponse.json(pageFormatted);

    } catch (error) {
        console.error("❌ Erreur modification contenu:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}