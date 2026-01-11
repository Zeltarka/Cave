import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { client, panier, total } = body;

        if (!client?.email) {
            return NextResponse.json({ success: false, message: "Client invalide" }, { status: 400 });
        }

        if (!Array.isArray(panier) || panier.length === 0) {
            return NextResponse.json({ success: false, message: "Panier vide" }, { status: 400 });
        }

        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !VENDEUR_EMAIL) {
            console.error("ENV manquante", { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL });
            return NextResponse.json({ success: false, message: "Configuration serveur invalide" }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const lignesPanier = panier
            .map((p: { produit: string; quantite: number; prix: number }) =>
                `<li>${p.produit} x ${p.quantite} — ${(p.prix * p.quantite).toFixed(2)} €</li>`
            )
            .join("");

        // Email client
        await transporter.sendMail({
            from: `"La Cave La Garenne" <${SMTP_USER}>`,
            to: client.email,
            subject: "Confirmation de votre commande",
            html: `<h2>Merci pour votre commande ${client.prenom} ${client.nom}</h2>
             <ul>${lignesPanier}</ul>
             <p><strong>Total : ${total.toFixed(2)} €</strong></p>
             <p>Paiement par virement bancaire : RIB : </p>
             <h3>La Cave La Garenne</h3>
             <p>3 rue Voltaire, 92250 La Garenne-Colombes</p>`,
        });

        // Email vendeur
        await transporter.sendMail({
            from: `"La Cave La Garenne" <${SMTP_USER}>`,
            to: VENDEUR_EMAIL,
            subject: "Nouvelle commande reçue",
            html: `<h2>Nouvelle commande</h2>
             <p><strong>Client :</strong> ${client.prenom} ${client.nom}</p>
             <p><strong>Email :</strong> ${client.email}</p>
             <p><strong>Adresse :</strong> ${client.adresse}, ${client.codepostal} ${client.ville}</p>
             <ul>${lignesPanier}</ul>
             <p><strong>Total : ${total.toFixed(2)} €</strong></p>`,
        });

        // Supprimer le panier après validation
        const cookieStore = await cookies();
        cookieStore.delete("panier");

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("ERREUR API COMMANDE :", err);
        return NextResponse.json({
            success: false,
            message: err instanceof Error ? err.message : "Erreur serveur"
        }, { status: 500 });
    }
}