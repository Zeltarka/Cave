import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Vérifier l'authentification
async function checkAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin-session");
    return !!session;
}

// GET : Récupérer toutes les commandes
export async function GET(req: Request) {
    try {
        const isAuth = await checkAuth();
        if (!isAuth) {
            return NextResponse.json(
                { success: false, message: "Non autorisé" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const statut = searchParams.get("statut");

        const where = statut && statut !== "all" ? { statut } : {};

        const commandes = await prisma.commande.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, commandes });
    } catch (err) {
        console.error("Erreur GET commandes:", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// PATCH : Mettre à jour le statut d'une commande
export async function PATCH(req: Request) {
    try {
        const isAuth = await checkAuth();
        if (!isAuth) {
            return NextResponse.json(
                { success: false, message: "Non autorisé" },
                { status: 401 }
            );
        }

        const { id, statut, notes } = await req.json();

        const data: any = {};
        if (statut) data.statut = statut;
        if (notes !== undefined) data.notes = notes;

        const commande = await prisma.commande.update({
            where: { id },
            data,
        });

        return NextResponse.json({ success: true, commande });
    } catch (err) {
        console.error("Erreur PATCH commande:", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// DELETE : Supprimer une commande
export async function DELETE(req: Request) {
    try {
        const isAuth = await checkAuth();
        if (!isAuth) {
            return NextResponse.json(
                { success: false, message: "Non autorisé" },
                { status: 401 }
            );
        }

        const { id } = await req.json();

        await prisma.commande.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur DELETE commande:", err);
        return NextResponse.json(
            { success: false, message: "Erreur serveur" },
            { status: 500 }
        );
    }
}