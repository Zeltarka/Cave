// lib/api-auth.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGEZ_MOI_EN_PRODUCTION";

// Type pour le payload du JWT
interface JWTPayload {
    email: string;
    isAdmin: boolean;
    iat?: number;
    exp?: number;
}

/**
 * Vérifie l'authentification admin via cookie JWT
 * Retourne authorized: true si l'utilisateur est authentifié et admin
 */
export async function checkAdminAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    // Pas de cookie = pas authentifié
    if (!session) {
        console.log("❌ Pas de session admin trouvée");
        return {
            authorized: false,
            response: NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            )
        };
    }

    try {
        // Vérifier et décoder le JWT
        const decoded = jwt.verify(session.value, JWT_SECRET) as JWTPayload;

        // Vérifier que l'utilisateur est bien admin
        if (!decoded.isAdmin) {
            console.log("❌ Utilisateur non admin");
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: "Accès refusé - Admin uniquement" },
                    { status: 403 }
                )
            };
        }

        console.log("✅ Session admin valide pour:", decoded.email);
        return {
            authorized: true,
            session: decoded
        };
    } catch (error) {
        // Token invalide, expiré, ou corrompu
        console.log("❌ Token JWT invalide:", error);
        return {
            authorized: false,
            response: NextResponse.json(
                { error: "Session invalide ou expirée" },
                { status: 401 }
            )
        };
    }
}

/**
 * Crée un JWT sécurisé pour l'admin
 * À utiliser dans votre route de login
 */
export function createAdminToken(email: string): string {
    return jwt.sign(
        {
            email,
            isAdmin: true
        },
        JWT_SECRET,
        {
            expiresIn: "7d" // Token expire après 7 jours
        }
    );
}

/**
 * Valide les credentials admin (email + password)
 * Retourne true si valides
 */
export function validateAdminCredentials(email: string, password: string): boolean {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error("❌ ADMIN_EMAIL ou ADMIN_PASSWORD non défini dans .env");
        return false;
    }

    return email === adminEmail && password === adminPassword;
}