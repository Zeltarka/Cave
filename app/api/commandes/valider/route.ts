// app/api/commandes/valider/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ─── Supabase admin ─────────────────────────────
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ────────────────────────────────────────
type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
};

type ClientCommande = {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    codepostal?: string;
    commentaires?: string;
    modeLivraison: "livraison" | "retrait";
    modePaiement: "virement" | "boutique";
    datePassage?: string;
};

// ─── Fonction pour récupérer session_id ──────────
async function getSessionId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get("session_id")?.value || null;
}

// ─── Génération PDF carte cadeau ──────────────────
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
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

    const now     = new Date();
    const clean   = (s: string) => s.replace(/[^a-z0-9]/gi, "_");
    const dateStr = now
        .toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .replace(/[/:]/g, "-")
        .replace(", ", "_");

    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair     = rgb(0.95, 0.96, 1);
    const grisClaire    = rgb(0.6, 0.6, 0.6);

    for (let i = 1; i <= quantite; i++) {
        const page          = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();
        const idUnique      = `CarteCadeau-${clean(destinataire)}-${montant}EUR-${dateStr}-${i}`;

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
        let condY       = 90;
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

// ─── POST /api/commandes/valider ──────────────────
export async function POST(req: Request) {
    try {
        console.log("📦 Début validation commande");

        const body = await req.json();
        const { client, panier, total }: { client: ClientCommande; panier: ProduitPanier[]; total: number } = body;

        // ── Validations basiques ──
        if (!client?.email) {
            console.error("❌ Client invalide");
            return NextResponse.json({ success: false, message: "Informations client invalides" }, { status: 400 });
        }
        if (!Array.isArray(panier) || panier.length === 0) {
            console.error("❌ Panier vide");
            return NextResponse.json({ success: false, message: "Le panier est vide" }, { status: 400 });
        }

        // ── Vérification ENV Supabase ──
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ ENV Supabase manquante");
            // On continue quand même avec l'email, mais on log l'erreur
        }

        // ── Nettoyage des valeurs ──
        const totalNumber = Number(total);
        const datePassageProp = client.datePassage && client.datePassage.trim() !== ""
            ? client.datePassage
            : null;

        let commandeId = `CMD-${Date.now()}`;

        // ── 1. Tentative d'insertion dans Supabase (optionnelle) ──
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                console.log("🗄️  Tentative insertion commande dans Supabase…");

                const { data: commande, error: errCommande } = await supabaseAdmin
                    .from("commandes")
                    .insert({
                        nom:            client.nom,
                        prenom:         client.prenom,
                        email:          client.email,
                        telephone:      client.telephone || null,
                        adresse:        client.adresse   || null,
                        ville:          client.ville     || null,
                        codepostal:     client.codepostal || null,
                        mode_livraison: client.modeLivraison,
                        mode_paiement:  client.modePaiement,
                        date_passage:   datePassageProp,
                        commentaires:   client.commentaires || null,
                        total:          totalNumber,
                        statut:         "en_attente",
                    })
                    .select("id")
                    .single();

                if (errCommande) {
                    console.error("⚠️  Erreur insertion commande Supabase:", errCommande.message);
                    console.log("   → On continue avec l'email uniquement");
                } else if (commande) {
                    commandeId = commande.id;
                    console.log(`✅ Commande #${commandeId} insérée dans Supabase`);

                    // Insérer les lignes de commande
                    const lignes = panier.map((p) => ({
                        commande_id:   commandeId,
                        produit_id:    p.id,
                        nom_produit:   p.produit,
                        quantite:      p.quantite,
                        prix_unitaire: p.prix,
                        destinataire:  p.destinataire || null,
                    }));

                    const { error: errLignes } = await supabaseAdmin.from("lignes_commande").insert(lignes);
                    if (errLignes) {
                        console.error("⚠️  Erreur insertion lignes:", errLignes.message);
                    } else {
                        console.log("✅ Lignes de commande insérées");
                    }
                }
            } catch (dbErr) {
                console.error("⚠️  Erreur base de données (on continue):", dbErr);
            }
        }

        // ── 2. Vérification ENV SMTP ──
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !VENDEUR_EMAIL) {
            console.error("❌ Configuration SMTP manquante");
            return NextResponse.json({
                success: false,
                message: "Configuration email manquante. Contactez le support."
            }, { status: 500 });
        }

        // ── 3. Configuration transporteur email ──
        const transporter = nodemailer.createTransport({
            host:   SMTP_HOST,
            port:   Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth:   { user: SMTP_USER, pass: SMTP_PASS },
        });

        // ── HTML des lignes du panier ──
        const lignesPanierHtml = panier
            .map((p) => {
                const destInfo = p.destinataire ? ` — Pour: ${p.destinataire}` : '';
                return `<li>${p.produit}${destInfo} x ${p.quantite} — ${(p.prix * p.quantite).toFixed(2)} €</li>`;
            })
            .join("");

        const modeLivraison = client.modeLivraison;
        const modePaiement  = client.modePaiement;
        const datePassage   = client.datePassage;

        // ── 4. Cartes cadeaux + génération PDFs ──
        const cartesCadeaux = panier.filter(p => p.id.includes("carte-cadeau") || p.produit.toLowerCase().includes("carte cadeau"));
        const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

        for (let i = 0; i < cartesCadeaux.length; i++) {
            const carte        = cartesCadeaux[i];
            const destinataire = carte.destinataire || `${client.prenom} ${client.nom}`;
            try {
                console.log(`  📄 Génération PDF carte cadeau pour ${destinataire}…`);
                const pdfBuffer = await generateCarteCadeauPDF(destinataire, carte.prix, carte.quantite);
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

        // ── 5. Logo pour l'email ──
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

        // ── Blocs HTML réutilisables ──
        const livraisonHtml = modeLivraison === "livraison"
            ? `<p style="margin:5px 0;color:#333;"><strong>Récupération :</strong> Livraison à domicile</p>
               <div style="background:#fff8e1;padding:10px;border-radius:6px;margin-top:10px;border-left:4px solid #ff9800;">
                   <p style="margin:0;color:#f57c00;font-size:14px;"><strong>Note :</strong> Les frais de port seront calculés et ajoutés au montant total. Vous recevrez une confirmation du montant final par email.</p>
               </div>
               <p style="margin:10px 0 0;color:#333;"><strong>Adresse :</strong><br/>${client.adresse}<br/>${client.codepostal} ${client.ville}</p>`
            : `<p style="margin:5px 0;color:#333;"><strong>Récupération :</strong> Retrait en boutique — 3 rue Voltaire, 92250 La Garenne-Colombes</p>`;

        const paiementHtml = modePaiement === "boutique"
            ? `<div style="background:#e3f2fd;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #2196f3;border-left:6px solid #1976d2;">
                   <p style="margin:0;font-weight:bold;color:#1565c0;font-size:16px;">💳 Paiement en boutique</p>
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

        const commentairesHtml = client.commentaires
            ? `<div style="background:#f1f5ff;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #24586f;">
                   <p style="margin:0;color:#24586f;font-weight:bold;">Commentaires</p>
                   <p style="margin:10px 0 0;color:#333;white-space:pre-wrap;">${client.commentaires}</p>
               </div>`
            : "";

        const cartesHtml = cartesCadeaux.length > 0
            ? `<div style="background:#e8f5e9;padding:20px;border-radius:12px;margin:20px 0;border:2px solid #4caf50;border-left:6px solid #4caf50;">
                   <p style="margin:0;color:#2e7d32;font-size:16px;"><strong>${cartesCadeaux.length > 1 ? "Vos cartes cadeaux sont" : "Votre carte cadeau est"} en pièce jointe de cet email !</strong></p>
               </div>`
            : "";

        // ── 6. Email CLIENT ──
        console.log("📧 Envoi email client…");
        const mailClient: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      client.email,
            subject: `Confirmation commande #${commandeId} — La Cave La Garenne`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:30px;border-radius:15px;">
                ${logoAttachment ? `<div style="text-align:center;margin-bottom:20px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width:250px;"/></div>` : ""}

                <div style="background:#24586f;padding:25px;border-radius:12px;margin-bottom:25px;text-align:center;">
                    <h2 style="color:#fff;margin:0;">Merci pour votre commande !</h2>
                    <p style="color:#f1f5ff;margin:10px 0 0;font-size:16px;">${client.prenom} ${client.nom} — Commande #${commandeId}</p>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                    <h3 style="color:#24586f;margin-top:0;">Détails de votre commande</h3>
                    <ul style="line-height:1.8;color:#333;">${lignesPanierHtml}</ul>
                    <div style="background:#f1f5ff;padding:15px;border-radius:8px;margin-top:15px;border-left:4px solid #24586f;">
                        <p style="font-size:20px;font-weight:bold;color:#24586f;margin:0;">Total ${modeLivraison === "livraison" ? "(hors frais de port) " : ""}: ${totalNumber.toFixed(2)} €</p>
                    </div>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;border:2px solid #8ba9b7;margin-bottom:20px;">
                    <h3 style="color:#24586f;margin-top:0;">Récupération de votre commande</h3>
                    ${livraisonHtml}
                    ${client.telephone ? `<p style="margin:10px 0 0;color:#333;"><strong>Téléphone :</strong> ${client.telephone}</p>` : ""}
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
        if (logoAttachment)    mailClient.attachments.push(logoAttachment);
        if (attachments.length) mailClient.attachments.push(...attachments);

        await transporter.sendMail(mailClient);
        console.log("  ✅ Email client envoyé");

        // ── 7. Email VENDEUR ──
        console.log("📧 Envoi email vendeur…");

        const livraisonVendeurHtml = modeLivraison === "livraison"
            ? `<div style="background:#fff8e1;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #ff9800;">
                   <p style="margin:0;color:#f57c00;font-weight:bold;">⚠️ Commande avec livraison</p>
                   <p style="margin:10px 0 0;color:#333;"><strong>Adresse :</strong><br/>${client.adresse}<br/>${client.codepostal} ${client.ville}</p>
                   <p style="margin:10px 0 0;color:#e65100;font-size:14px;">→ Calculer les frais de port et communiquer le montant total au client.</p>
               </div>`
            : `<p style="margin:5px 0;"><strong>Récupération :</strong> <span style="color:#4caf50;">Retrait en boutique</span></p>`;

        const paiementVendeurHtml = modePaiement === "boutique"
            ? `<div style="background:#e3f2fd;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #2196f3;">
                   <p style="margin:0;color:#1565c0;font-weight:bold;">💳 Paiement en boutique</p>
                   ${datePassage ? `<p style="margin:10px 0 0;color:#333;"><strong>Date de passage prévue :</strong> ${new Date(datePassage + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
                   <p style="margin:10px 0 0;color:#0d47a1;font-size:14px;">Le client paiera directement en boutique lors de la récupération.</p>
               </div>`
            : `<p style="margin:5px 0;"><strong>Paiement :</strong> <span style="color:#ff9800;">Virement bancaire</span> — attendre réception avant de préparer.</p>`;

        const mailVendeur: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      VENDEUR_EMAIL,
            subject: `Commande #${commandeId} — ${modeLivraison === "livraison" ? "LIVRAISON" : "Retrait boutique"}${modePaiement === "boutique" ? " | Paiement BOUTIQUE" : ""}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#24586f;">Nouvelle commande #${commandeId}</h2>

                <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
                    <p style="margin:5px 0;"><strong>Client :</strong> ${client.prenom} ${client.nom}</p>
                    <p style="margin:5px 0;"><strong>Email :</strong> ${client.email}</p>
                    ${client.telephone ? `<p style="margin:5px 0;"><strong>Téléphone :</strong> ${client.telephone}</p>` : ""}
                    ${livraisonVendeurHtml}
                    ${paiementVendeurHtml}
                </div>

                ${commentairesHtml}

                <h3 style="color:#24586f;">Détails de la commande :</h3>
                <ul style="line-height:1.8;">${lignesPanierHtml}</ul>
                <p style="font-size:18px;font-weight:bold;color:#24586f;">Total ${modeLivraison === "livraison" ? "(hors frais de port) " : ""}: ${totalNumber.toFixed(2)} €</p>

                ${cartesCadeaux.length
                ? `<div style="background:#d4edda;padding:15px;border-radius:8px;margin:15px 0;">
                           <p style="margin:0;color:#155724;"><strong>${cartesCadeaux.length} carte(s) cadeau — PDFs en pièce jointe.</strong></p>
                       </div>`
                : ""}
            </div>`,
        };

        if (attachments.length) mailVendeur.attachments = attachments;

        await transporter.sendMail(mailVendeur);
        console.log("  ✅ Email vendeur envoyé");

        // ── 8. Vider le panier dans la BDD (optionnel) ──
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const sessionId = await getSessionId();
            if (sessionId) {
                try {
                    console.log("🗑️  Suppression du panier de la BDD…");
                    const { error: deleteError } = await supabaseAdmin
                        .from("panier")
                        .delete()
                        .eq("session_id", sessionId);

                    if (deleteError) {
                        console.error("⚠️  Erreur suppression panier:", deleteError.message);
                    } else {
                        console.log("✅ Panier vidé de la BDD");
                    }
                } catch (cleanErr) {
                    console.error("⚠️  Erreur nettoyage panier:", cleanErr);
                }
            }
        }

        // ── 9. Vider le cookie panier (ancien système) ──
        try {
            const cookieStore = await cookies();
            cookieStore.delete("panier");
            console.log("✅ Cookie panier supprimé");
        } catch (cookieErr) {
            console.error("⚠️  Erreur suppression cookie:", cookieErr);
        }

        console.log(`✅ Commande #${commandeId} validée avec succès`);
        return NextResponse.json({ success: true, commandeId });

    } catch (err) {
        console.error("❌ ERREUR validation commande :", err);
        return NextResponse.json({
            success: false,
            message: "Une erreur est survenue lors de la validation de votre commande. Veuillez réessayer ou nous contacter.",
        }, { status: 500 });
    }
}