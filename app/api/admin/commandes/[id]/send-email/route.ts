// app/api/admin/carte-cadeau/envoyer/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getMessages(): Promise<any> {
    try {
        const { data } = await supabaseAdmin
            .from("contenu")
            .select("contenu")
            .eq("page", "messages")
            .single();
        return data?.contenu || {};
    } catch {
        return {};
    }
}

function m(msg: any, path: string, fallback: string): string {
    const keys = path.split(".");
    let val: any = msg;
    for (const k of keys) val = val?.[k];
    return typeof val === "string" && val ? val : fallback;
}

async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number,
    idUnique: string,
    conditions: string
): Promise<Buffer> {
    const pdfDoc         = await PDFDocument.create();
    const helveticaBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica      = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fs   = require("fs");
    const path = require("path");
    let logoImage = null;
    try {
        const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "boutique.png"));
        logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {}

    const now           = new Date();
    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair     = rgb(0.95, 0.96, 1);
    const grisClaire    = rgb(0.6, 0.6, 0.6);

    for (let i = 1; i <= quantite; i++) {
        const page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();

        page.drawRectangle({ x: 0, y: 0, width, height, color: bleuClair });
        page.drawRectangle({ x: 50, y: 50, width: width - 100, height: height - 100, borderColor: bleuPrincipal, borderWidth: 3 });

        if (logoImage) {
            const logoWidth = 200;
            page.drawImage(logoImage, {
                x: (width - logoWidth) / 2,
                y: height - 140,
                width: logoWidth,
                height: (logoImage.height / logoImage.width) * logoWidth,
            });
        } else {
            page.drawText("La Cave La Garenne", { x: width / 2 - 160, y: height - 120, size: 32, font: helveticaBold, color: bleuPrincipal });
        }

        page.drawText("Carte Cadeau", { x: width / 2 - 100, y: height - 200, size: 28, font: timesRomanBold, color: rgb(0.55, 0.66, 0.72) });

        const montantText = `${Math.round(montant)} €`;
        page.drawText(montantText, { x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2, y: height - 300, size: 60, font: helveticaBold, color: bleuPrincipal });

        const benefText = `Offerte à : ${destinataire}`;
        page.drawText(benefText, { x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2, y: height - 400, size: 18, font: helvetica, color: rgb(0, 0, 0) });

        const codeText = `Code : ${idUnique}`;
        page.drawText(codeText, { x: (width - helvetica.widthOfTextAtSize(codeText, 9)) / 2, y: height - 470, size: 9, font: helvetica, color: grisClaire });

        const dateText = `Émise le : ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
        page.drawText(dateText, { x: (width - helvetica.widthOfTextAtSize(dateText, 12)) / 2, y: height - 500, size: 12, font: helvetica, color: grisClaire });

        if (quantite > 1) {
            const numText = `Carte ${i} / ${quantite}`;
            page.drawText(numText, { x: (width - helveticaBold.widthOfTextAtSize(numText, 14)) / 2, y: height - 530, size: 14, font: helveticaBold, color: bleuPrincipal });
        }

        const infos = ["La Cave La Garenne", "3 rue Voltaire, 92250 La Garenne-Colombes", "Tél : 01 47 84 57 63", "boutique@lacavelagarenne.fr"];
        let yPos = 200;
        infos.forEach(info => {
            page.drawText(info, { x: (width - helvetica.widthOfTextAtSize(info, 10)) / 2, y: yPos, size: 10, font: helvetica, color: grisClaire });
            yPos -= 20;
        });

        let condY = 90;
        let currentLine = "";
        conditions.split(" ").forEach(word => {
            const test = currentLine + (currentLine ? " " : "") + word;
            if (helvetica.widthOfTextAtSize(test, 8) > width - 200) {
                page.drawText(currentLine, { x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2, y: condY, size: 8, font: helvetica, color: grisClaire });
                condY -= 12;
                currentLine = word;
            } else {
                currentLine = test;
            }
        });
        if (currentLine) {
            page.drawText(currentLine, { x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2, y: condY, size: 8, font: helvetica, color: grisClaire });
        }
    }

    return Buffer.from(await pdfDoc.save());
}

export async function POST(req: NextRequest) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { ligneId, emailDestinataire } = await req.json();

        if (!ligneId || !emailDestinataire) {
            return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
        }

        const msg = await getMessages();
        const conditions = m(msg, "email.carte_cadeau_conditions", "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.");

        const { data: ligne, error: ligneError } = await supabaseAdmin
            .from("lignes_commande")
            .select(`*, commandes (id, nom, prenom, email, statut)`)
            .eq("id", ligneId)
            .single();

        if (ligneError || !ligne) {
            return NextResponse.json({ error: "Ligne de commande non trouvée" }, { status: 404 });
        }

        if (!ligne.carte_cadeau_id) {
            return NextResponse.json({ error: "Cette ligne n'est pas une carte cadeau" }, { status: 400 });
        }

        // Renvoi autorisé — on ne bloque plus sur carte_envoyee

        const commande = Array.isArray(ligne.commandes) ? ligne.commandes[0] : ligne.commandes;

        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            return NextResponse.json({ error: "Configuration email manquante" }, { status: 500 });
        }

        const destinataire = ligne.destinataire || `${commande.prenom} ${commande.nom}`;
        const montant      = Number(ligne.prix_unitaire);
        const quantite     = ligne.quantite;
        const idUnique     = ligne.carte_cadeau_id;

        const pdfBuffer = await generateCarteCadeauPDF(destinataire, montant, quantite, idUnique, conditions);

        const transporter = nodemailer.createTransport({
            host:   SMTP_HOST,
            port:   Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth:   { user: SMTP_USER, pass: SMTP_PASS },
        });

        const fs   = require("fs");
        const path = require("path");
        let logoAttachment: any = null;
        try {
            logoAttachment = {
                filename: "logo.png",
                content:  fs.readFileSync(path.join(process.cwd(), "public", "boutique.png")),
                cid:      "logo@boutique",
            };
        } catch {}

        const cartePjMsg = m(msg, "email.carte_cadeau_pj", "Votre carte cadeau est en pièce jointe de cet email.");

        const mailOptions: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      emailDestinataire,
            subject: `Votre carte cadeau La Cave La Garenne`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">

    ${logoAttachment ? `<div style="text-align:center;margin-bottom:24px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="width:120px;height:auto;"/></div>` : ""}

    <div style="background:#24586f;padding:24px;border-radius:8px;margin-bottom:24px;text-align:center;">
        <h2 style="color:#fff;margin:0;font-size:20px;">Votre carte cadeau est prête</h2>
    </div>

    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <p style="color:#333;font-size:15px;margin:0 0 12px;">Bonjour,</p>
        <p style="color:#333;margin:0 0 12px;">Votre carte cadeau de <strong>${Math.round(montant)} €</strong> est en pièce jointe de cet email.</p>
        <p style="color:#333;margin:0;">Vous pouvez la partager au destinataire dès maintenant.</p>
    </div>

    <div style="border-left:4px solid #24586f;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#333;font-size:15px;font-weight:600;">${cartePjMsg}</p>
        <p style="margin:8px 0 0;color:#555;font-size:13px;">Code : ${idUnique}</p>
    </div>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

    <div style="text-align:center;">
        <p style="font-weight:600;color:#24586f;margin:0 0 6px;">La Cave La Garenne</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">Tél : 01 47 84 57 63</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">boutique@lacavelagarenne.fr</p>
    </div>

</div>`,
            attachments: [
                {
                    filename:    `CarteCadeau_${Math.round(montant)}EUR_${destinataire.replace(/\s+/g, "_")}.pdf`,
                    content:     pdfBuffer,
                    contentType: "application/pdf",
                }
            ],
        };

        if (logoAttachment) mailOptions.attachments.unshift(logoAttachment);

        await transporter.sendMail(mailOptions);
        console.log(`Email carte cadeau envoyé à ${emailDestinataire}`);

        // Marquer comme envoyée (idempotent, pas de blocage au renvoi)
        await supabaseAdmin
            .from("lignes_commande")
            .update({ carte_envoyee: true })
            .eq("id", ligneId);

        return NextResponse.json({ success: true, message: `Carte envoyée à ${emailDestinataire}` });

    } catch (error) {
        console.error("Erreur envoi carte:", error);
        return NextResponse.json({ error: "Erreur lors de l'envoi de la carte" }, { status: 500 });
    }
}