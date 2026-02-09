// lib/api-auth.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function checkAdminAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (!session) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            )
        };
    }

    return {
        authorized: true,
        session: session.value
    };
}


type ApiHandler = (
    request: Request,
    context?: any
) => Promise<NextResponse> | NextResponse;

export function withAdminAuth(handler: ApiHandler): ApiHandler {
    return async (request: Request, context?: any) => {
        const cookieStore = await cookies();
        const session = cookieStore.get("admin_session");

        if (!session) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        return handler(request, context);
    };
}