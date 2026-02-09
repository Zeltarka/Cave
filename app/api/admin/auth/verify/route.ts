// app/api/admin/auth/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkAdminAuth } from "@/lib/api-auth";

export async function GET() {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("admin_session");

        if (!session) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        return NextResponse.json({ authenticated: true });
    } catch (error) {
        console.error("❌ Erreur verify:", error);
        return NextResponse.json(
            { authenticated: false },
            { status: 500 }
        );
    }
}