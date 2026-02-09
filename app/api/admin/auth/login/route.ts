// app/api/admin/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminToken } from "@/lib/api-auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Vérifier les identifiants
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error("❌ Variables d'environnement ADMIN manquantes");
            return NextResponse.json(
                { error: "Configuration serveur manquante" },
                { status: 500 }
            );
        }

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            console.log("❌ Identifiants incorrects");
            return NextResponse.json(
                { error: "Email ou mot de passe incorrect" },
                { status: 401 }
            );
        }

        // Créer un JWT avec la fonction de ton lib/api-auth.ts
        const token = createAdminToken(email);

        // Stocker le JWT dans un cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,// session d'une journée ¨Pour 7 jours : '*7'
            path: "/",
        });

        console.log("✅ Admin connecté:", email);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur login:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}