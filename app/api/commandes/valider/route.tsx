import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

// Fonction pour générer le PDF de carte cadeau avec pdf-lib
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number
): Promise<Buffer> {
    try {
        console.log(`Génération PDF pour ${destinataire} - ${montant}€ x${quantite}`);

        const pdfDoc = await PDFDocument.create();

        // Charger les polices
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        // Charger le logo
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'public', 'boutique.png');
        let logoImage = null;

        try {
            const logoBytes = fs.readFileSync(logoPath);
            logoImage = await pdfDoc.embedPng(logoBytes);
            console.log('Logo chargé avec succès');
        } catch (logoError) {
            console.error('Erreur lors du chargement du logo:', logoError);
        }

        const now = new Date();
        const dateStr = now.toLocaleString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).replace(/[/:]/g, "-").replace(", ", "_");

        // Fonction pour sécuriser le texte
        const clean = (str: string) => str.replace(/[^a-z0-9]/gi, '_');

        for (let i = 1; i <= quantite; i++) {
            const page = pdfDoc.addPage([595, 842]); // A4 en points
            const { width, height } = page.getSize();

            const idUnique = `CarteCadeau-${clean(destinataire)}-${montant}EUR-${dateStr}-${i}`;

            // Couleurs
            const bleuPrincipal = rgb(0.14, 0.35, 0.44); // #24586f
            const bleuClair = rgb(0.95, 0.96, 1); // #f1f5ff
            const gris = rgb(0.4, 0.4, 0.4);
            const grisClaire = rgb(0.6, 0.6, 0.6);

            // Fond coloré
            page.drawRectangle({
                x: 0,
                y: 0,
                width: width,
                height: height,
                color: bleuClair,
            });

            // Cadre principal
            page.drawRectangle({
                x: 50,
                y: 50,
                width: width - 100,
                height: height - 100,
                borderColor: bleuPrincipal,
                borderWidth: 3,
            });

            // Logo (si disponible)
            if (logoImage) {
                const logoWidth = 200;
                const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
                page.drawImage(logoImage, {
                    x: (width - logoWidth) / 2,
                    y: height - 140,
                    width: logoWidth,
                    height: logoHeight,
                });
            } else {
                // Fallback si le logo n'est pas disponible
                page.drawText("La Cave La Garenne", {
                    x: width / 2 - 160,
                    y: height - 120,
                    size: 32,
                    font: helveticaBold,
                    color: bleuPrincipal,
                });
            }

            page.drawText("Carte Cadeau", {
                x: width / 2 - 100,
                y: height - 200,
                size: 28,
                font: timesRomanBold,
                color: rgb(0.55, 0.66, 0.72), // #8ba9b7
            });

            // Montant principal
            const montantText = `${montant.toFixed(2)} €`;
            const montantWidth = helveticaBold.widthOfTextAtSize(montantText, 60);
            page.drawText(montantText, {
                x: (width - montantWidth) / 2,
                y: height - 300,
                size: 60,
                font: helveticaBold,
                color: bleuPrincipal,
            });

            // Bénéficiaire
            const benefText = `Offerte à : ${destinataire}`;
            const benefWidth = helvetica.widthOfTextAtSize(benefText, 18);
            page.drawText(benefText, {
                x: (width - benefWidth) / 2,
                y: height - 400,
                size: 18,
                font: helvetica,
                color: rgb(0, 0, 0),
            });

            // ID unique
            const codeText = `Code : ${idUnique}`;
            const codeWidth = helvetica.widthOfTextAtSize(codeText, 10);
            page.drawText(codeText, {
                x: (width - codeWidth) / 2,
                y: height - 470,
                size: 10,
                font: helvetica,
                color: grisClaire,
            });

            // Date d'émission
            const dateText = `Émise le : ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
            })}`;
            const dateWidth = helvetica.widthOfTextAtSize(dateText, 12);
            page.drawText(dateText, {
                x: (width - dateWidth) / 2,
                y: height - 500,
                size: 12,
                font: helvetica,
                color: grisClaire,
            });

            // Numéro de carte si plusieurs
            if (quantite > 1) {
                const numText = `Carte ${i} / ${quantite}`;
                const numWidth = helveticaBold.widthOfTextAtSize(numText, 14);
                page.drawText(numText, {
                    x: (width - numWidth) / 2,
                    y: height - 530,
                    size: 14,
                    font: helveticaBold,
                    color: bleuPrincipal,
                });
            }

            // Infos boutique
            const infos = [
                "La Cave La Garenne",
                "3 rue Voltaire, 92250 La Garenne-Colombes",
                "Tél : 01 47 84 57 63",
                "boutique@lacavelagarenne.fr"
            ];

            let yPos = 200;
            infos.forEach(info => {
                const infoWidth = helvetica.widthOfTextAtSize(info, 10);
                page.drawText(info, {
                    x: (width - infoWidth) / 2,
                    y: yPos,
                    size: 10,
                    font: helvetica,
                    color: grisClaire,
                });
                yPos -= 20;
            });

            // Conditions
            const conditions = "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.";
            const maxWidth = width - 100;
            const condSize = 8;

            // Découper le texte en lignes
            const words = conditions.split(' ');
            let lines = [];
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const testWidth = helvetica.widthOfTextAtSize(testLine, condSize);

                if (testWidth > maxWidth - 100) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);

            let condY = 90;
            lines.forEach(line => {
                const lineWidth = helvetica.widthOfTextAtSize(line, condSize);
                page.drawText(line, {
                    x: (width - lineWidth) / 2,
                    y: condY,
                    size: condSize,
                    font: helvetica,
                    color: rgb(0.6, 0.6, 0.6),
                });
                condY -= 12;
            });
        }

        const pdfBytes = await pdfDoc.save();
        console.log(`PDF généré: ${pdfBytes.length} bytes`);

        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error("Erreur création PDF:", error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        console.log("📦 Début validation commande");

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

        // 🔧 Détection améliorée des cartes cadeaux
        const cartesCadeaux = panier.filter(p =>
            p.id === "carte-cadeau" ||
            p.produit === "Carte cadeau" ||
            p.produit.toLowerCase().includes("carte cadeau")
        );

        console.log(`🎁 ${cartesCadeaux.length} carte(s) cadeau trouvée(s)`);
        console.log("Détails cartes:", cartesCadeaux.map(c => ({
            id: c.id,
            produit: c.produit,
            prix: c.prix,
            quantite: c.quantite,
            destinataire: c.destinataire
        })));

        const attachments = [];

        // Charger le logo pour l'email
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'public', 'boutique.png');
        let logoAttachment = null;

        try {
            const logoBuffer = fs.readFileSync(logoPath);
            logoAttachment = {
                filename: 'logo.png',
                content: logoBuffer,
                cid: 'logo@boutique' // Content ID pour référencer dans le HTML
            };
            console.log('Logo chargé pour email');
        } catch (logoError) {
            console.error('Erreur chargement logo pour email:', logoError);
        }

        // Générer les PDFs pour chaque carte cadeau
        if (cartesCadeaux.length > 0) {
            console.log("📄 Génération des PDFs...");

            let compteurPDF = 1; // Compteur pour numéroter les PDFs

            for (const carte of cartesCadeaux) {
                try {
                    console.log(`  📝 Génération PDF pour carte ${carte.prix}€ x${carte.quantite}`);

                    // Utiliser le champ destinataire de la carte (qui est rempli depuis le frontend)
                    const destinataire = carte.destinataire || `${client.prenom} ${client.nom}`;
                    console.log(`  👤 Destinataire utilisé: "${destinataire}" (depuis carte.destinataire: ${carte.destinataire ? 'OUI' : 'NON'})`);

                    const pdfBuffer = await generateCarteCadeauPDF(
                        destinataire,
                        carte.prix,
                        carte.quantite
                    );

                    // Numéroter les PDFs avec un compteur à 2 chiffres
                    const numeroPDF = String(compteurPDF).padStart(2, '0');
                    const filename = `CarteCadeau_${carte.prix}EUR_${destinataire.replace(/\s+/g, '_')}_${numeroPDF}.pdf`;
                    compteurPDF++;

                    attachments.push({
                        filename: filename,
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    });

                    console.log(`  ✅ PDF ajouté: ${filename} (${pdfBuffer.length} bytes)`);
                } catch (pdfError) {
                    console.error("  ❌ Erreur génération PDF carte:", pdfError);
                    // Continue même si un PDF échoue
                }
            }

            console.log(`📎 Total attachments: ${attachments.length}`);
        }

        // Email client
        console.log("📧 Envoi email client...");

        const mailOptionsClient: any = {
            from: `"La Cave La Garenne" <${SMTP_USER}>`,
            to: client.email,
            subject: "Confirmation de votre commande",
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 30px; border-radius: 15px;" xmlns="http://www.w3.org/1999/html">
                <!-- Logo -->
                ${logoAttachment ? `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo@boutique" alt="La Cave La Garenne" style="max-width: 250px; height: auto;" />
                </div>
                ` : ''}
                
                <!-- En-tête avec cadre -->
                <div style="background-color: #24586f; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0;">Merci pour votre commande !</h2>
                    <p style="color: #f1f5ff; margin: 10px 0 0 0; font-size: 16px;">${client.prenom} ${client.nom}</p>
                </div>
                
                <!-- Détails de la commande avec cadre -->
                <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 2px solid #8ba9b7; margin-bottom: 20px;">
                    <h3 style="color: #24586f; margin-top: 0;">Détails de votre commande</h3>
                    <ul style="line-height: 1.8; color: #333;">${lignesPanier}</ul>
                    <div style="background-color: #f1f5ff; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #24586f;">
                        <p style="font-size: 20px; font-weight: bold; color: #24586f; margin: 0;">Total : ${parseFloat(total).toFixed(2)} €</p>
                    </div>
                </div>
                
                ${cartesCadeaux.length > 1 ? `
                <div style="background-color: #e8f5e9; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #4caf50; border-left: 6px solid #4caf50;">
                    <p style="margin: 0; color: #2e7d32; font-size: 16px;"><strong>Vos cartes cadeaux sont en pièce jointe de cet email !</strong></p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #388e3c;">
                        Vous pouvez les télécharger et les envoyer aux destinataires.
                    </p>
                </div>
                ` : ''}
                
                ${cartesCadeaux.length === 1 ? `
                <div style="background-color: #e8f5e9; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #4caf50; border-left: 6px solid #4caf50;">
                    <p style="margin: 0; color: #2e7d32; font-size: 16px;"><strong>Votre carte cadeau est en pièce jointe de cet email !</strong></p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #388e3c;">
                        Vous pouvez la télécharger et l'envoyer au destinataire.
                    </p>
                </div>
                ` : ''}
                
                <!-- Informations de paiement avec cadre -->
                <div style="background-color: #fff8e1; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #ffc107; border-left: 6px solid #ff9800;">
                    <p style="margin: 0; font-weight: bold; color: #f57c00; font-size: 16px;">Paiement par virement bancaire</p>
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <p style="margin: 5px 0; color: #333;"><strong>IBAN :</strong> FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
                        <p style="margin: 5px 0; color: #333;"><strong>Titulaire :</strong> La Cave La Garenne</p>
                    </div>
                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #e65100;">
                        Merci d'indiquer votre nom dans le libellé du virement. </br>
                        Nous vous informons que la commande ne sera traitée qu'une fois le payement reçu.
                    </p>
                </div>
                
                <hr style="border: none; border-top: 2px solid #8ba9b7; margin: 30px 0;">
                
                <!-- Footer avec cadre -->
                <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #24586f;">
                    <h3 style="color: #24586f; margin: 0 0 15px 0;">La Cave La Garenne</h3>
                    <p style="margin: 5px 0; color: #666;">3 rue Voltaire, 92250 La Garenne-Colombes</p>
                    <p style="margin: 5px 0; color: #666;">Tél : 01 47 84 57 63</p>
                    <p style="margin: 5px 0; color: #666;">boutique@lacavelagarenne.fr</p>
                </div>
            </div>`,
        };

        // Assignation unique des attachments
        if (attachments.length > 0 || logoAttachment) {
            mailOptionsClient.attachments = [];

            // Ajouter le logo si disponible
            if (logoAttachment) {
                mailOptionsClient.attachments.push(logoAttachment);
            }

            // Ajouter les PDFs des cartes cadeaux
            if (attachments.length > 0) {
                mailOptionsClient.attachments.push(...attachments);
                console.log(`  📎 ${attachments.length} pièce(s) jointe(s) ajoutée(s) au mail client`);
                console.log("  Détails attachments:", attachments.map(a => ({ filename: a.filename, size: a.content.length })));
            }
        }

        await transporter.sendMail(mailOptionsClient);
        console.log("  ✅ Email client envoyé");

        // Email vendeur
        console.log("📧 Envoi email vendeur...");

        const mailOptionsVendeur: any = {
            from: `"La Cave La Garenne" <${SMTP_USER}>`,
            to: VENDEUR_EMAIL,
            subject: "Nouvelle commande reçue",
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #24586f;">Nouvelle commande</h2>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Client :</strong> ${client.prenom} ${client.nom}</p>
                    <p style="margin: 5px 0;"><strong>Email :</strong> ${client.email}</p>
                    <p style="margin: 5px 0;"><strong>Adresse :</strong> ${client.adresse}, ${client.codepostal} ${client.ville}</p>
                </div>
                
                <h3>Détails de la commande :</h3>
                <ul style="line-height: 1.8;">${lignesPanier}</ul>
                <p style="font-size: 18px; font-weight: bold; color: #24586f;">Total : ${parseFloat(total).toFixed(2)} €</p>
                
                ${cartesCadeaux.length > 0 ? `
                <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #155724;">
                        <strong>Cette commande contient ${cartesCadeaux.length} carte(s) cadeau</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #155724;">
                        Les PDFs sont en pièce jointe de cet email.
                    </p>
                </div>
                ` : ''}
            </div>`,
        };

        if (attachments.length > 0) {
            mailOptionsVendeur.attachments = attachments;
            console.log(`  📎 ${attachments.length} pièce(s) jointe(s) ajoutée(s) au mail vendeur`);
        }

        await transporter.sendMail(mailOptionsVendeur);
        console.log("  ✅ Email vendeur envoyé");

        // Supprimer le panier après validation
        const cookieStore = await cookies();
        cookieStore.delete("panier");

        console.log("✅ Commande validée avec succès");
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("❌ ERREUR API COMMANDE :", err);
        return NextResponse.json({
            success: false,
            message: err instanceof Error ? err.message : "Erreur serveur"
        }, { status: 500 });
    }
}