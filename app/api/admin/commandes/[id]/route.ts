// app/api/admin/commandes/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CommandeBody {
    statut?: string;
    noteAdmin?: string;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;
    try {
        const { id } = await params;
        console.log("🔍 Récupération commande ID:", id);

        // Récupérer la commande avec ses lignes
        const { data: commande, error: commandeError } = await supabaseAdmin
            .from("commandes")
            .select(`
                *,
                lignes_commande (
                    id,
                    produit_id,
                    nom_produit,
                    quantite,
                    prix_unitaire,
                    destinataire
                )
            `)
            .eq("id", id)
            .single();

        if (commandeError) {
            console.error("❌ Erreur Supabase:", commandeError);
            if (commandeError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Commande non trouvée" },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: "Erreur serveur" },
                { status: 500 }
            );
        }

        console.log("📦 Données brutes Supabase:", {
            nom: commande.nom,
            prenom: commande.prenom,
            email: commande.email,
            statut: commande.statut,
            frais_port: commande.frais_port,
        });

        // Formater les données
        const commandeFormatted = {
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
            panier: (commande.lignes_commande || []).map((ligne: any) => ({
                id: ligne.produit_id,
                produit: ligne.nom_produit,
                quantite: ligne.quantite,
                prix: Number(ligne.prix_unitaire),
                destinataire: ligne.destinataire || null,
            })),
        };

        console.log("✅ Commande formatée:", {
            id: commandeFormatted.id,
            statut: commandeFormatted.statut,
            total: commandeFormatted.total,
            fraisPort: commandeFormatted.fraisPort,
        });

        return NextResponse.json(commandeFormatted);
    } catch (error) {
        console.error("❌ Erreur détail commande:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
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
        console.log("✏️ Mise à jour commande ID:", id);

        const body: CommandeBody = await req.json();
        console.log("📝 Body reçu:", body);

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (body.statut) {
            // ✅ Mise à jour du statut uniquement
            updateData.statut = body.statut;
            console.log("📊 Statut à mettre à jour:", body.statut);
        }

        if (body.noteAdmin !== undefined) {
            updateData.note_admin = body.noteAdmin;
        }

        console.log("📤 Données à mettre à jour:", updateData);

        // Mettre à jour la commande
        const { data: commande, error: updateError } = await supabaseAdmin
            .from("commandes")
            .update(updateData)
            .eq("id", id)
            .select(`
                *,
                lignes_commande (
                    id,
                    produit_id,
                    nom_produit,
                    quantite,
                    prix_unitaire,
                    destinataire
                )
            `)
            .single();

        if (updateError) {
            console.error("❌ Erreur mise à jour:", updateError);
            return NextResponse.json(
                { error: `Erreur lors de la mise à jour: ${updateError.message}` },
                { status: 500 }
            );
        }

        if (!commande) {
            console.error("❌ Aucune commande retournée après mise à jour");
            return NextResponse.json(
                { error: "Commande non trouvée après mise à jour" },
                { status: 404 }
            );
        }

        // Formater les données
        const commandeFormatted = {
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
            panier: (commande.lignes_commande || []).map((ligne: any) => ({
                id: ligne.produit_id,
                produit: ligne.nom_produit,
                quantite: ligne.quantite,
                prix: Number(ligne.prix_unitaire),
                destinataire: ligne.destinataire || null,
            })),
        };

        console.log("✅ Commande mise à jour:", {
            id: commandeFormatted.id,
            nouveau_statut: commandeFormatted.statut,
        });

        return NextResponse.json(commandeFormatted);
    } catch (error) {
        console.error("❌ Erreur modification commande:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}