// app/api/admin/commandes/[id]/send-email/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateCarteCadeauId } from "@/lib/carte-cadeau-utils";

export const runtime = "nodejs";

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Génération PDF carte cadeau ───
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number,
    idUnique: string
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica      = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const now = new Date();
    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair     = rgb(0.95, 0.96, 1);
    const grisClaire    = rgb(0.6, 0.6, 0.6);

    for (let i = 1; i <= quantite; i++) {
        const page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();

        page.drawRectangle({ x: 0, y: 0, width, height, color: bleuClair });
        page.drawRectangle({ x: 50, y: 50, width: width - 100, height: height - 100, borderColor: bleuPrincipal, borderWidth: 3 });

        page.drawText("La Cave La Garenne", { x: width / 2 - 160, y: height - 120, size: 32, font: helveticaBold, color: bleuPrincipal });
        page.drawText("Carte Cadeau", { x: width / 2 - 100, y: height - 200, size: 28, font: timesRomanBold, color: rgb(0.55, 0.66, 0.72) });

        const montantText = `${montant.toFixed(2)} €`;
        page.drawText(montantText, { x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2, y: height - 300, size: 60, font: helveticaBold, color: bleuPrincipal });

        const benefText = `Offerte à : ${destinataire}`;
        page.drawText(benefText, { x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2, y: height - 400, size: 18, font: helvetica, color: rgb(0, 0, 0) });

        const codeText = `Code : ${idUnique}`;
        page.drawText(codeText, { x: (width - helvetica.widthOfTextAtSize(codeText, 10)) / 2, y: height - 470, size: 10, font: helvetica, color: grisClaire });

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
    }

    return Buffer.from(await pdfDoc.save());
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        console.log("📧 Renvoi email pour commande ID:", id);

        // Récupérer la commande avec ses lignes
        const { data: commande, error: commandeError } = await supabaseAdmin
            .from("commandes")
            .select(`
                *,
                lignes_commande (
                    id,
                    produit_id,
                    nom_produit,
                    quantite,
                    prix_unitaire,
                    destinataire
                )
            `)
            .eq("id", id)
            .single();

        if (commandeError || !commande) {
            console.error("❌ Commande non trouvée:", commandeError);
            return NextResponse.json(
                { error: "Commande non trouvée" },
                { status: 404 }
            );
        }

        // Vérifier la configuration SMTP
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
            console.error("❌ Configuration SMTP manquante");
            return NextResponse.json({
                error: "Configuration email manquante"
            }, { status: 500 });
        }

        // Configuration transporteur email
        const transporter = nodemailer.createTransport({
            host:   SMTP_HOST,
            port:   Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth:   { user: SMTP_USER, pass: SMTP_PASS },
        });

        // Formater les lignes du panier
        const panier = (commande.lignes_commande || []).map((ligne: any) => ({
            id: ligne.produit_id,
            produit: ligne.nom_produit,
            quantite: ligne.quantite,
            prix: Number(ligne.prix_unitaire),
            destinataire: ligne.destinataire || null,
        }));

        const lignesPanierHtml = panier
            .map((p: any) => {
                const destInfo = p.destinataire ? ` — Pour: ${p.destinataire}` : '';
                return `<li>${p.produit}${destInfo} x ${p.quantite} — ${(p.prix * p.quantite).toFixed(2)} €</li>`;
            })
            .join("");

        // Cartes cadeaux
        const cartesCadeaux = panier.filter((p: any) =>
            p.id.toLowerCase().includes("carte") ||
            p.id.toLowerCase().includes("cadeau") ||
            p.produit.toLowerCase().includes("carte cadeau")
        );

        const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

        // Générer les PDFs des cartes cadeaux
        for (let i = 0; i < cartesCadeaux.length; i++) {
            const carte = cartesCadeaux[i];
            const destinataire = carte.destinataire || `${commande.prenom} ${commande.nom}`;
            const idUnique = carte.id; // Utiliser l'ID déjà stocké en BDD

            try {
                console.log(`  📄 Génération PDF pour: ${destinataire}...`);
                const pdfBuffer = await generateCarteCadeauPDF(destinataire, carte.prix, carte.quantite, idUnique);
                attachments.push({
                    filename:    `CarteCadeau_${carte.prix}EUR_${destinataire.replace(/\s+/g, "_")}_${String(i + 1).padStart(2, "0")}.pdf`,
                    content:     pdfBuffer,
                    contentType: "application/pdf",
                });
                console.log(`  ✅ PDF généré`);
            } catch (pdfErr) {
                console.error("  ⚠️  Erreur génération PDF:", pdfErr);
            }
        }

        // Logo pour l'email
        const fs   = require("fs");
        const path = require("path");
        let logoAttachment: any = null;
        try {
            logoAttachment = {
                filename: "logo.png",
                content:  fs.readFileSync(path.join(process.cwd(), "public", "boutique.png")),
                cid:      "logo@boutique",
            };
        } catch (logoErr) {
            console.log("  ℹ️  Logo non trouvé (optionnel)");
        }

        const modeLivraison = commande.mode_livraison;
        const modePaiement  = commande.mode_paiement;
        const datePassage   = commande.date_passage;
        const totalNumber   = Number(commande.total);
        const fraisPortNumber = Number(commande.frais_port) || 0;
        const sousTotal = totalNumber - fraisPortNumber;

        const nombreBouteilles = panier
            .filter((p: any) => !p.id.includes("carte-cadeau"))
            .reduce((sum: number, p: any) => sum + p.quantite, 0);

        const livraisonHtml = modeLivraison === "livraison"
            ? `<p style="margin:5px 0;color:#333;"><strong>Récupération :</strong> Livraison à domicile</p>
               <p style="margin:10px 0 0;color:#333;"><strong>Adresse :</strong><br/>${commande.adresse}<br/>${commande.codepostal} ${commande.ville}</p>`
            : `<p style="margin:5px 0;color:#333;"><strong>Récupération :</strong> Retrait en boutique — 3 rue Voltaire, 92250 La Garenne-Colombes</p>`;

        const paiementHtml = modePaiement === "boutique"
            ? `<div style="background:#e3f2fd;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #2196f3;border-left:6px solid #1976d2;">
                   <p style="margin:0;font-weight:bold;color:#1565c0;font-size:16px;">Paiement en boutique</p>
                   <p style="margin:10px 0 0;color:#333;">Vous paierez directement en boutique lors de la récupération de votre commande.</p>
                   ${datePassage ? `<p style="margin:10px 0 0;color:#333;"><strong>Date de passage prévue :</strong> ${new Date(datePassage + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
                   <p style="margin:10px 0 0;font-size:13px;color:#0d47a1;">Nous vous attendons en boutique pour finaliser votre achat.</p>
               </div>`
            : `<div style="background:#fff8e1;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #ffc107;border-left:6px solid #ff9800;">
                   <p style="margin:0;font-weight:bold;color:#f57c00;font-size:16px;">🏦 Paiement par virement bancaire</p>
                   <div style="background:#fff;padding:15px;border-radius:8px;margin-top:15px;">
                       <p style="margin:5px 0;color:#333;"><strong>IBAN :</strong> FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
                       <p style="margin:5px 0;color:#333;"><strong>Titulaire :</strong> La Cave La Garenne</p>
                   </div>
                   <p style="margin:15px 0 0;font-size:13px;color:#e65100;">Merci d'indiquer votre nom dans le libellé du virement.<br/>La commande sera traitée après réception du paiement.</p>
               </div>`;

        const commentairesHtml = commande.commentaires
            ? `<div style="background:#f1f5ff;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #24586f;">
                   <p style="margin:0;color:#24586f;font-weight:bold;">Commentaires</p>
                   <p style="margin:10px 0 0;color:#333;white-space:pre-wrap;">${commande.commentaires}</p>
               </div>`
            : "";

        const cartesHtml = cartesCadeaux.length > 0
            ? `<div style="background:#e8f5e9;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #4caf50;border-left:6px solid #4caf50;">
                   <p style="margin:0;color:#2e7d32;font-size:16px;"><strong>${cartesCadeaux.length > 1 ? "Vos cartes cadeaux sont" : "Votre carte cadeau est"} en pièce jointe de cet email !</strong></p>
               </div>`
            : "";

        // Construire l'email client
        const mailClient: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      commande.email,
            subject: `Confirmation de votre commande — La Cave La Garenne`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:30px;border-radius:15px;">
                ${logoAttachment ? `<div style="text-align:center;margin-bottom:20px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width:250px;"/></div>` : ""}

                <div style="background:#24586f;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                    <h2 style="color:#fff;margin:0;">Merci pour votre commande !</h2>
                    <p style="color:#f1f5ff;margin:10px 0 0;font-size:16px;">${commande.prenom} ${commande.nom}</p>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                    <h3 style="color:#24586f;margin-top:0;">Détails de votre commande</h3>
                    <ul style="line-height:1.8;color:#333;">${lignesPanierHtml}</ul>
                    <div style="background:#f1f5ff;padding:15px;border-radius:8px;margin-top:15px;border-left:4px solid #24586f;">
                        ${modeLivraison === "livraison" && fraisPortNumber > 0 ? `
                            <p style="margin:5px 0;color:#24586f;">Sous-total produits : ${sousTotal.toFixed(2)} €</p>
                            <p style="margin:5px 0;color:#24586f;">Frais de port (${nombreBouteilles} bouteille${nombreBouteilles > 1 ? 's' : ''}) : ${fraisPortNumber.toFixed(2)} €</p>
                            <hr style="border:none;border-top:1px solid #8ba9b7;margin:10px 0;">
                            <p style="font-size:20px;font-weight:bold;color:#24586f;margin:5px 0 0;">Total TTC : ${totalNumber.toFixed(2)} €</p>
                        ` : `
                            <p style="font-size:20px;font-weight:bold;color:#24586f;margin:0;">Total : ${totalNumber.toFixed(2)} €</p>
                        `}
                    </div>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                    <h3 style="color:#24586f;margin-top:0;">Récupération de votre commande</h3>
                    ${livraisonHtml}
                    ${commande.telephone ? `<p style="margin:10px 0 0;color:#333;"><strong>Téléphone :</strong> ${commande.telephone}</p>` : ""}
                </div>

                ${commentairesHtml}
                ${cartesHtml}
                ${paiementHtml}

                <hr style="border:none;border-top:2px solid #8ba9b7;margin:30px 0;">

                <div style="background:#fff;padding:20px;border-radius:12px;text-align:center;border:2px solid #24586f;">
                    <h3 style="color:#24586f;margin:0 0 15px;">La Cave La Garenne</h3>
                    <p style="margin:5px 0;color:#666;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
                    <p style="margin:5px 0;color:#666;">Tél : 01 47 84 57 63</p>
                    <p style="margin:5px 0;color:#666;">boutique@lacavelagarenne.fr</p>
                </div>
            </div>`,
        };

        mailClient.attachments = [];
        if (logoAttachment) mailClient.attachments.push(logoAttachment);
        if (attachments.length) mailClient.attachments.push(...attachments);

        await transporter.sendMail(mailClient);
        console.log("✅ Email client renvoyé avec succès");

        return NextResponse.json({ success: true, message: "Email envoyé avec succès" });

    } catch (error) {
        console.error("❌ Erreur envoi email:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'envoi de l'email" },
            { status: 500 }
        );
    }
}