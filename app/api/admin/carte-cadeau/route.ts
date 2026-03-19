// app/api/admin/carte-cadeau/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";
import { generateCarteCadeauId } from "@/lib/carte-cadeau-utils";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CarteLigne = {
    destinataire: string;
    montant: number;
    emailDestinataire?: string | null;
};

async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    idCarte: string,
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

    const page          = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: 0, width, height, color: bleuClair });
    page.drawRectangle({ x: 50, y: 50, width: width - 100, height: height - 100, borderColor: bleuPrincipal, borderWidth: 3 });

    if (logoImage) {
        const logoWidth = 160;
        page.drawImage(logoImage, {
            x: (width - logoWidth) / 2, y: height - 140,
            width: logoWidth,
            height: (logoImage.height / logoImage.width) * logoWidth,
        });
    } else {
        page.drawText("La Cave La Garenne", { x: width / 2 - 160, y: height - 120, size: 32, font: helveticaBold, color: bleuPrincipal });
    }

    page.drawText("Carte Cadeau", { x: width / 2 - 100, y: height - 200, size: 28, font: timesRomanBold, color: rgb(0.55, 0.66, 0.72) });

    // Montant en entier
    const montantText = `${Math.round(montant)} €`;
    page.drawText(montantText, { x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2, y: height - 300, size: 60, font: helveticaBold, color: bleuPrincipal });

    const benefText = `Offerte à : ${destinataire}`;
    page.drawText(benefText, { x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2, y: height - 400, size: 18, font: helvetica, color: rgb(0, 0, 0) });

    const codeText = `Code : ${idCarte}`;
    page.drawText(codeText, { x: (width - helvetica.widthOfTextAtSize(codeText, 9)) / 2, y: height - 470, size: 9, font: helvetica, color: grisClaire });

    const dateText = `Émise le : ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    page.drawText(dateText, { x: (width - helvetica.widthOfTextAtSize(dateText, 12)) / 2, y: height - 500, size: 12, font: helvetica, color: grisClaire });

    const infos = ["La Cave La Garenne", "3 rue Voltaire, 92250 La Garenne-Colombes", "Tél : 01 47 84 57 63", "boutique@lacavelagarenne.fr"];
    let yPos = 200;
    infos.forEach(info => {
        page.drawText(info, { x: (width - helvetica.widthOfTextAtSize(info, 10)) / 2, y: yPos, size: 10, font: helvetica, color: grisClaire });
        yPos -= 20;
    });

    const conditions = "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.";
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

    return Buffer.from(await pdfDoc.save());
}

export async function POST(req: Request) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            cartes,
            nomAcheteur,
            prenomAcheteur,
            emailAcheteur,
            envoyerEmailAcheteur,
            commentaire,
        }: {
            cartes: CarteLigne[];
            nomAcheteur?: string;
            prenomAcheteur?: string;
            emailAcheteur?: string;
            envoyerEmailAcheteur?: boolean;
            commentaire?: string;
        } = body;

        if (!Array.isArray(cartes) || cartes.length === 0) {
            return NextResponse.json({ success: false, message: "Aucune carte à créer" }, { status: 400 });
        }
        for (const carte of cartes) {
            if (!carte.destinataire?.trim()) {
                return NextResponse.json({ success: false, message: "Chaque carte doit avoir un destinataire" }, { status: 400 });
            }
            const montantEntier = Math.round(Number(carte.montant));
            if (!carte.montant || isNaN(montantEntier) || montantEntier < 10) {
                return NextResponse.json({ success: false, message: `Montant invalide pour ${carte.destinataire} (minimum 10€)` }, { status: 400 });
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const now        = new Date();
        const nomCmd     = nomAcheteur    || "Admin";
        const prenomCmd  = prenomAcheteur || "Boutique";
        const emailCmd   = emailAcheteur  || process.env.VENDEUR_EMAIL || "boutique@lacavelagarenne.fr";

        // Forcer les montants en entiers
        const cartesAvecId = cartes.map(c => ({
            ...c,
            montant: Math.round(Number(c.montant)),
            idCarte: generateCarteCadeauId(c.destinataire.trim(), Math.round(Number(c.montant))),
        }));

        const total = cartesAvecId.reduce((sum, c) => sum + c.montant, 0);

        // ── 1. Insertion BDD ──
        let commandeId: string | number = `CC-ADMIN-${Date.now()}`;
        try {
            const { data: commande, error: errCommande } = await supabaseAdmin
                .from("commandes")
                .insert({
                    nom:            nomCmd,
                    prenom:         prenomCmd,
                    email:          emailCmd,
                    mode_livraison: "retrait",
                    mode_paiement:  "boutique",
                    commentaires:   commentaire || null,
                    total,
                    frais_port:     0,
                    statut:         "payee",
                    source:         "boutique_admin",
                })
                .select("id")
                .single();

            if (errCommande) throw new Error(`Erreur BDD commande: ${errCommande.message}`);
            if (!commande)   throw new Error("Aucune commande créée");

            commandeId = commande.id;

            const lignes = cartesAvecId.map(c => ({
                commande_id:     commandeId,
                produit_id:      c.idCarte,
                nom_produit:     `Carte cadeau ${c.montant} €`,
                quantite:        1,
                prix_unitaire:   c.montant,
                destinataire:    c.destinataire.trim(),
                carte_cadeau_id: c.idCarte,
            }));

            const { error: errLignes } = await supabaseAdmin.from("lignes_commande").insert(lignes);
            if (errLignes) throw new Error(`Erreur BDD lignes: ${errLignes.message}`);

        } catch (dbErr) {
            console.error("Erreur critique BDD:", dbErr);
            return NextResponse.json({
                success: false,
                message: dbErr instanceof Error ? dbErr.message : "Erreur base de données"
            }, { status: 500 });
        }

        // ── 2. Génération PDFs ──
        type PdfEntry = { carte: typeof cartesAvecId[0]; buffer: Buffer; filename: string };
        const pdfs: PdfEntry[] = [];

        for (const carte of cartesAvecId) {
            try {
                const buffer   = await generateCarteCadeauPDF(carte.destinataire.trim(), carte.montant, carte.idCarte);
                const filename = `${carte.idCarte}.pdf`;
                pdfs.push({ carte, buffer, filename });
            } catch (pdfErr) {
                console.error(`Erreur PDF pour ${carte.destinataire}:`, pdfErr);
            }
        }

        // ── 3. Envoi emails ──
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL } = process.env;

        if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && VENDEUR_EMAIL) {
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

            const allPdfAttachments = pdfs.map(p => ({
                filename:    p.filename,
                content:     p.buffer,
                contentType: "application/pdf",
            }));
            const allAttachments = logoAttachment ? [...allPdfAttachments, logoAttachment] : allPdfAttachments;

            const cartesHtml = cartesAvecId.map(c =>
                `<li>${c.destinataire} — <strong>${c.montant} €</strong>
                 <br/><span style="color:#999;font-size:11px;">Code : ${c.idCarte}</span>
                 ${c.emailDestinataire ? `<br/><span style="color:#666;font-size:12px;">(envoyée à ${c.emailDestinataire})</span>` : ""}
                 </li>`
            ).join("");

            // Email vendeur
            try {
                await transporter.sendMail({
                    from:        `"La Cave La Garenne" <${SMTP_USER}>`,
                    to:          VENDEUR_EMAIL,
                    subject:     `${cartes.length} carte${cartes.length > 1 ? "s" : ""} cadeau — Commande #${commandeId}`,
                    attachments: allAttachments,
                    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="color:#24586f;">Carte${cartes.length > 1 ? "s" : ""} cadeau créée${cartes.length > 1 ? "s" : ""} depuis l'admin</h2>
    <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;margin:16px 0;">
        <p style="margin:5px 0;"><strong>Commande :</strong> #${commandeId}</p>
        ${nomAcheteur || prenomAcheteur ? `<p style="margin:5px 0;"><strong>Acheteur :</strong> ${prenomCmd} ${nomCmd}</p>` : ""}
        ${emailAcheteur ? `<p style="margin:5px 0;"><strong>Email acheteur :</strong> ${emailAcheteur}</p>` : ""}
    </div>
    <ul style="line-height:2;color:#333;padding-left:20px;">${cartesHtml}</ul>
    <div style="border-left:4px solid #24586f;padding:12px 16px;margin:16px 0;">
        <p style="font-size:18px;font-weight:bold;color:#24586f;margin:0;">Total : ${total} €</p>
    </div>
    ${commentaire ? `<div style="border-left:4px solid #24586f;padding:12px 16px;margin:16px 0;"><p style="margin:0;"><strong>Commentaire :</strong> ${commentaire}</p></div>` : ""}
    <p style="color:#666;font-size:13px;">${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — Statut : Payée | Retrait boutique</p>
</div>`,
                });
            } catch (emailErr) {
                console.error("Erreur email vendeur:", emailErr);
            }

            // Email acheteur (si demandé)
            if (envoyerEmailAcheteur === true && emailAcheteur?.trim() && emailRegex.test(emailAcheteur.trim())) {
                try {
                    await transporter.sendMail({
                        from:        `"La Cave La Garenne" <${SMTP_USER}>`,
                        to:          emailAcheteur.trim(),
                        subject:     `Vos cartes cadeau La Cave La Garenne`,
                        attachments: allAttachments,
                        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
    ${logoAttachment ? `<div style="text-align:center;margin-bottom:24px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="width:120px;height:auto;"/></div>` : ""}
    <div style="background:#24586f;padding:24px;border-radius:8px;margin-bottom:24px;text-align:center;">
        <h2 style="color:#fff;margin:0;font-size:20px;">Vos cartes cadeau</h2>
        <p style="color:#d4e6ed;margin:8px 0 0;font-size:14px;">${prenomCmd} ${nomCmd}</p>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <ul style="line-height:2;color:#333;margin:0;padding-left:20px;">${cartesHtml}</ul>
        <div style="border-left:4px solid #24586f;padding:12px 16px;margin-top:16px;">
            <p style="font-size:18px;font-weight:bold;color:#24586f;margin:0;">Total : ${total} €</p>
        </div>
    </div>
    <p style="text-align:center;color:#555;font-size:14px;">Les PDFs de vos cartes cadeau sont en pièce jointe.</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
    <div style="text-align:center;">
        <p style="font-weight:600;color:#24586f;margin:0 0 6px;">La Cave La Garenne</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">Tél : 01 47 84 57 63</p>
    </div>
</div>`,
                    });
                } catch (emailErr) {
                    console.error("Erreur email acheteur:", emailErr);
                }
            }

            // Email à chaque destinataire individuel
            for (const { carte, buffer, filename } of pdfs) {
                if (!carte.emailDestinataire?.trim()) continue;
                if (!emailRegex.test(carte.emailDestinataire.trim())) continue;
                try {
                    const attachments: any[] = [{ filename, content: buffer, contentType: "application/pdf" }];
                    if (logoAttachment) attachments.push(logoAttachment);

                    await transporter.sendMail({
                        from:    `"La Cave La Garenne" <${SMTP_USER}>`,
                        to:      carte.emailDestinataire.trim(),
                        subject: `Vous avez reçu une carte cadeau La Cave La Garenne`,
                        attachments,
                        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
    ${logoAttachment ? `<div style="text-align:center;margin-bottom:24px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="width:120px;height:auto;"/></div>` : ""}
    <div style="background:#24586f;padding:24px;border-radius:8px;margin-bottom:24px;text-align:center;">
        <h2 style="color:#fff;margin:0;font-size:20px;">Vous avez reçu une carte cadeau !</h2>
        <p style="color:#d4e6ed;margin:8px 0 0;font-size:14px;">${carte.destinataire}</p>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;text-align:center;">
        <p style="font-size:52px;font-weight:bold;color:#24586f;margin:0;">${carte.montant} €</p>
        <p style="color:#666;margin-top:10px;">à utiliser en boutique</p>
    </div>
    <div style="border-left:4px solid #24586f;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#333;font-size:15px;font-weight:600;">Votre carte cadeau est en pièce jointe de cet email.</p>
        <p style="margin:8px 0 0;color:#555;font-size:13px;">Code : ${carte.idCarte}</p>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
    <div style="text-align:center;">
        <p style="font-weight:600;color:#24586f;margin:0 0 6px;">La Cave La Garenne</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">Tél : 01 47 84 57 63</p>
    </div>
</div>`,
                    });
                } catch (emailErr) {
                    console.error(`Erreur email ${carte.emailDestinataire}:`, emailErr);
                }
            }
        }

        return NextResponse.json({ success: true, commandeId });

    } catch (err) {
        console.error("Erreur création carte cadeau admin:", err);
        return NextResponse.json({
            success: false,
            message: err instanceof Error ? err.message : "Erreur lors de la création"
        }, { status: 500 });
    }
}