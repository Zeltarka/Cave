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
    const cookieStore = await cookies();
    const cookie = cookieStore.get("panier")?.value;
    if (!cookie) return [];
    try {
        return JSON.parse(decodeURIComponent(cookie));
    } catch {
        return [];
    }
}

// Helper : sauvegarder le panier dans le cookie
async function savePanier(panier: Produit[]) {
    const cookieStore = await cookies();
    const encoded = encodeURIComponent(JSON.stringify(panier));
    cookieStore.set("panier", encoded, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        sameSite: "lax"
    });
}

// GET : récupérer le panier
export async function GET() {
    const panier = await getPanier();
    return NextResponse.json(panier);
}

// POST : ajouter ou modifier un produit
export async function POST(req: Request) {
    try {
        const panier = await getPanier();
        const data: Produit = await req.json();
        const { id, produit, quantite, prix } = data;

        if (!id || !produit || quantite < 0 || prix < 0) {
            return NextResponse.json({
                success: false,
                message: "Produit invalide"
            }, { status: 400 });
        }

        // Quantité 0 = suppression
        if (quantite === 0) {
            const newPanier = panier.filter((p) => p.id !== id);
            await savePanier(newPanier);
            return NextResponse.json({ success: true, panier: newPanier });
        }

        // Max bouteilles pour certains produits
        const max =
            produit.toLowerCase().includes("champagne") || produit.toLowerCase().includes("rosé")
                ? 180
                : produit.toLowerCase().includes("carte cadeau")
                    ? 10
                    : 999;

        const q = Math.min(quantite, max);

        const index = panier.findIndex((p) => p.id === id);
        if (index !== -1) {
            panier[index].quantite = q;
            panier[index].prix = prix;
        } else {
            panier.push({ id, produit, quantite: q, prix });
        }

        await savePanier(panier);

        return NextResponse.json({ success: true, panier });
    } catch (err) {
        console.error("Erreur POST /api/commandes :", err);
        return NextResponse.json({
            success: false,
            message: "Erreur serveur"
        }, { status: 500 });
    }
}

// DELETE : supprimer un produit ou reset complet
export async function DELETE(req: Request) {
    try {
        const body = await req.text();

        if (!body || body.trim() === "") {
            // Reset complet
            const cookieStore = await cookies();
            cookieStore.delete("panier");
            return NextResponse.json({ success: true, panier: [] });
        }

        // Suppression d'un produit spécifique
        const { id } = JSON.parse(body);
        const panier = await getPanier();
        const newPanier = panier.filter((p) => p.id !== id);
        await savePanier(newPanier);

        return NextResponse.json({ success: true, panier: newPanier });
    } catch (err) {
        console.error("Erreur DELETE /api/commandes :", err);
        return NextResponse.json({
            success: false,
            message: "Erreur serveur"
        }, { status: 500 });
    }
}