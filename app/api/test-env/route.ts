// app/api/test-env/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    const env = {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        smtp_host: !!process.env.SMTP_HOST,
        smtp_port: !!process.env.SMTP_PORT,
        smtp_user: !!process.env.SMTP_USER,
        smtp_pass: !!process.env.SMTP_PASS,
        vendeur_email: !!process.env.VENDEUR_EMAIL,

        // Afficher les premiers caractères (pour debug)
        supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        smtp_host_value: process.env.SMTP_HOST,
        smtp_port_value: process.env.SMTP_PORT,
    };

    return NextResponse.json(env);
}