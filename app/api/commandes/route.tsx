import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Produit = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
};

// Helper : récupérer le panier depuis le cookie
function getPanier(): Produit[] {
    const cookieStore = cookies() as any;
    const cookie = cookieStore.get("panier")?.value;
    if (!cookie) return [];
    try {
        return JSON.parse(cookie);
    } catch {
        return [];
    }
}

// GET : récupérer le panier
export async function GET() {
    const panier = getPanier();
    return NextResponse.json(panier);
}

// POST : ajouter ou modifier un produit
export async function POST(req: Request) {
    const cookieStore = cookies() as any;
    const panier = getPanier();

    try {
        const data: Produit = await req.json();
        const { id, produit, quantite, prix } = data;

        if (!id || !produit || quantite <= 0 || prix < 0) {
            return NextResponse.json({ success: false, message: "Produit invalide" }, { status: 400 });
        }

        // max bouteilles pour certains produits
        const max = produit.toLowerCase().includes("champagne") || produit.toLowerCase().includes("rosé") ? 180 : produit.toLowerCase().includes("carte cadeau") ? 10 : 999;
        const q = Math.min(quantite, max);

        const index = panier.findIndex((p) => p.id === id);
        if (index !== -1) {
            panier[index].quantite = q;
            panier[index].prix = prix;
        } else {
            panier.push({ id, produit, quantite: q, prix });
        }

        cookieStore.set("panier", JSON.stringify(panier), { path: "/" });

        return NextResponse.json({ success: true, panier });
    } catch (err) {
        console.error("Erreur POST /api/commandes :", err);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}

// DELETE : supprimer un produit ou reset complet
export async function DELETE(req?: Request) {
    const cookieStore = cookies() as any;

    if (req) {
        // suppression d'un produit spécifique
        try {
            const { id } = await req.json();
            const panier = getPanier();
            const newPanier = panier.filter((p) => p.id !== id);
            cookieStore.set("panier", JSON.stringify(newPanier), { path: "/" });
            return NextResponse.json({ success: true, panier: newPanier });
        } catch (err) {
            console.error("Erreur DELETE /api/commandes :", err);
            return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
        }
    } else {
        // reset complet
        cookieStore.delete("panier", { path: "/" });
        return NextResponse.json({ success: true, panier: [] });
    }
}
