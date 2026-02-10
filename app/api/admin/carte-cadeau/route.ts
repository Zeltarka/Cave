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

// ─── Types ────────────────────────────────────────────────
type CarteLigne = {
    destinataire: string;
    montant: number;
    emailDestinataire?: string | null;
};

// ─── Génération PDF ───────────────────────────────────────
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number
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

    const now = new Date();
    const idUnique = generateCarteCadeauId(destinataire, montant);

    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair     = rgb(0.95, 0.96, 1);
    const grisClaire    = rgb(0.6, 0.6, 0.6);

    const page          = pdfDoc.addPage([595, 842]);
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

    const montantText = `${montant.toFixed(2)} €`;
    page.drawText(montantText, { x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2, y: height - 300, size: 60, font: helveticaBold, color: bleuPrincipal });

    const benefText = `Offerte à : ${destinataire}`;
    page.drawText(benefText, { x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2, y: height - 400, size: 18, font: helvetica, color: rgb(0, 0, 0) });

    const codeText = `Code : ${idUnique}`;
    page.drawText(codeText, { x: (width - helvetica.widthOfTextAtSize(codeText, 10)) / 2, y: height - 470, size: 10, font: helvetica, color: grisClaire });

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

// ─── POST /api/admin/carte-cadeau ─────────────────────────
export async function POST(req: Request) {
    // 🔒 Auth admin obligatoire
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { cartes, nomAcheteur, prenomAcheteur, emailAcheteur, commentaire }:
            {
                cartes: CarteLigne[];
                nomAcheteur?: string;
                prenomAcheteur?: string;
                emailAcheteur?: string;
                commentaire?: string;
            } = body;

        console.log("📦 Création de cartes cadeau admin:", {
            nombreCartes: cartes.length,
            acheteur: `${prenomAcheteur} ${nomAcheteur}`,
            total: cartes.reduce((sum, c) => sum + Number(c.montant), 0)
        });

        // ── Validations ──
        if (!Array.isArray(cartes) || cartes.length === 0) {
            return NextResponse.json({ success: false, message: "Aucune carte à créer" }, { status: 400 });
        }
        for (const carte of cartes) {
            if (!carte.destinataire?.trim()) {
                return NextResponse.json({ success: false, message: "Chaque carte doit avoir un destinataire" }, { status: 400 });
            }
            if (!carte.montant || isNaN(Number(carte.montant)) || Number(carte.montant) < 10) {
                return NextResponse.json({ success: false, message: `Montant invalide pour ${carte.destinataire} (minimum 10€)` }, { status: 400 });
            }
        }

        const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const total       = cartes.reduce((sum, c) => sum + Number(c.montant), 0);
        const now         = new Date();
        const nomCmd      = nomAcheteur?.trim() || "Admin";
        const prenomCmd   = prenomAcheteur?.trim() || "Boutique";
        const emailCmd    = emailAcheteur?.trim() || process.env.VENDEUR_EMAIL || "boutique@lacavelagarenne.fr";

        // ── 1. Insertion en BDD (UNE commande, N lignes) ──
        let commandeId: string | number = `CC-ADMIN-${Date.now()}`;

        try {
            console.log("💾 Insertion commande dans Supabase...");

            const { data: commande, error: errCommande } = await supabaseAdmin
                .from("commandes")
                .insert({
                    nom:            nomCmd,
                    prenom:         prenomCmd,
                    email:          emailCmd,
                    mode_livraison: "retrait",
                    mode_paiement:  "boutique",
                    commentaires:   commentaire?.trim() || null,
                    total,
                    frais_port:     0,
                    statut:         "payee",  // ✅ Statut payée directement
                })
                .select("id")
                .single();

            if (errCommande) {
                console.error("❌ Erreur insertion commande:", errCommande);
                throw new Error(`Erreur BDD commande: ${errCommande.message}`);
            }

            if (!commande) {
                throw new Error("Aucune commande créée");
            }

            commandeId = commande.id;
            console.log(`✅ Commande #${commandeId} créée`);

            // ── 2. Insertion des lignes (une par carte) ──
            const lignes = cartes.map((c) => {
                const carteId = generateCarteCadeauId(c.destinataire.trim(), Number(c.montant));

                return {
                    commande_id:   commandeId,
                    produit_id:    carteId,  // ✅ Utilise le nouvel ID format
                    nom_produit:   `Carte cadeau ${Number(c.montant).toFixed(2)}€`,
                    quantite:      1,
                    prix_unitaire: Number(c.montant),
                    destinataire:  c.destinataire.trim(),
                };
            });

            console.log(`💾 Insertion de ${lignes.length} ligne(s) de commande...`);

            const { error: errLignes } = await supabaseAdmin.from("lignes_commande").insert(lignes);

            if (errLignes) {
                console.error("❌ Erreur insertion lignes:", errLignes);
                throw new Error(`Erreur BDD lignes: ${errLignes.message}`);
            }

            console.log(`✅ ${lignes.length} ligne(s) insérée(s) dans la commande #${commandeId}`);

        } catch (dbErr) {
            console.error("❌ Erreur critique BDD:", dbErr);
            return NextResponse.json({ success: false, message: dbErr instanceof Error ? dbErr.message : "Erreur base de données" }, { status: 500 });
        }

        // ── 3. Génération des PDFs ──
        type PdfEntry = { carte: CarteLigne; buffer: Buffer; filename: string };
        const pdfs: PdfEntry[] = [];

        console.log("📄 Génération des PDFs...");
        for (const carte of cartes) {
            try {
                const buffer   = await generateCarteCadeauPDF(carte.destinataire.trim(), Number(carte.montant));
                const filename = `CarteCadeau_${Number(carte.montant)}EUR_${carte.destinataire.trim().replace(/\s+/g, "_")}.pdf`;
                pdfs.push({ carte, buffer, filename });
                console.log(`  ✅ PDF généré pour ${carte.destinataire}`);
            } catch (pdfErr) {
                console.error(`  ❌ Erreur PDF pour ${carte.destinataire}:`, pdfErr);
            }
        }

        // ── 4. Envoi emails ──
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL } = process.env;

        if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && VENDEUR_EMAIL) {
            console.log("📧 Envoi des emails...");

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

            const cartesHtml = cartes.map(c =>
                `<li>${c.destinataire} — <strong>${Number(c.montant).toFixed(2)} €</strong>${c.emailDestinataire ? ` <span style="color:#666;font-size:12px;">(envoyée à ${c.emailDestinataire})</span>` : ""}</li>`
            ).join("");

            // ── Email vendeur ──
            try {
                await transporter.sendMail({
                    from:        `"La Cave La Garenne" <${SMTP_USER}>`,
                    to:          VENDEUR_EMAIL,
                    subject:     `${cartes.length} carte${cartes.length > 1 ? "s" : ""} cadeau — Commande #${commandeId}`,
                    attachments: allAttachments,
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <h2 style="color:#24586f;">Carte${cartes.length > 1 ? "s" : ""} cadeau créée${cartes.length > 1 ? "s" : ""} depuis l'admin</h2>
                            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                                <p style="margin:5px 0;"><strong>Commande :</strong> #${commandeId}</p>
                                ${nomAcheteur || prenomAcheteur ? `<p style="margin:5px 0;"><strong>Acheteur :</strong> ${prenomCmd} ${nomCmd}</p>` : ""}
                                ${emailAcheteur ? `<p style="margin:5px 0;"><strong>Email acheteur :</strong> ${emailAcheteur}</p>` : ""}
                                <p style="margin:10px 0 5px;"><strong>Carte${cartes.length > 1 ? "s" : ""} :</strong></p>
                                <ul style="margin:0;padding-left:20px;line-height:1.8;">${cartesHtml}</ul>
                                <p style="margin:15px 0 0;font-size:18px;font-weight:bold;color:#24586f;">Total : ${total.toFixed(2)} €</p>
                                ${commentaire ? `<p style="margin:10px 0 0;"><strong>Commentaire :</strong> ${commentaire}</p>` : ""}
                            </div>
                            <p style="color:#666;font-size:13px;">📅 ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                            <p style="color:#666;font-size:13px;">💳 Statut : <strong>Payée</strong> | Mode : <strong>Retrait boutique</strong></p>
                        </div>
                    `,
                });
                console.log("  ✅ Email vendeur envoyé");
            } catch (emailErr) {
                console.error("  ❌ Erreur email vendeur:", emailErr);
            }

            // ── Email acheteur ──
            if (emailAcheteur?.trim() && emailRegex.test(emailAcheteur.trim())) {
                try {
                    await transporter.sendMail({
                        from:        `"La Cave La Garenne" <${SMTP_USER}>`,
                        to:          emailAcheteur.trim(),
                        subject:     `Vos cartes cadeau La Cave La Garenne`,
                        attachments: allAttachments,
                        html: `
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:30px;border-radius:15px;">
                                ${logoAttachment ? `<div style="text-align:center;margin-bottom:20px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width:250px;"/></div>` : ""}
                                <div style="background:#24586f;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                                    <h2 style="color:#fff;margin:0;">Vos cartes cadeau</h2>
                                    <p style="color:#f1f5ff;margin:10px 0 0;">${prenomCmd} ${nomCmd}</p>
                                </div>
                                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                                    <ul style="line-height:2;color:#333;margin:0;padding-left:20px;">${cartesHtml}</ul>
                                    <div style="margin-top:15px;padding-top:15px;border-top:1px solid #e5e7eb;">
                                        <p style="font-size:20px;font-weight:bold;color:#24586f;margin:0;">Total : ${total.toFixed(2)} €</p>
                                    </div>
                                </div>
                                <p style="text-align:center;color:#333;">Les PDFs de vos cartes cadeau sont en pièce jointe.</p>
                                <hr style="border:none;border-top:2px solid #8ba9b7;margin:30px 0;">
                                <div style="text-align:center;color:#666;">
                                    <p style="margin:5px 0;">La Cave La Garenne</p>
                                    <p style="margin:5px 0;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
                                    <p style="margin:5px 0;">Tél : 01 47 84 57 63</p>
                                </div>
                            </div>
                        `,
                    });
                    console.log(`  ✅ Email acheteur envoyé à ${emailAcheteur}`);
                } catch (emailErr) {
                    console.error("  ❌ Erreur email acheteur:", emailErr);
                }
            }

            // ── Email à chaque destinataire ──
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
                            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:30px;border-radius:15px;">
                                ${logoAttachment ? `<div style="text-align:center;margin-bottom:20px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width:250px;"/></div>` : ""}
                                <div style="background:#24586f;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                                    <h2 style="color:#fff;margin:0;">🎁 Vous avez reçu une carte cadeau !</h2>
                                    <p style="color:#f1f5ff;margin:10px 0 0;font-size:16px;">${carte.destinataire}</p>
                                </div>
                                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;text-align:center;">
                                    <p style="font-size:52px;font-weight:bold;color:#24586f;margin:0;">${Number(carte.montant).toFixed(2)} €</p>
                                    <p style="color:#666;margin-top:10px;">à utiliser en boutique</p>
                                </div>
                                <p style="text-align:center;color:#333;">Votre carte cadeau est en pièce jointe de cet email.</p>
                                <hr style="border:none;border-top:2px solid #8ba9b7;margin:30px 0;">
                                <div style="text-align:center;color:#666;">
                                    <p style="margin:5px 0;">La Cave La Garenne</p>
                                    <p style="margin:5px 0;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
                                    <p style="margin:5px 0;">Tél : 01 47 84 57 63</p>
                                </div>
                            </div>
                        `,
                    });
                    console.log(`  ✅ Email destinataire envoyé à ${carte.emailDestinataire}`);
                } catch (emailErr) {
                    console.error(`  ❌ Erreur email ${carte.emailDestinataire}:`, emailErr);
                }
            }
        }

        console.log(`✅ Commande #${commandeId} créée avec succès`);
        return NextResponse.json({ success: true, commandeId });

    } catch (err) {
        console.error("❌ Erreur création carte cadeau admin:", err);
        return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erreur lors de la création" }, { status: 500 });
    }
}