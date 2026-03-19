// app/api/admin/commandes/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CommandeBody {
    statut?: string;
    noteAdmin?: string;
}

const SELECT_COMMANDE = `
    *,
    lignes_commande (
        id,
        produit_id,
        nom_produit,
        quantite,
        prix_unitaire,
        destinataire,
        carte_cadeau_id,
        carte_envoyee
    )
`;

function formatCommande(commande: any) {
    return {
        id: commande.id,
        nom: commande.nom || "",
        prenom: commande.prenom || "",
        email: commande.email || "",
        telephone: commande.telephone || "",
        adresse: commande.adresse || "",
        ville: commande.ville || "",
        codepostal: commande.codepostal || "",
        modeLivraison: commande.mode_livraison || "retrait",
        modePaiement: commande.mode_paiement || "virement",
        datePassage: commande.date_passage,
        commentaires: commande.commentaires || "",
        total: Number(commande.total) || 0,
        fraisPort: Number(commande.frais_port) || 0,
        statut: commande.statut || "en_attente",
        noteAdmin: commande.note_admin || "",
        createdAt: commande.created_at,
        updatedAt: commande.updated_at,
        source: commande.source || null,
        panier: (commande.lignes_commande || []).map((ligne: any) => ({
            id: ligne.produit_id,
            produit: ligne.nom_produit,
            quantite: ligne.quantite,
            prix: Number(ligne.prix_unitaire),
            destinataire: ligne.destinataire || null,
            carteCadeauId: ligne.carte_cadeau_id || null,
            ligneId: ligne.id,
            carteEnvoyee: ligne.carte_envoyee || false,
        })),
    };
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        console.log("🔎 Récupération commande ID:", id);

        const { data: commande, error } = await supabaseAdmin
            .from("commandes")
            .select(SELECT_COMMANDE)
            .eq("id", id)
            .single();

        if (error) {
            console.error("❌ Erreur Supabase:", error);
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
            }
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return NextResponse.json(formatCommande(commande));
    } catch (error) {
        console.error("❌ Erreur détail commande:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        console.log("🔄 Mise à jour commande ID:", id);

        const body: CommandeBody = await req.json();
        console.log("📦 Body reçu:", body);

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (body.statut) {
            updateData.statut = body.statut;
            console.log("📝 Statut à mettre à jour:", body.statut);
        }

        if (body.noteAdmin !== undefined) {
            updateData.note_admin = body.noteAdmin;
        }

        const { data: commande, error } = await supabaseAdmin
            .from("commandes")
            .update(updateData)
            .eq("id", id)
            .select(SELECT_COMMANDE)
            .single();

        if (error) {
            console.error("❌ Erreur mise à jour:", error);
            return NextResponse.json(
                { error: `Erreur lors de la mise à jour: ${error.message}` },
                { status: 500 }
            );
        }

        if (!commande) {
            return NextResponse.json(
                { error: "Commande non trouvée après mise à jour" },
                { status: 404 }
            );
        }

        console.log("✅ Commande mise à jour:", { id: commande.id, statut: commande.statut });
        return NextResponse.json(formatCommande(commande));
    } catch (error) {
        console.error("❌ Erreur modification commande:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        console.log("🗑️ Suppression commande ID:", id);

        const { error } = await supabaseAdmin
            .from("commandes")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ Erreur suppression:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Les lignes_commande sont supprimées automatiquement via ON DELETE CASCADE
        console.log("✅ Commande supprimée:", id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Erreur suppression commande:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}