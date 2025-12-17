import { NextResponse } from "next/server";

// Panier global (en mémoire)
let panier: { id: string; produit: string; quantite: number; prix: number }[] = [];

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { id, produit, quantite, prix } = data;

        if (!produit || quantite <= 0 || prix < 0) {
            return NextResponse.json({ success: false, message: "Produit invalide" }, { status: 400 });
        }

        // Vérifier si le produit existe déjà
        const index = panier.findIndex((p) => p.id === id);
        if (index !== -1) {
            panier[index].quantite += quantite;
            panier[index].prix = prix;
        } else {
            panier.push({ id, produit, quantite, prix });
        }

        const message =
            produit === "Carte cadeau"
                ? `Carte cadeau de ${prix}€ ajoutée au panier`
                : `${produit} ajouté au panier`;

        return NextResponse.json({ success: true, message, panier });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json(panier);
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        panier = panier.filter((p) => p.id !== id);
        return NextResponse.json({ success: true, panier });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}
