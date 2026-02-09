// app/api/admin/frais-port/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer tous les frais de port OU calculer les frais pour un nombre de bouteilles
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nombre = searchParams.get("nombre");

        // Si nombre est fourni, calculer les frais pour ce nombre de bouteilles
        if (nombre) {
            const nombreBouteilles = parseInt(nombre);

            const { data, error } = await supabaseAdmin
                .from("frais_port")
                .select("*")
                .lte("bouteilles_min", nombreBouteilles)
                .order("bouteilles_min", { ascending: false })
                .limit(1);

            if (error) throw error;

            // Si on trouve une tranche, retourner les frais
            if (data && data.length > 0) {
                return NextResponse.json({ frais: data[0].frais });
            }

            // Sinon, retourner 0
            return NextResponse.json({ frais: 0 });
        }

        // Sinon, récupérer tous les frais de port (pour l'admin)
        const { data, error } = await supabaseAdmin
            .from("frais_port")
            .select("*")
            .order("bouteilles_min", { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err) {
        console.error("Erreur GET frais_port:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PUT - Sauvegarder tous les frais de port
export async function PUT(req: Request) {
    try {
        const { frais } = await req.json();

        // Supprimer tous les anciens frais
        const { error: deleteError } = await supabaseAdmin
            .from("frais_port")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) {
            console.error("Erreur lors de la suppression:", deleteError);
            throw deleteError;
        }

        // Insérer les nouveaux frais avec génération d'UUID
        const allData = frais.map((f: any) => ({
            id: randomUUID(),
            bouteilles_min: f.bouteilles_min,
            frais: f.frais,
        }));

        const { error: insertError } = await supabaseAdmin
            .from("frais_port")
            .insert(allData);

        if (insertError) {
            console.error("Erreur lors de l'insertion:", insertError);
            throw insertError;
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur PUT frais_port:", err);
        return NextResponse.json({
            error: err instanceof Error ? err.message : "Erreur serveur"
        }, { status: 500 });
    }
}

// DELETE - Supprimer une tranche
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        const { error } = await supabaseAdmin
            .from("frais_port")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur DELETE frais_port:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}