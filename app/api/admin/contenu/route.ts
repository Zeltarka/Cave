// app/api/admin/contenu/[page]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt-changez-moi";

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

        // Le contenu est déjà stocké en JSONB dans Supabase, pas besoin de parser
        const pageFormatted = {
            id: page.id,
            page: page.page,
            contenu: page.contenu, // Déjà un objet JavaScript
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
    try {
        const { page: pageName } = await params;
        console.log(`✏️  Mise à jour contenu page: ${pageName}`);

        // Vérifier l'authentification
        const cookieStore = await cookies();
        const token = cookieStore.get("admin-token");

        if (!token) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        try {
            jwt.verify(token.value, JWT_SECRET);
        } catch (jwtErr) {
            console.error("⚠️  Erreur JWT:", jwtErr);
            return NextResponse.json(
                { error: "Token invalide" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { contenu } = body;

        if (!contenu) {
            return NextResponse.json(
                { error: "Contenu manquant" },
                { status: 400 }
            );
        }

        console.log("📝 Contenu reçu:", contenu);

        // Le contenu arrive comme objet JavaScript depuis le frontend
        // Supabase JSONB accepte directement les objets JavaScript, pas besoin de stringify

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
                    contenu: contenu, // Envoyer directement l'objet
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
                    contenu: contenu // Envoyer directement l'objet
                })
                .select()
                .single();

            if (error) {
                console.error("❌ Erreur insert:", error);
                throw error;
            }
            page = data;
        }

        // Le contenu revient déjà comme objet depuis Supabase
        const pageFormatted = {
            id: page.id,
            page: page.page,
            contenu: page.contenu, // Déjà un objet JavaScript
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