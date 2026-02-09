// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

// Client Supabase admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;
    try {
        // Guard : vérifier les env vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ ENV Supabase manquante");
            return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
        }

        // ── Compter toutes les commandes ──
        const { count: commandesTotal, error: errorTotal } = await supabaseAdmin
            .from("commandes")
            .select("*", { count: "exact", head: true });

        if (errorTotal) {
            console.error("Erreur count total:", errorTotal);
            return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
        }

        // ── Compter les commandes en attente ──
        const { count: commandesEnAttente, error: errorAttente } = await supabaseAdmin
            .from("commandes")
            .select("*", { count: "exact", head: true })
            .eq("statut", "en_attente");

        if (errorAttente) {
            console.error("Erreur count en_attente:", errorAttente);
        }

        // ── Compter les commandes payées ──
        const { count: commandesPayees, error: errorPayees } = await supabaseAdmin
            .from("commandes")
            .select("*", { count: "exact", head: true })
            .eq("statut", "payee");

        if (errorPayees) {
            console.error("Erreur count payée:", errorPayees);
        }

        // ── Récupérer les 10 dernières commandes ──
        const { data: dernieresCommandes, error: errorDernieres } = await supabaseAdmin
            .from("commandes")
            .select("id, nom, prenom, email, total, statut, created_at")
            .order("created_at", { ascending: false })
            .limit(10);

        if (errorDernieres) {
            console.error("Erreur récupération dernières commandes:", errorDernieres);
            return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
        }

        // ── Formatter les données pour le frontend ──
        const commandesFormatees = (dernieresCommandes || []).map((cmd) => ({
            id: cmd.id,
            nom: cmd.nom,
            prenom: cmd.prenom,
            email: cmd.email,
            total: cmd.total,
            statut: cmd.statut,
            createdAt: cmd.created_at,  // Supabase utilise created_at en snake_case
        }));

        return NextResponse.json({
            commandesTotal: commandesTotal || 0,
            commandesEnAttente: commandesEnAttente || 0,
            commandesPayees: commandesPayees || 0,
            dernieresCommandes: commandesFormatees,
        });

    } catch (error) {
        console.error("❌ Erreur stats:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}