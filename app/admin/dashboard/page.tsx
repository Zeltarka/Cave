import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Produit = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
};

// Helper : récupérer le panier depuis le cookie
async function getPanier(): Promise<Produit[]> {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get("panier")?.value;
        if (!cookie) return [];

        const decoded = decodeURIComponent(cookie);
        return JSON.parse(decoded);
    } catch (error) {
        console.error("Erreur getPanier:", error);
        return [];
    }
}

// GET : récupérer le panier
export async function GET() {
    try {
        const panier = await getPanier();
        return NextResponse.json(panier);
    } catch (error) {
        console.error("Erreur GET:", error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST : ajouter ou modifier un produit
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const panier = await getPanier();

        const data: Produit = await req.json();
        const { id, produit, quantite, prix } = data;

        // Validation
        if (!id || !produit || quantite <= 0 || prix < 0) {
            return NextResponse.json(
                { success: false, message: "Produit invalide" },
                { status: 400 }
            );
        }

        // Limites de quantité
        let max = 999;
        if (produit.toLowerCase().includes("champagne") || produit.toLowerCase().includes("rosé")) {
            max = 180;
        } else if (produit.toLowerCase().includes("carte cadeau")) {
            max = 50;
        }

        const q = Math.min(quantite, max);

        // Chercher si le produit existe déjà
        const index = panier.findIndex((p) => p.id === id);

        if (index !== -1) {
            // Mise à jour
            panier[index].quantite = q;
            panier[index].prix = prix;
        } else {
            // Ajout
            panier.push({ id, produit, quantite: q, prix });
        }

        // Sauvegarder dans le cookie
        const encoded = encodeURIComponent(JSON.stringify(panier));
        cookieStore.set("panier", encoded, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 jours
            sameSite: "lax"
        });

        return NextResponse.json({ success: true, panier });
    } catch (err) {
        console.error("Erreur POST /api/commandes :", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// DELETE : supprimer un produit ou reset complet
export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const body = await req.text();

        if (body) {
            // Suppression d'un produit spécifique
            const { id } = JSON.parse(body);
            const panier = await getPanier();
            const newPanier = panier.filter((p) => p.id !== id);

            const encoded = encodeURIComponent(JSON.stringify(newPanier));
            cookieStore.set("panier", encoded, {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
                sameSite: "lax"
            });

            return NextResponse.json({ success: true, panier: newPanier });
        } else {
            // Reset complet
            cookieStore.delete("panier");
            return NextResponse.json({ success: true, panier: [] });
        }
    } catch (err) {
        console.error("Erreur DELETE /api/commandes :", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}