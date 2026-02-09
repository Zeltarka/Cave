// app/api/admin/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkAdminAuth } from "@/lib/api-auth";

export async function POST() {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;
    try {
        const cookieStore = await cookies();
        cookieStore.delete("admin_session");

        console.log("✅ Admin déconnecté");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur logout:", error);
        return NextResponse.json(
            { message: "Erreur serveur" },
            { status: 500 }
        );
    }
}