import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        let { client, panier, total } = await req.json();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.verify();

        const lignesPanier = panier
            .map(
                (p: { produit: string; quantite: number; prix: number }) =>
                    `<li>${p.produit || "Produit inconnu"} x ${p.quantite || 0} — ${p.prix && p.quantite ? p.prix * p.quantite : 0} €</li>`
            )
            .join("");

        await transporter.sendMail({
            from: `"Boutique" <${process.env.SMTP_USER}>`,
            to: client.email,
            subject: "Confirmation de votre commande",
            html: `<h2>Merci pour votre commande ${client.prenom} ${client.nom}</h2>
                   <ul>${lignesPanier}</ul>
                   <p>Total : ${total} €<br/></p>
                   <p>RIB: ""<br/></p>
                   <p>Nous vous informons que la commande sera traitée qu'une fois le virement reçu.</p><br/>
                   <h3>La Cave La Garenne</h3>`
        });

        await transporter.sendMail({
            from: `"Boutique" <${process.env.SMTP_USER}>`,
            to: process.env.VENDEUR_EMAIL,
            subject: "Nouvelle commande reçue",
            html: `<h2>Nouvelle commande</h2>
                   <p>Client : ${client.prenom} ${client.nom}</p>
                   <p>Mail : ${client.email}</p>
                   <p>Adresse : ${client.adresse} ${client.codepostal} ${client.ville}</p>
                   <ul>${lignesPanier}</ul>
                   <p>Total : ${total} €</p>`,
        });
        panier = [];

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erreur envoi mail :", err);
        return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
    }
}
