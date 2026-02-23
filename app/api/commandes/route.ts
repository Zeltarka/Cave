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

        if (error) {
            console.error("⚠️  Erreur récupération messages:", error);
            return null;
        }

        return data.contenu as Messages;
    } catch (err) {
        console.error("⚠️  Erreur récupération messages:", err);
        return null;
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
        console.log("🆕 Nouvelle session créée:", sessionId);
    } else {
        console.log("♻️ Session existante:", sessionId);
    }

    return sessionId;
}

export async function GET() {
    try {
        console.log("📥 GET /api/commandes");
        const sessionId = await getSessionId();

        const { data, error } = await supabase
            .from("panier")
            .select("*")
            .eq("session_id", sessionId);

        if (error) {
            console.error("❌ Erreur Supabase GET:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`✅ GET réussi: ${data.length} produits`);

        const panier = data.map((item) => ({
            id: item.produit_id,
            produit: item.produit,
            quantite: item.quantite,
            prix: item.prix,
            destinataire: item.destinataire,
        }));

        return NextResponse.json(panier);
    } catch (error) {
        console.error("💥 Erreur GET:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        console.log("📤 POST /api/commandes");

        const produit: ProduitPanier = await req.json();
        console.log("📦 Produit reçu:", produit);

        const sessionId = await getSessionId();
        console.log("🔑 Session:", sessionId);

        if (!produit.id || !produit.produit || produit.quantite === undefined || produit.prix === undefined) {
            console.error("❌ Données invalides:", produit);
            const messages = await getMessages();
            const errorMessage = messages?.panier.ajout_erreur || "Données invalides";
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        if (produit.quantite <= 0) {
            console.log("🗑️ Suppression (quantité = 0)");
            const { error } = await supabase
                .from("panier")
                .delete()
                .eq("session_id", sessionId)
                .eq("produit_id", produit.id);

            if (error) {
                console.error("❌ Erreur suppression:", error);
                const messages = await getMessages();
                const errorMessage = messages?.panier.ajout_erreur || error.message;
                return NextResponse.json({ error: errorMessage }, { status: 500 });
            }

            console.log("✅ Suppression réussie");
            return NextResponse.json({ ok: true });
        }

        // ✅ Vérification du total combiné champagne + rosé (max 24)
        let nouvelleQuantite = produit.quantite;

        if (produit.id === "champagne" || produit.id === "rose") {
            const autreId = produit.id === "champagne" ? "rose" : "champagne";

            const { data: autreData } = await supabase
                .from("panier")
                .select("quantite")
                .eq("session_id", sessionId)
                .eq("produit_id", autreId)
                .single();

            const quantiteAutre = autreData?.quantite || 0;
            const totalCombine = quantiteAutre + nouvelleQuantite;

            if (totalCombine > 24) {
                nouvelleQuantite = Math.max(0, 24 - quantiteAutre);
                console.log(`⚠️ Cap 24 bouteilles: ${quantiteAutre} (${autreId}) + ${produit.quantite} > 24, ajusté à ${nouvelleQuantite}`);
            }

            if (nouvelleQuantite <= 0) {
                return NextResponse.json({
                    error: "Maximum 24 bouteilles combinées (champagne + rosé)",
                    maxAtteint: true
                }, { status: 400 });
            }
        }

        const dataToInsert = {
            session_id: sessionId,
            produit_id: produit.id,
            produit: produit.produit,
            quantite: nouvelleQuantite,
            prix: parseFloat(produit.prix.toString()),
            destinataire: produit.destinataire || null,
        };

        console.log("💾 Données à insérer:", dataToInsert);

        const { data, error } = await supabase
            .from("panier")
            .upsert(dataToInsert, {
                onConflict: "session_id,produit_id",
            })
            .select();

        if (error) {
            console.error("❌ Erreur Supabase UPSERT:", JSON.stringify(error, null, 2));
            const messages = await getMessages();
            const errorMessage = messages?.panier.ajout_erreur || error.message;
            return NextResponse.json({
                error: errorMessage,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }, { status: 500 });
        }

        console.log("✅ UPSERT réussi:", data);
        return NextResponse.json({ ok: true, data, quantiteFinale: nouvelleQuantite });

    } catch (error: any) {
        console.error("💥 Erreur POST:", error);
        const messages = await getMessages();
        const errorMessage = messages?.panier.ajout_erreur || "Erreur serveur";
        return NextResponse.json({
            error: errorMessage,
            message: error.message,
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        console.log("🗑️ DELETE /api/commandes");

        const { id }: { id: string } = await req.json();
        const sessionId = await getSessionId();

        console.log(`Suppression produit ${id} pour session ${sessionId}`);

        const { error } = await supabase
            .from("panier")
            .delete()
            .eq("session_id", sessionId)
            .eq("produit_id", id);

        if (error) {
            console.error("❌ Erreur Supabase DELETE:", error);
            const messages = await getMessages();
            const errorMessage = messages?.panier.ajout_erreur || error.message;
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        console.log("✅ DELETE réussi");
        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("💥 Erreur DELETE:", error);
        const messages = await getMessages();
        const errorMessage = messages?.panier.ajout_erreur || "Erreur serveur";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}