import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const data = await request.json();
    const { name, montant } = data;

    console.log(" Données reçues :", { name, montant });


    return NextResponse.json({
        success: true,
        message: `Carte cadeau enregistrée pour ${name} (${montant}€)`,
        data,
    });
}