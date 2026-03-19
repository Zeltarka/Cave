// app/api/commandes/valider/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { generateCarteCadeauId } from "@/lib/carte-cadeau-utils";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

type LigneCommande = {
    commande_id: number;
    produit_id: string;
    nom_produit: string;
    quantite: number;
    prix_unitaire: number;
    destinataire: string | null;
    carte_cadeau_id: string | null;
};

async function getSessionId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get("session_id")?.value || null;
}

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
            const logoWidth = 160;
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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { client, panier, total, fraisPort }: {
            client: ClientCommande;
            panier: ProduitPanier[];
            total: number;
            fraisPort: number;
        } = body;

        if (!client?.email) return NextResponse.json({ success: false, message: "Informations client invalides" }, { status: 400 });
        if (!Array.isArray(panier) || panier.length === 0) return NextResponse.json({ success: false, message: "Le panier est vide" }, { status: 400 });

        // Panier = cartes cadeaux uniquement ?
        const seulementCartesCadeaux = panier.every(p =>
            p.id.includes("carte-cadeau") || p.produit.toLowerCase().includes("carte cadeau")
        );

        const msg        = await getMessages();
        const conditions = m(msg, "email.carte_cadeau_conditions", "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.");

        const totalNumber     = Number(total);
        const fraisPortNumber = Number(fraisPort) || 0;
        const sousTotal       = totalNumber - fraisPortNumber;
        const nombreBouteilles = panier.filter(p => !p.id.includes("carte-cadeau")).reduce((s, p) => s + p.quantite, 0);

        // Date non requise si panier = cartes cadeaux + virement
        const datePassageProp = (seulementCartesCadeaux && client.modePaiement === "virement")
            ? null
            : client.datePassage?.trim() || null;

        let commandeId: number | null = null;
        let lignes: LigneCommande[]   = [];

        // ── 1. Supabase ──────────────────────────────────────────────────────
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const { data: commande, error: errCommande } = await supabaseAdmin
                    .from("commandes")
                    .insert({
                        nom: client.nom, prenom: client.prenom, email: client.email,
                        telephone: client.telephone || null, adresse: client.adresse || null,
                        ville: client.ville || null, codepostal: client.codepostal || null,
                        mode_livraison: client.modeLivraison, mode_paiement: client.modePaiement,
                        date_passage: datePassageProp, commentaires: client.commentaires || null,
                        total: totalNumber, frais_port: fraisPortNumber, statut: "en_attente",
                    })
                    .select("id")
                    .single();

                if (errCommande) {
                    console.error("Erreur insertion commande Supabase:", errCommande.message);
                } else if (commande) {
                    commandeId = commande.id;
                    lignes = panier.map(p => {
                        const isCarteCadeau = p.id.includes("carte-cadeau") || p.produit.toLowerCase().includes("carte cadeau");
                        const dest          = p.destinataire || `${client.prenom} ${client.nom}`;
                        return {
                            commande_id:     commande.id,
                            produit_id:      p.id,
                            nom_produit:     p.produit,
                            quantite:        p.quantite,
                            prix_unitaire:   p.prix,
                            destinataire:    p.destinataire || null,
                            carte_cadeau_id: isCarteCadeau ? generateCarteCadeauId(dest, p.prix) : null,
                        };
                    });
                    const { error: errLignes } = await supabaseAdmin.from("lignes_commande").insert(lignes);
                    if (errLignes) console.error("Erreur insertion lignes:", errLignes.message);
                }
            } catch (dbErr) {
                console.error("Erreur base de données (on continue):", dbErr);
            }
        }

        // ── 2. SMTP ──────────────────────────────────────────────────────────
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, VENDEUR_EMAIL } = process.env;
        if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !VENDEUR_EMAIL) {
            return NextResponse.json({ success: false, message: "Configuration email manquante." }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST, port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        // ── 3. Logo ──────────────────────────────────────────────────────────
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

        const logoHtml = logoAttachment
            ? `<div style="text-align:center;margin-bottom:24px;"><img src="cid:logo@boutique" alt="La Cave La Garenne" style="width:120px;height:auto;"/></div>`
            : "";

        // ── 4. PDFs cartes cadeaux (vendeur uniquement) ──────────────────────
        const cartesCadeaux = panier.filter(p =>
            p.id.includes("carte-cadeau") || p.produit.toLowerCase().includes("carte cadeau")
        );
        const pdfAttachments: { filename: string; content: Buffer; contentType: string }[] = [];

        for (const carte of cartesCadeaux) {
            const dest   = carte.destinataire || `${client.prenom} ${client.nom}`;
            const ligne  = lignes.find(l => l.produit_id === carte.id && (l.destinataire || null) === (carte.destinataire || null));
            const idUniq = ligne?.carte_cadeau_id || generateCarteCadeauId(dest, carte.prix);
            try {
                const pdfBuffer = await generateCarteCadeauPDF(dest, carte.prix, carte.quantite, idUniq, conditions);
                pdfAttachments.push({ filename: `${idUniq}.pdf`, content: pdfBuffer, contentType: "application/pdf" });
            } catch (pdfErr) {
                console.error("Erreur génération PDF:", pdfErr);
            }
        }

        // ── 5. Helpers HTML ──────────────────────────────────────────────────
        const lignesPanierHtml = panier.map(p => {
            const destInfo = p.destinataire ? ` — Pour : ${p.destinataire}` : "";
            const prixAff  = p.id.includes("carte-cadeau")
                ? `${Math.round(p.prix * p.quantite)} €`
                : `${(p.prix * p.quantite).toFixed(2)} €`;
            return `<li style="padding:4px 0;">${p.produit}${destInfo} x ${p.quantite} — ${prixAff}</li>`;
        }).join("");

        const totalHtml = client.modeLivraison === "livraison" && fraisPortNumber > 0
            ? `<p style="margin:5px 0;color:#555;">Sous-total produits : ${sousTotal.toFixed(2)} €</p>
               <p style="margin:5px 0;color:#555;">Frais de port (${nombreBouteilles} bouteille${nombreBouteilles > 1 ? "s" : ""}) : ${fraisPortNumber.toFixed(2)} €</p>
               <hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0;">
               <p style="font-size:18px;font-weight:bold;color:#24586f;margin:4px 0;">Total TTC : ${totalNumber.toFixed(2)} €</p>`
            : `<p style="font-size:18px;font-weight:bold;color:#24586f;margin:4px 0;">Total : ${totalNumber.toFixed(2)} €</p>`;

        const livraisonHtml = client.modeLivraison === "livraison"
            ? `<p style="margin:5px 0;color:#333;"><strong>${m(msg, "email.recuperation_livraison", "Livraison à domicile")}</strong></p>
               <p style="margin:8px 0 0;color:#333;">${client.adresse}<br/>${client.codepostal} ${client.ville}</p>`
            : `<p style="margin:5px 0;color:#333;">${m(msg, "email.recuperation_retrait", "Retrait en boutique — 3 rue Voltaire, 92250 La Garenne-Colombes")}</p>`;

        const iban      = m(msg, "email.virement_iban", "FR76 XXXX XXXX XXXX XXXX XXXX XXX");
        const bic       = m(msg, "email.virement_bic", "");
        const titulaire = m(msg, "email.virement_titulaire", "La Cave La Garenne");
        const bicLigne  = bic ? `<p style="margin:5px 0;color:#333;"><strong>BIC :</strong> ${bic}</p>` : "";

        const paiementHtml = client.modePaiement === "boutique"
            ? `<div style="border-left:4px solid #24586f;padding:14px 18px;margin:20px 0;">
                   <p style="margin:0;font-weight:600;color:#333;font-size:15px;">${m(msg, "email.paiement_boutique_titre", "Paiement en boutique")}</p>
                   <p style="margin:8px 0 0;color:#555;">${m(msg, "email.paiement_boutique_texte", "Vous paierez directement en boutique lors de la récupération de votre commande.")}</p>
                   ${datePassageProp ? `<p style="margin:8px 0 0;color:#555;"><strong>Date de passage prévue :</strong> ${new Date(datePassageProp + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
                   <p style="margin:8px 0 0;color:#555;font-size:13px;">${m(msg, "email.paiement_boutique_attente", "Nous vous attendons en boutique pour finaliser votre achat.")}</p>
               </div>`
            : `<div style="border-left:4px solid #24586f;padding:14px 18px;margin:20px 0;">
                   <p style="margin:0;font-weight:600;color:#333;font-size:15px;">${m(msg, "email.paiement_virement_titre", "Paiement par virement bancaire")}</p>
                   <div style="margin-top:12px;">
                       <p style="margin:5px 0;color:#333;"><strong>IBAN :</strong> ${iban}</p>
                       <p style="margin:5px 0;color:#333;"><strong>Titulaire :</strong> ${titulaire}</p>
                       ${bicLigne}
                   </div>
                   <p style="margin:12px 0 0;color:#555;font-size:13px;">${m(msg, "email.paiement_virement_texte", "Merci d'indiquer votre nom dans le libellé du virement. La commande sera traitée après réception du paiement.")}</p>
               </div>`;

        const commentairesHtml = client.commentaires
            ? `<div style="border-left:4px solid #24586f;padding:14px 18px;margin:16px 0;">
                   <p style="margin:0;color:#24586f;font-weight:600;">${m(msg, "email.commentaires_titre", "Commentaires")}</p>
                   <p style="margin:8px 0 0;color:#333;white-space:pre-wrap;">${client.commentaires}</p>
               </div>`
            : "";

        const notePortHtml = client.modeLivraison === "livraison" && fraisPortNumber === 0
            ? `<div style="border-left:4px solid #24586f;padding:14px 18px;margin:16px 0;">
                   <p style="margin:0;color:#555;font-size:13px;">${m(msg, "email.note_frais_port", "Note : Les frais de port seront calculés et ajoutés au montant total.")}</p>
               </div>`
            : "";

        // Cartes cadeaux : le client est informé qu'elles seront envoyées par mail après paiement
        const cartesHtml = cartesCadeaux.length > 0
            ? `<div style="border-left:4px solid #24586f;padding:14px 18px;margin:20px 0;">
                   <p style="margin:0;color:#333;font-size:15px;font-weight:600;">${
                cartesCadeaux.length > 1
                    ? "Vos cartes cadeaux vous seront envoyées par mail après réception du paiement."
                    : "Votre carte cadeau vous sera envoyée par mail après réception du paiement."
            }</p>
               </div>`
            : "";

        const sousLigneClient = m(msg, "email.client_sous_titre", "{prenom} {nom} — Commande #{commande_id}")
            .replace("{prenom}", client.prenom)
            .replace("{nom}", client.nom)
            .replace("{commande_id}", String(commandeId ?? ""));

        // ── 6. Email CLIENT (sans PDF carte cadeau) ──────────────────────────
        const mailClient: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      client.email,
            subject: `Confirmation de votre commande — La Cave La Garenne`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
    ${logoHtml}
    <div style="background:#24586f;padding:24px;border-radius:8px;margin-bottom:24px;text-align:center;">
        <h2 style="color:#fff;margin:0;font-size:20px;">${m(msg, "email.client_titre", "Merci pour votre commande !")}</h2>
        <p style="color:#d4e6ed;margin:8px 0 0;font-size:14px;">${sousLigneClient}</p>
    </div>
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <h3 style="color:#24586f;margin:0 0 14px;">${m(msg, "email.details_commande", "Détails de votre commande")}</h3>
        <ul style="line-height:1.8;color:#333;padding-left:20px;margin:0 0 16px;">${lignesPanierHtml}</ul>
        <div style="border-left:4px solid #24586f;padding:12px 16px;">${totalHtml}</div>
        ${notePortHtml}
    </div>
    ${!seulementCartesCadeaux ? `
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <h3 style="color:#24586f;margin:0 0 12px;">${m(msg, "email.recuperation_titre", "Récupération de votre commande")}</h3>
        ${livraisonHtml}
        ${client.telephone ? `<p style="margin:8px 0 0;color:#333;"><strong>Téléphone :</strong> ${client.telephone}</p>` : ""}
    </div>` : ""}
    ${commentairesHtml}
    ${cartesHtml}
    ${paiementHtml}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
    <div style="text-align:center;">
        <p style="font-weight:600;color:#24586f;margin:0 0 6px;">La Cave La Garenne</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">Tél : 01 47 84 57 63</p>
        <p style="margin:3px 0;color:#666;font-size:13px;">boutique@lacavelagarenne.fr</p>
    </div>
</div>`,
            attachments: logoAttachment ? [logoAttachment] : [],
        };

        await transporter.sendMail(mailClient);
        console.log("Email client envoyé");

        // ── 7. Email VENDEUR (avec PDFs cartes cadeaux) ──────────────────────
        const livraisonVendeurHtml = client.modeLivraison === "livraison"
            ? `<div style="border-left:4px solid #e6a817;padding:12px 16px;margin:12px 0;">
                   <p style="margin:0;color:#333;font-weight:600;">Commande avec livraison</p>
                   <p style="margin:8px 0 0;color:#333;">${client.adresse}<br/>${client.codepostal} ${client.ville}</p>
               </div>`
            : `<p style="margin:5px 0;color:#333;"><strong>Récupération :</strong> Retrait en boutique</p>`;

        const paiementVendeurHtml = client.modePaiement === "boutique"
            ? `<div style="border-left:4px solid #24586f;padding:12px 16px;margin:12px 0;">
                   <p style="margin:0;color:#333;font-weight:600;">Paiement en boutique</p>
                   ${datePassageProp ? `<p style="margin:8px 0 0;color:#333;"><strong>Date de passage :</strong> ${new Date(datePassageProp + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
                   <p style="margin:8px 0 0;color:#555;font-size:13px;">Le client paiera directement en boutique.</p>
               </div>`
            : `<p style="margin:5px 0;color:#333;"><strong>Paiement :</strong> Virement bancaire — attendre réception avant de préparer.</p>`;

        const mailVendeur: any = {
            from:    `"La Cave La Garenne" <${SMTP_USER}>`,
            to:      VENDEUR_EMAIL,
            subject: `Commande #${commandeId ?? "N/A"} — ${client.modeLivraison === "livraison" ? "LIVRAISON" : "Retrait boutique"}${client.modePaiement === "boutique" ? " | Paiement BOUTIQUE" : ""}`,
            html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="color:#24586f;margin:0 0 16px;">Nouvelle commande #${commandeId}</h2>
    <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
        <p style="margin:5px 0;color:#333;"><strong>Client :</strong> ${client.prenom} ${client.nom}</p>
        <p style="margin:5px 0;color:#333;"><strong>Email :</strong> ${client.email}</p>
        ${client.telephone ? `<p style="margin:5px 0;color:#333;"><strong>Téléphone :</strong> ${client.telephone}</p>` : ""}
        ${livraisonVendeurHtml}
        ${paiementVendeurHtml}
    </div>
    ${commentairesHtml}
    <h3 style="color:#24586f;margin:16px 0 8px;">Détails de la commande</h3>
    <ul style="line-height:1.8;color:#333;padding-left:20px;">${lignesPanierHtml}</ul>
    <div style="border-left:4px solid #24586f;padding:12px 16px;margin:16px 0;">${totalHtml}</div>
    ${pdfAttachments.length
                ? `<div style="border-left:4px solid #4caf50;padding:12px 16px;margin:16px 0;">
               <p style="margin:0;color:#333;font-weight:600;">${pdfAttachments.length} carte(s) cadeau — PDFs en pièce jointe</p>
               <p style="margin:6px 0 0;color:#555;font-size:13px;">Envoyez les cartes au client depuis l'interface admin une fois le paiement reçu.</p>
           </div>`
                : ""}
</div>`,
            attachments: pdfAttachments,
        };

        await transporter.sendMail(mailVendeur);
        console.log("Email vendeur envoyé");

        // ── 8. Vider le panier ───────────────────────────────────────────────
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const sessionId = await getSessionId();
            if (sessionId) {
                try {
                    await supabaseAdmin.from("panier").delete().eq("session_id", sessionId);
                } catch (cleanErr) {
                    console.error("Erreur nettoyage panier:", cleanErr);
                }
            }
        }

        try {
            const cookieStore = await cookies();
            cookieStore.delete("panier");
        } catch {}

        console.log(`Commande #${commandeId} validée`);
        return NextResponse.json({ success: true, commandeId: commandeId ?? "inconnu" });

    } catch (err) {
        console.error("ERREUR validation commande:", err);
        return NextResponse.json({
            success: false,
            message: "Une erreur est survenue lors de la validation de votre commande. Veuillez réessayer ou nous contacter.",
        }, { status: 500 });
    }
}