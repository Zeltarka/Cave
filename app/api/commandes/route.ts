import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
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

    const { id, produit, quantite, prix } = body;

    // Vérifie que id et produit existent
    if (!id || !produit) {
        return NextResponse.json({ success: false, message: "Produit invalide" }, { status: 400 });
    }

    // Autorise prix = 0 ou quantite = 0 (utile pour cartes cadeaux ou suppression temporaire)
    const q = quantite ?? 1;
    const p = prix ?? 0;

    const panier: ProduitPanier[] = parseJSONSafe(cookieStore.get("panier")?.value, []);

    const existant = panier.find((p) => p.id === id);

    if (existant) {
        existant.quantite = q;
        existant.prix = p;
    } else {
        panier.push({ id, produit, quantite: q, prix: p });
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
