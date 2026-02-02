import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string; // Champ optionnel pour les cartes cadeaux
    id_dest?: string; // ID unique pour différencier les cartes cadeaux
};

function parseJSONSafe(value: string | undefined, defaultValue: any) {
    try {
        return value ? JSON.parse(value) : defaultValue;
    } catch {
        return defaultValue;
    }
}

export async function GET() {
    const cookieStore = await cookies();
    const panier = parseJSONSafe(cookieStore.get("panier")?.value, []);
    return NextResponse.json(panier);
}

export async function POST(req: Request) {
    const cookieStore = await cookies();

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: "JSON invalide" }, { status: 400 });
    }

    const { id, produit, quantite, prix, destinataire, id_dest } = body;

    // Vérifie que id et produit existent
    if (!id || !produit) {
        return NextResponse.json({ success: false, message: "Produit invalide" }, { status: 400 });
    }

    // Autorise prix = 0 ou quantite = 0 (utile pour cartes cadeaux ou suppression temporaire)
    const q = quantite ?? 1;
    const p = prix ?? 0;

    const panier: ProduitPanier[] = parseJSONSafe(cookieStore.get("panier")?.value, []);

    // Pour les cartes cadeaux, utiliser id_dest comme identifiant unique, sinon utiliser id
    const identifiantUnique = id_dest || id;
    const existant = panier.find((item) => {
        // Si le produit a un id_dest, comparer avec id_dest, sinon comparer avec id
        if (item.id_dest && id_dest) {
            return item.id_dest === id_dest;
        }
        return item.id === id;
    });

    if (existant) {
        existant.quantite = q;
        existant.prix = p;
        // Mettre à jour le destinataire s'il est fourni
        if (destinataire) {
            existant.destinataire = destinataire;
        }
        if (id_dest) {
            existant.id_dest = id_dest;
        }
    } else {
        const nouveauProduit: ProduitPanier = { id, produit, quantite: q, prix: p };
        // Ajouter le destinataire s'il est fourni
        if (destinataire) {
            nouveauProduit.destinataire = destinataire;
        }
        // Ajouter l'id_dest s'il est fourni (pour les cartes cadeaux)
        if (id_dest) {
            nouveauProduit.id_dest = id_dest;
        }
        panier.push(nouveauProduit);
    }

    cookieStore.set("panier", JSON.stringify(panier), {
        httpOnly: true,
        path: "/",
    });

    return NextResponse.json({ success: true, panier });
}

export async function DELETE(req: Request) {
    const cookieStore = await cookies();

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: "JSON invalide" }, { status: 400 });
    }

    const { id } = body;

    if (!id) {
        return NextResponse.json({ success: false, message: "ID manquant" }, { status: 400 });
    }

    const panier: ProduitPanier[] = parseJSONSafe(cookieStore.get("panier")?.value, []);

    const nouveauPanier = panier.filter((p) => p.id !== id);

    cookieStore.set("panier", JSON.stringify(nouveauPanier), {
        httpOnly: true,
        path: "/",
    });

    return NextResponse.json({ success: true, panier: nouveauPanier });
}