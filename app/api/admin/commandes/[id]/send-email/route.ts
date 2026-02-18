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

// Génération PDF carte cadeau
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number,
    idUnique: string
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fs = require("fs");
    const path = require("path");
    let logoImage = null;
    try {
        const logoBytes = fs.readFileSync(path.join(process.cwd(), "public", "boutique.png"));
        logoImage = await pdfDoc.embedPng(logoBytes);
    } catch {}

    const now = new Date();
    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair = rgb(0.95, 0.96, 1);
    const grisClaire = rgb(0.6, 0.6, 0.6);

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
            page.drawText("La Cave La Garenne", {
                x: width / 2 - 160,
                y: height - 120,
                size: 32,
                font: helveticaBold,
                color: bleuPrincipal
            });
        }

        page.drawText("Carte Cadeau", {
            x: width / 2 - 100,
            y: height - 200,
            size: 28,
            font: timesRomanBold,
            color: rgb(0.55, 0.66, 0.72)
        });

        const montantText = `${Math.round(montant)} €`;
        page.drawText(montantText, {
            x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2,
            y: height - 300,
            size: 60,
            font: helveticaBold,
            color: bleuPrincipal
        });

        const benefText = `Offerte à : ${destinataire}`;
        page.drawText(benefText, {
            x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2,
            y: height - 400,
            size: 18,
            font: helvetica,
            color: rgb(0, 0, 0)
        });

        const codeText = `Code : ${idUnique}`;
        page.drawText(codeText, {
            x: (width - helvetica.widthOfTextAtSize(codeText, 10)) / 2,
            y: height - 470,
            size: 10,
            font: helvetica,
            color: grisClaire
        });

        const dateText = `Émise le : ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
        page.drawText(dateText, {
            x: (width - helvetica.widthOfTextAtSize(dateText, 12)) / 2,
            y: height - 500,
            size: 12,
            font: helvetica,
            color: grisClaire
        });

        if (quantite > 1) {
            const numText = `Carte ${i} / ${quantite}`;
            page.drawText(numText, {
                x: (width - helveticaBold.widthOfTextAtSize(numText, 14)) / 2,
                y: height - 530,
                size: 14,
                font: helveticaBold,
                color: bleuPrincipal
            });
        }

        const infos = [
            "La Cave La Garenne",
            "3 rue Voltaire, 92250 La Garenne-Colombes",
            "Tél : 01 47 84 57 63",
            "boutique@lacavelagarenne.fr"
        ];
        let yPos = 200;
        infos.forEach(info => {
            page.drawText(info, {
                x: (width - helvetica.widthOfTextAtSize(info, 10)) / 2,
                y: yPos,
                size: 10,
                font: helvetica,
                color: grisClaire
            });
            yPos -= 20;
        });

        const conditions = "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.";
        let condY = 90;
        let currentLine = "";
        conditions.split(" ").forEach(word => {
            const test = currentLine + (currentLine ? " " : "") + word;
            if (helvetica.widthOfTextAtSize(test, 8) > width - 200) {
                page.drawText(currentLine, {
                    x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2,
                    y: condY,
                    size: 8,
                    font: helvetica,
                    color: grisClaire
                });
                condY -= 12;
                currentLine = word;
            } else {
                currentLine = test;
            }
        });
        if (currentLine) {
            page.drawText(currentLine, {
                x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2,
                y: condY,
                size: 8,
                font: helvetica,
                color: grisClaire
            });
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
            return NextResponse.json(
                { error: "Paramètres manquants" },
                { status: 400 }
            );
        }

        console.log(`📧 Envoi carte cadeau - Ligne: ${ligneId}, Email: ${emailDestinataire}`);

        // Récupérer la ligne de commande avec la commande associée
        const { data: ligne, error: ligneError } = await supabaseAdmin
            .from("lignes_commande")
            .select(`
                *,
                commandes (
                    id,
                    nom,
                    prenom,
                    email,
                    statut
                )
            `)
            .eq("id", ligneId)
            .single();

        if (ligneError || !ligne) {
            console.error("❌ Ligne non trouvée:", ligneError);
            return NextResponse.json(
                { error: "Ligne de commande non trouvée" },
                { status: 404 }
            );
        }

        // Vérifier que c'est bien une carte cadeau
        if (!ligne.carte_cadeau_id) {
            return NextResponse.json(
                { error: "Cette ligne n'est pas une carte cadeau" },
                { status: 400 }
            );
        }

        // Vérifier que la carte n'a pas déjà été envoyée
        if (ligne.carte_envoyee) {
            return NextResponse.json(
                { error: "Cette carte a déjà été envoyée" },
                { status: 400 }
            );
        }

        const commande = Array.isArray(ligne.commandes) ? ligne.commandes[0] : ligne.commandes;

        // Vérifier configuration SMTP
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            console.error("❌ Configuration SMTP manquante");
            return NextResponse.json({
                error: "Configuration email manquante"
            }, { status: 500 });
        }

        // Générer le PDF
        const destinataire = ligne.destinataire || `${commande.prenom} ${commande.nom}`;
        const montant = Number(ligne.prix_unitaire);
        const quantite = ligne.quantite;
        const idUnique = ligne.carte_cadeau_id;

        console.log(`📄 Génération PDF pour: ${destinataire}, montant: ${montant}€`);
        const pdfBuffer = await generateCarteCadeauPDF(destinataire, montant, quantite, idUnique);

        // Configuration transporteur
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        // Logo
        const fs = require("fs");
        const path = require("path");
        let logoAttachment: any = null;
        try {
            logoAttachment = {
                filename: "logo.png",
                content: fs.readFileSync(path.join(process.cwd(), "public", "boutique.png")),
                cid: "logo@boutique",
            };
        } catch {}

        // Email
        const mailOptions: any = {
            from: `"La Cave La Garenne" <${SMTP_USER}>`,
            to: emailDestinataire,
            subject: `Votre carte cadeau La Cave La Garenne`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:30px;border-radius:15px;">
                ${logoAttachment ? `<div style="text-align:center;margin-bottom:20px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width:250px;"/></div>` : ""}

                <div style="background:#24586f;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                    <h2 style="color:#fff;margin:0;">Votre carte cadeau est prête !</h2>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                    <p style="color:#333;font-size:16px;margin:0 0 15px;">Bonjour,</p>
                    <p style="color:#333;margin:0 0 15px;">Votre carte cadeau de <strong>${Math.round(montant)} €</strong> est en pièce jointe de cet email.</p>
                    <p style="color:#333;margin:0;">Vous pouvez l'utiliser en boutique dès maintenant !</p>
                </div>

                <div style="background:#e8f5e9;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #4caf50;border-left:6px solid #4caf50;">
                    <p style="margin:0;color:#2e7d32;font-size:16px;"><strong>📎 Votre carte cadeau est en pièce jointe</strong></p>
                    <p style="margin:10px 0 0;color:#2e7d32;font-size:14px;">Code : ${idUnique}</p>
                </div>

                <hr style="border:none;border-top:2px solid #8ba9b7;margin:30px 0;">

                <div style="background:#fff;padding:20px;border-radius:12px;text-align:center;border:2px solid #24586f;">
                    <h3 style="color:#24586f;margin:0 0 15px;">La Cave La Garenne</h3>
                    <p style="margin:5px 0;color:#666;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
                    <p style="margin:5px 0;color:#666;">Tél : 01 47 84 57 63</p>
                    <p style="margin:5px 0;color:#666;">boutique@lacavelagarenne.fr</p>
                </div>
            </div>`,
            attachments: [
                {
                    filename: `CarteCadeau_${Math.round(montant)}EUR_${destinataire.replace(/\s+/g, "_")}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                }
            ]
        };

        if (logoAttachment) {
            mailOptions.attachments.unshift(logoAttachment);
        }

        // Envoyer l'email
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé à ${emailDestinataire}`);

        // Marquer comme envoyée
        const { error: updateError } = await supabaseAdmin
            .from("lignes_commande")
            .update({ carte_envoyee: true })
            .eq("id", ligneId);

        if (updateError) {
            console.error("⚠️ Erreur mise à jour carte_envoyee:", updateError);
        }

        return NextResponse.json({
            success: true,
            message: `Carte envoyée à ${emailDestinataire}`
        });

    } catch (error) {
        console.error("❌ Erreur envoi carte:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'envoi de la carte" },
            { status: 500 }
        );
    }
}