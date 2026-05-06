import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nombre = searchParams.get("nombre");
        const type   = searchParams.get("type"); // "bouteille" | "bag_in_box"

        // Calcul des frais pour une commande
        if (nombre && type) {
            const { data, error } = await supabaseAdmin
                .from("frais_port")
                .select("*")
                .eq("type", type)
                .lte("bouteilles_min", parseInt(nombre))
                .order("bouteilles_min", { ascending: false })
                .limit(1);

            if (error) throw error;
            return NextResponse.json({ frais: data?.[0]?.frais ?? 0 });
        }

        // Récupération de toutes les tranches (admin)
        const { data, error } = await supabaseAdmin
            .from("frais_port")
            .select("*")
            .order("bouteilles_min", { ascending: true });

        if (error) throw error;

        const toTranche = (r: any) => ({
            id:           r.id,
            quantite_min: r.bouteilles_min,
            frais:        r.frais,
        });

        return NextResponse.json({
            bouteilles: (data ?? []).filter(r => r.type === "bouteille").map(toTranche),
            bagInBox:   (data ?? []).filter(r => r.type === "bag_in_box").map(toTranche),
        });
    } catch (err) {
        console.error("Erreur GET frais_port:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { bouteilles, bagInBox } = await req.json();

        const toRow = (f: any, type: string) => ({
            id:            randomUUID(),
            type,
            bouteilles_min: f.quantite_min,
            frais:          f.frais,
        });

        const allData = [
            ...bouteilles.map((f: any) => toRow(f, "bouteille")),
            ...bagInBox.map((f: any)   => toRow(f, "bag_in_box")),
        ];

        // Remplacer toutes les tranches
        const { error: deleteError } = await supabaseAdmin
            .from("frais_port")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabaseAdmin
            .from("frais_port")
            .insert(allData);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur PUT frais_port:", err);
        return NextResponse.json({
            error: err instanceof Error ? err.message : "Erreur serveur"
        }, { status: 500 });
    }
}

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