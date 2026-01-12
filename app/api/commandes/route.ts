import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
};

export async function GET() {
    const cookieStore = await cookies();
    const panier = cookieStore.get("panier");

    return NextResponse.json(
        panier ? JSON.parse(panier.value) : []
    );
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const { id, produit, quantite, prix } = await req.json();

    if (!id || !produit || !quantite || !prix) {
        return NextResponse.json(
            { success: false, message: "Produit invalide" },
            { status: 400 }
        );
    }

    const panier: ProduitPanier[] = cookieStore.get("panier")
        ? JSON.parse(cookieStore.get("panier")!.value)
        : [];

    const existant = panier.find((p) => p.id === id);

    if (existant) {
        existant.quantite = quantite;
    } else {
        panier.push({ id, produit, quantite, prix });
    }

    cookieStore.set("panier", JSON.stringify(panier), {
        httpOnly: true,
        path: "/",
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const cookieStore = await cookies();
    const { id } = await req.json();

    const panier: ProduitPanier[] = cookieStore.get("panier")
        ? JSON.parse(cookieStore.get("panier")!.value)
        : [];

    cookieStore.set(
        "panier",
        JSON.stringify(panier.filter((p) => p.id !== id)),
        { httpOnly: true, path: "/" }
    );

    return NextResponse.json({ success: true });
}
