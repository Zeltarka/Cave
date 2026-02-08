// app/api/admin/commandes/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Récupérer toutes les commandes avec leurs lignes
        const { data: commandes, error: commandesError } = await supabaseAdmin
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
            .order("created_at", { ascending: false });

        if (commandesError) {
            console.error("❌ Erreur Supabase:", commandesError);
            return NextResponse.json(
                { error: "Erreur lors de la récupération des commandes" },
                { status: 500 }
            );
        }

        // Formater les données pour correspondre à l'ancien format Prisma
        const commandesFormatted = commandes.map(cmd => ({
            id: cmd.id,
            nom: cmd.nom,
            prenom: cmd.prenom,
            email: cmd.email,
            telephone: cmd.telephone,
            adresse: cmd.adresse,
            ville: cmd.ville,
            codepostal: cmd.codepostal,
            modeLivraison: cmd.mode_livraison,
            modePaiement: cmd.mode_paiement,
            datePassage: cmd.date_passage,
            commentaires: cmd.commentaires,
            total: cmd.total,
            statut: cmd.statut,
            noteAdmin: cmd.note_admin,
            createdAt: cmd.created_at,
            updatedAt: cmd.updated_at,
            payeeAt: cmd.payee_at,
            livreeAt: cmd.livree_at,
            // Transformer lignes_commande en format "panier"
            panier: cmd.lignes_commande.map((ligne: any) => ({
                id: ligne.produit_id,
                produit: ligne.nom_produit,
                quantite: ligne.quantite,
                prix: ligne.prix_unitaire,
                destinataire: ligne.destinataire,
            })),
        }));

        return NextResponse.json(commandesFormatted);
    } catch (error) {
        console.error("❌ Erreur liste commandes:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}