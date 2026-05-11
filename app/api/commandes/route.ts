// app/api/commandes/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type ProduitPanier = {
    id:           string;
    produit:      string;
    quantite:     number;
    prix:         number;
    type?:        string;
    destinataire?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        cookieStore.set("session_id", sessionId, {
            path:     "/",
            maxAge:   60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: "lax",
            secure:   process.env.NODE_ENV === "production",
        });
    }

    return sessionId;
}

async function getErreurMessage(): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("contenu")
            .select("contenu")
            .eq("page", "messages-systeme")
            .single();
        if (error || !data) return "Erreur : impossible d'ajouter le produit.";
        return data.contenu?.panier?.ajout_erreur ?? "Erreur : impossible d'ajouter le produit.";
    } catch {
        return "Erreur : impossible d'ajouter le produit.";
    }
}

async function getMaxBouteilles(): Promise<number> {
    try {
        const { data, error } = await supabase
            .from("frais_port")
            .select("bouteilles_min")
            .order("bouteilles_min", { ascending: false })
            .limit(1)
            .single();
        if (error || !data) return 24;
        return data.bouteilles_min as number;
    } catch {
        return 24;
    }
}

function estTypeBouteille(item: { type?: string | null; produit_id?: string; id?: string }): boolean {
    const id = item.produit_id ?? item.id ?? "";
    return item.type === "bouteille" || id === "champagne" || id === "rose";
}

// ── GET — récupère le panier ─────────────────────────────────────────────────

export async function GET() {
    try {
        const sessionId = await getSessionId();

        const { data, error } = await supabase
            .from("panier")
            .select("*")
            .eq("session_id", sessionId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const panier = data.map(item => ({
            id:           item.produit_id,
            produit:      item.produit,
            quantite:     item.quantite,
            prix:         item.prix,
            destinataire: item.destinataire,
            type:         item.type,
        }));

        return NextResponse.json(panier);
    } catch {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// ── POST — ajoute au panier (addition) ──────────────────────────────────────

export async function POST(req: Request) {
    try {
        const produit: ProduitPanier = await req.json();
        const sessionId = await getSessionId();
        const erreurMsg = await getErreurMessage();

        // Validation
        if (!produit.id || !produit.produit || produit.quantite === undefined || produit.prix === undefined) {
            return NextResponse.json({ error: erreurMsg }, { status: 400 });
        }

        // Quantité négative ou nulle → suppression
        if (produit.quantite <= 0) {
            const { error } = await supabase
                .from("panier")
                .delete()
                .eq("session_id", sessionId)
                .eq("produit_id", produit.id);

            if (error) return NextResponse.json({ error: erreurMsg }, { status: 500 });
            return NextResponse.json({ ok: true });
        }

        // Récupère la quantité déjà en panier pour ce produit
        const { data: existant } = await supabase
            .from("panier")
            .select("quantite")
            .eq("session_id", sessionId)
            .eq("produit_id", produit.id)
            .maybeSingle();

        const quantiteExistante = existant?.quantite ?? 0;
        let nouvelleQuantite    = quantiteExistante + produit.quantite;

        // ── Quota bouteilles ────────────────────────────────────────────────
        if (estTypeBouteille(produit)) {
            const maxBouteilles = await getMaxBouteilles();

            // Somme des autres bouteilles dans le panier (hors produit courant)
            const { data: autresData } = await supabase
                .from("panier")
                .select("quantite, produit_id, type")
                .eq("session_id", sessionId)
                .neq("produit_id", produit.id);

            const quantiteAutres = (autresData ?? [])
                .filter(estTypeBouteille)
                .reduce((sum, row) => sum + row.quantite, 0);

            const totalCombine = quantiteAutres + nouvelleQuantite;

            if (totalCombine > maxBouteilles) {
                // Plafonne au maximum autorisé
                nouvelleQuantite = Math.max(0, maxBouteilles - quantiteAutres);
            }

            if (nouvelleQuantite <= quantiteExistante) {
                return NextResponse.json(
                    { error: `Maximum ${maxBouteilles} bouteilles combinées`, maxAtteint: true },
                    { status: 400 }
                );
            }
        }

        // ── Upsert ──────────────────────────────────────────────────────────
        const { data, error } = await supabase
            .from("panier")
            .upsert(
                {
                    session_id:   sessionId,
                    produit_id:   produit.id,
                    produit:      produit.produit,
                    quantite:     nouvelleQuantite,
                    prix:         parseFloat(produit.prix.toString()),
                    destinataire: produit.destinataire ?? null,
                    type:         produit.type ?? null,
                },
                { onConflict: "session_id,produit_id" }
            )
            .select();

        if (error) return NextResponse.json({ error: erreurMsg, details: error.details }, { status: 500 });

        return NextResponse.json({ ok: true, data, quantiteFinale: nouvelleQuantite });

    } catch (err: any) {
        const erreurMsg = await getErreurMessage();
        return NextResponse.json({ error: erreurMsg, message: err.message }, { status: 500 });
    }
}

// ── DELETE — retire un produit du panier ─────────────────────────────────────

export async function DELETE(req: Request) {
    try {
        const { id }: { id: string } = await req.json();
        const sessionId = await getSessionId();

        const { error } = await supabase
            .from("panier")
            .delete()
            .eq("session_id", sessionId)
            .eq("produit_id", id);

        if (error) {
            const erreurMsg = await getErreurMessage();
            return NextResponse.json({ error: erreurMsg }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        const erreurMsg = await getErreurMessage();
        return NextResponse.json({ error: erreurMsg }, { status: 500 });
    }
}