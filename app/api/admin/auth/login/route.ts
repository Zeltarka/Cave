// app/api/admin/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Vérifier les identifiants
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error("❌ Variables d'environnement ADMIN manquantes");
            return NextResponse.json(
                { message: "Configuration serveur manquante" },
                { status: 500 }
            );
        }

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { message: "Email ou mot de passe incorrect" },
                { status: 401 }
            );
        }

        // Créer une session
        const cookieStore = await cookies();
        const sessionToken = crypto.randomUUID();

        cookieStore.set("admin_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            path: "/",
        });

        console.log("✅ Admin connecté:", email);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur login:", error);
        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}