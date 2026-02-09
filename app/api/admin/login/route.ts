// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, validateAdminCredentials } from "@/lib/api-auth";


export async function POST(request: NextRequest) {

    try {
        const { email, password } = await request.json();

        // ✅ SÉCURITÉ: Validation des champs
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email et mot de passe requis" },
                { status: 400 }
            );
        }

        // ✅ SÉCURITÉ: Vérifier les credentials
        const isValid = validateAdminCredentials(email, password);

        if (!isValid) {
            // Attendre un peu pour éviter les attaques par force brute
            await new Promise(resolve => setTimeout(resolve, 1000));

            return NextResponse.json(
                { error: "Identifiants incorrects" },
                { status: 401 }
            );
        }

        // ✅ SÉCURITÉ: Créer un JWT sécurisé
        const token = createAdminToken(email);

        // Créer la réponse avec le cookie sécurisé
        const response = NextResponse.json({
            success: true,
            message: "Connexion réussie"
        });

        // ✅ SÉCURITÉ: Cookie HttpOnly, Secure, SameSite
        response.cookies.set("admin_session", token, {
            httpOnly: true, // Impossible d'accéder via JavaScript
            secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
            sameSite: "lax", // Protection CSRF
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: "/" // Disponible sur tout le site
        });

        console.log("✅ Admin connecté:", email);
        return response;

    } catch (error) {
        console.error("❌ Erreur login:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}