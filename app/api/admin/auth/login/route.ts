// app/api/admin/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createAdminToken } from "@/lib/api-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

// Fonction pour extraire l'IP réelle
function getClientIP(headersList: Headers): string {
    // Essayer différentes sources d'IP (derrière proxy, CDN, etc.)
    const forwarded = headersList.get("x-forwarded-for");
    const real = headersList.get("x-real-ip");
    const cfConnecting = headersList.get("cf-connecting-ip");

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    if (real) {
        return real;
    }
    if (cfConnecting) {
        return cfConnecting;
    }

    return "unknown";
}

export async function POST(req: Request) {
    try {
        // Récupérer l'IP du client
        const headersList = await headers();
        const clientIP = getClientIP(headersList);

        console.log(`🔐 Tentative de connexion depuis IP: ${clientIP}`);

        // Vérifier le rate limiting
        const rateLimitResult = checkRateLimit(clientIP);

        if (rateLimitResult.blocked) {
            console.log(`🚫 IP bloquée: ${clientIP} jusqu'à ${rateLimitResult.blockedUntil}`);
            return NextResponse.json(
                {
                    error: `Trop de tentatives. Réessayez dans ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} minutes.`,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimitResult.retryAfter || 1800),
                    },
                }
            );
        }

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
            console.log(`❌ Identifiants incorrects depuis IP: ${clientIP} (${rateLimitResult.remainingAttempts} tentatives restantes)`);

            return NextResponse.json(
                {
                    error: "Email ou mot de passe incorrect",
                    remainingAttempts: rateLimitResult.remainingAttempts,
                },
                { status: 401 }
            );
        }

        // Connexion réussie : réinitialiser le rate limit
        resetRateLimit(clientIP);

        // Créer un JWT
        const token = createAdminToken(email);

        // Stocker le JWT dans un cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 jour
            path: "/",
        });

        console.log(`✅ Admin connecté: ${email} depuis IP: ${clientIP}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur login:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}