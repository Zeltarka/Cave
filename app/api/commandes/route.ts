// app/api/commandes/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
};

type Messages = {
    panier: {
        ajout_succes: string;
        ajout_erreur: string;
        panier_vide: string;
        bouton_remplir: string;
    };
};

async function getMessages(): Promise<Messages | null> {
    try {
        const { data, error } = await supabase
            .from("contenu")
            .select("contenu")
            .eq("page", "messages-systeme")
            .single();
        if (error) return null;
        return data.contenu as Messages;
    } catch {
        return null;
    }
}

/**
 * Récupère le maximum de bouteilles autorisé en prenant
 * le bouteilles_min le plus élevé dans la table frais_port.
 * Fallback à 24 si la table est vide ou inaccessible.
 */
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

async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        cookieStore.set("session_id", sessionId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }

    return sessionId;
}

export async function GET() {
    try {
        const sessionId = await getSessionId();

        const { data, error } = await supabase
            .from("panier")
            .select("*")
            .eq("session_id", sessionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const panier = data.map(item => ({
            id:           item.produit_id,
            produit:      item.produit,
            quantite:     item.quantite,
            prix:         item.prix,
            destinataire: item.destinataire,
            type:         item.type,
        }));

        return NextResponse.json(panier);
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const produit: ProduitPanier = await req.json();
        const sessionId = await getSessionId();

        if (!produit.id || !produit.produit || produit.quantite === undefined || produit.prix === undefined) {
            const messages = await getMessages();
            return NextResponse.json(
                { error: messages?.panier.ajout_erreur || "Données invalides" },
                { status: 400 }
            );
        }

        if (produit.quantite <= 0) {
            const { error } = await supabase
                .from("panier")
                .delete()
                .eq("session_id", sessionId)
                .eq("produit_id", produit.id);

            if (error) {
                const messages = await getMessages();
                return NextResponse.json({ error: messages?.panier.ajout_erreur || error.message }, { status: 500 });
            }
            return NextResponse.json({ ok: true });
        }

        // Vérification du quota bouteilles uniquement pour les produits de type bouteille
        const estBouteille = produit.id === "champagne" || produit.id === "rose" ||
            (produit as any).type === "bouteille";

        let nouvelleQuantite = produit.quantite;

        if (estBouteille) {
            // Récupère le max dynamiquement depuis la table frais_port
            const maxBouteilles = await getMaxBouteilles();

            // Récupère la somme de toutes les autres bouteilles dans le panier
            const { data: autresData } = await supabase
                .from("panier")
                .select("quantite, produit_id")
                .eq("session_id", sessionId)
                .neq("produit_id", produit.id);

            // On filtre côté JS les lignes qui sont des bouteilles
            // (type "bouteille", "champagne" ou "rose")
            const quantiteAutres = (autresData ?? [])
                .filter((row: any) =>
                    row.type === "bouteille" ||
                    row.produit_id === "champagne" ||
                    row.produit_id === "rose"
                )
                .reduce((sum: number, row: any) => sum + row.quantite, 0);

            const totalCombine = quantiteAutres + nouvelleQuantite;

            if (totalCombine > maxBouteilles) {
                nouvelleQuantite = Math.max(0, maxBouteilles - quantiteAutres);
            }

            if (nouvelleQuantite <= 0) {
                return NextResponse.json(
                    {
                        error: `Maximum ${maxBouteilles} bouteilles combinées`,
                        maxAtteint: true,
                    },
                    { status: 400 }
                );
            }
        }

        const dataToInsert = {
            session_id:   sessionId,
            produit_id:   produit.id,
            produit:      produit.produit,
            quantite:     nouvelleQuantite,
            prix:         parseFloat(produit.prix.toString()),
            destinataire: produit.destinataire || null,
            type:         (produit as any).type || null,
        };

        const { data, error } = await supabase
            .from("panier")
            .upsert(dataToInsert, { onConflict: "session_id,produit_id" })
            .select();

        if (error) {
            const messages = await getMessages();
            return NextResponse.json(
                { error: messages?.panier.ajout_erreur || error.message, details: error.details },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true, data, quantiteFinale: nouvelleQuantite });

    } catch (error: any) {
        const messages = await getMessages();
        return NextResponse.json(
            { error: messages?.panier.ajout_erreur || "Erreur serveur", message: error.message },
            { status: 500 }
        );
    }
}

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
            const messages = await getMessages();
            return NextResponse.json({ error: messages?.panier.ajout_erreur || error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        const messages = await getMessages();
        return NextResponse.json({ error: messages?.panier.ajout_erreur || "Erreur serveur" }, { status: 500 });
    }
}