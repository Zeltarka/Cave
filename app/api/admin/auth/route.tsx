import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_PASSWORD) {
            return NextResponse.json(
                { success: false, message: "Configuration manquante" },
                { status: 500 }
            );
        }

        if (password === ADMIN_PASSWORD) {
            const cookieStore = await cookies();

            // Créer un token de session simple (vous pouvez améliorer avec JWT)
            const sessionToken = Buffer.from(`admin-${Date.now()}`).toString("base64");

            cookieStore.set("admin-session", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 heures
                path: "/",
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, message: "Mot de passe incorrect" },
            { status: 401 }
        );
    } catch (err) {
        console.error("Erreur auth admin:", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// Vérifier la session
export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("admin-session");

        if (session) {
            return NextResponse.json({ authenticated: true });
        }

        return NextResponse.json({ authenticated: false }, { status: 401 });
    } catch (err) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}