import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { client, panier, total } = await req.json();

        // Création transporteur SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Vérification SMTP
        await transporter.verify();
        console.log("SMTP OK");

        // Préparer le contenu du panier en HTML
        type Produit = {
            id: string;
            produit: string;
            quantite: number;
            prix: number;
        };
        const lignesPanier = panier.map((p: Produit) =>
            `<li>${p.produit || "Produit inconnu"} x ${p.quantite || 0} — ${p.prix && p.quantite ? p.prix * p.quantite : 0} €</li>`
        ).join("");

        // --- Mail au client ---
        await transporter.sendMail({
            from: `"Boutique" <${process.env.SMTP_USER}>`,
            to: client.email,
            subject: "Confirmation de votre commande",
            html: `<h2>Merci pour votre commande ${client.prenom} ${client.nom}</h2>
                   <ul>${lignesPanier}</ul>
                   <p>Total : ${total} €</p>
                   <p>RIb:""</p>`

        });

        // --- Mail au vendeur ---
        await transporter.sendMail({
            from: `"Boutique" <${process.env.SMTP_USER}>`,
            to: process.env.VENDEUR_EMAIL,
            subject: "Nouvelle commande reçue",
            html: `<h2>Nouvelle commande</h2>
                   <p>Client : ${client.prenom} ${client.nom}</p>
                   <p>Mail : ${client.email}</p>
                   <p>Adresse : ${client.adresse} ${client.codepostal} ${client.ville}</p>
                   <ul>${lignesPanier}</ul>
                   <p>Total : ${total} €</p>`
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur envoi mail :", err);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}
