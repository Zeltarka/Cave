// app/api/admin/rencontres-vignerons/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { checkAdminAuth } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Remplace les caractères hors WinAnsi qui font planter pdf-lib
function sanitize(text: string): string {
    return text
        .replace(/\u2019/g, "'")   // '
        .replace(/\u2018/g, "'")   // '
        .replace(/\u201C/g, '"')   // "
        .replace(/\u201D/g, '"')   // "
        .replace(/\u2013/g, "-")   // en dash
        .replace(/\u2014/g, "-")   // em dash
        .replace(/\u2026/g, "...") // ellipsis
        .replace(/\u00A0/g, " ")   // espace insécable
        .replace(/[^\x00-\xFF]/g, ""); // tout le reste hors Latin-1
}

// Parse HTML riche => segments {text, bold}
function parseRichText(html: string): { text: string; bold: boolean }[] {
    const segments: { text: string; bold: boolean }[] = [];
    const regex = /<(\/?)(?:b|strong)[^>]*>|([^<>]+)/g;
    let bold = false;
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (match[1] !== undefined) {
            bold = match[1] === "";
        } else if (match[2]) {
            const raw = match[2]
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&nbsp;/g, " ")
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');
            const text = sanitize(raw);
            if (text.trim()) segments.push({ text, bold });
        }
    }
    return segments;
}

// Dessine du texte riche avec wrap, retourne le nouveau Y
function drawRichTextWrapped(
    page: any,
    html: string,
    x: number,
    startY: number,
    maxWidth: number,
    fontSize: number,
    normalFont: any,
    boldFont: any,
    color: ReturnType<typeof rgb>,
    lineHeight: number
): number {
    const segments = parseRichText(html);

    // Éclater en mots avec leur style
    const words: { text: string; bold: boolean }[] = [];
    for (const seg of segments) {
        const parts = seg.text.split(/(\s+)/);
        for (const part of parts) {
            if (part) words.push({ text: part, bold: seg.bold });
        }
    }

    let lineTokens: { text: string; bold: boolean }[] = [];
    let lineWidth = 0;
    let y = startY;

    const flushLine = () => {
        // Trim espaces en début de ligne
        while (lineTokens.length && !lineTokens[0].text.trim()) lineTokens.shift();
        if (lineTokens.length === 0) return;
        let cx = x;
        for (const t of lineTokens) {
            const font = t.bold ? boldFont : normalFont;
            if (t.text.trim()) {
                page.drawText(t.text, { x: cx, y, size: fontSize, font, color });
            }
            cx += font.widthOfTextAtSize(t.text, fontSize);
        }
        y -= lineHeight;
        lineTokens = [];
        lineWidth = 0;
    };

    for (const word of words) {
        if (!word.text.trim() && lineWidth === 0) continue;
        const font = word.bold ? boldFont : normalFont;
        const ww = font.widthOfTextAtSize(word.text, fontSize);
        if (lineWidth + ww > maxWidth && lineWidth > 0) {
            flushLine();
        }
        lineTokens.push(word);
        lineWidth += ww;
    }
    flushLine();

    return y;
}

export async function GET(req: NextRequest) {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response;

    try {
        // 1. Données Supabase
        const { data, error } = await supabaseAdmin
            .from("contenu")
            .select("contenu")
            .eq("page", "rencontres-vignerons")
            .single();

        if (error) return NextResponse.json({ error: "Supabase: " + error.message }, { status: 500 });
        if (!data)  return NextResponse.json({ error: "Contenu introuvable" },        { status: 404 });

        const contenu = data.contenu;
        const today = new Date().toISOString().split("T")[0];

        const prochaines = ((contenu.rencontres || []) as any[])
            .filter((r) => r.date >= today)
            .sort((a: any, b: any) => a.date.localeCompare(b.date))
            .slice(0, 5);

        const titrePage = sanitize(stripHtml(contenu.titre || "Les Rencontres Vignerons & Degustations"));

        // 2. Créer le PDF
        const pdfDoc = await PDFDocument.create();
        const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();

        const marginLeft = 55;
        const marginRight = 55;
        const contentW = width - marginLeft - marginRight;

        const NOIR = rgb(0, 0, 0);
        const GRIS = rgb(0.35, 0.35, 0.35);

        let y = height - 15;

        // 3. Logo
        let logoHeight = 0;
        try {
            const logoPath = path.join(process.cwd(), "public", "boutique.png");
            if (fs.existsSync(logoPath)) {
                const logoBytes = fs.readFileSync(logoPath);
                const logoImg   = await pdfDoc.embedPng(logoBytes);
                const logoW     = 110;
                logoHeight      = (logoImg.height / logoImg.width) * logoW;
                page.drawImage(logoImg, {
                    x: marginLeft,
                    y: y - logoHeight,
                    width: logoW,
                    height: logoHeight,
                });
            }
        } catch (logoErr) {
            console.warn("Logo non chargé:", logoErr);
        }

        // 4. Titre centré
        const titreSize = 20;
        const titreW = helveticaBold.widthOfTextAtSize(titrePage, titreSize);
        page.drawText(titrePage, {
            x: (width - titreW) / 2,
            y: y - 100,
            size: titreSize,
            font: helveticaBold,
            color: NOIR,
        });

        // 5. Horaire centré (grand)
        const horaire = sanitize("09h30 - 19h00");
        const horaireSize = 26;
        const horaireW = helvetica.widthOfTextAtSize(horaire, horaireSize);
        page.drawText(horaire, {
            x: (width - horaireW) / 2,
            y: y - 100 - titreSize - 7,
            size: horaireSize,
            font: helvetica,
            color: NOIR,
        });

        // 6. Adresse
        const adresse = sanitize("3 rue Voltaire 92250 La Garenne-Colombes");
        const adresseSize = 9;
        const adresseW = helvetica.widthOfTextAtSize(adresse, adresseSize);
        page.drawText(adresse, {
            x: (width - adresseW) / 2,
            y: y - 100 - titreSize - 7 - horaireSize - 5,
            size: adresseSize,
            font: helvetica,
            color: GRIS,
        });

        const textBottom = y - 100 - titreSize - 7 - horaireSize - 5 - adresseSize - 8;
        const logoBottom = logoHeight > 0 ? y - logoHeight - 6 : textBottom;
        y = Math.min(textBottom, logoBottom) - 8;

        // 7. Ligne séparatrice
        page.drawLine({
            start: { x: marginLeft, y },
            end:   { x: width - marginRight, y },
            thickness: 0.8,
            color: NOIR,
        });
        y -= 16;

        // 7. Rencontres
        if (prochaines.length === 0) {
            page.drawText("Aucune rencontre programmee.", {
                x: marginLeft, y, size: 11, font: helvetica, color: GRIS,
            });
        }

        for (const rencontre of prochaines) {
            if (y < 60) break;

            const titreBloc   = ((rencontre.blocs || []) as any[]).find((b: any) => b.type === "titre");
            const paragraphes = ((rencontre.blocs || []) as any[]).filter((b: any) => b.type === "paragraphe");
            const hasImage    = !!rencontre.image;

            // Largeur du texte réduite si image présente
            const imageW     = 120;
            const imageGap   = 12;
            const textMaxW   = hasImage ? contentW - imageW - imageGap : contentW;
            const imageStartY = y;

            // Date soulignée
            const dateStr  = sanitize(`- ${capitalize(formatDate(rencontre.date))}`);
            const dateSize = 11;
            page.drawText(dateStr, {
                x: marginLeft, y, size: dateSize, font: helvetica, color: NOIR,
            });
            const dateW = helvetica.widthOfTextAtSize(dateStr, dateSize);
            page.drawLine({
                start: { x: marginLeft, y: y - 1.5 },
                end:   { x: marginLeft + dateW, y: y - 1.5 },
                thickness: 0.5,
                color: NOIR,
            });
            y -= 16;

            // Titre rencontre (texte riche)
            if (titreBloc?.contenu && stripHtml(titreBloc.contenu)) {
                y = drawRichTextWrapped(
                    page, titreBloc.contenu,
                    marginLeft + 12, y, textMaxW - 12,
                    12, helvetica, helveticaBold, NOIR, 16
                );
            }

            // Paragraphes
            for (const bloc of paragraphes) {
                if (!stripHtml(bloc.contenu)) continue;
                page.drawText("-", {
                    x: marginLeft + 24, y, size: 12, font: helvetica, color: GRIS,
                });
                y = drawRichTextWrapped(
                    page, bloc.contenu,
                    marginLeft + 36, y, textMaxW - 36,
                    12, helvetica, helveticaBold, GRIS, 16
                );
            }

            // Image à droite si présente
            if (hasImage && rencontre.image) {
                try {
                    let imgBuffer: Buffer | null = null;
                    const imgUrl: string = rencontre.image;

                    if (imgUrl.startsWith("/")) {
                        // Fichier local dans public/
                        const localPath = path.join(process.cwd(), "public", imgUrl);
                        if (fs.existsSync(localPath)) {
                            imgBuffer = fs.readFileSync(localPath);
                        }
                    } else if (imgUrl.startsWith("http")) {
                        // URL distante (ex: Supabase storage)
                        const res = await fetch(imgUrl);
                        if (res.ok) {
                            imgBuffer = Buffer.from(await res.arrayBuffer());
                        }
                    }

                    if (imgBuffer) {
                        const isJpeg = imgUrl.toLowerCase().match(/\.jpe?g$/);
                        const embeddedImg = isJpeg
                            ? await pdfDoc.embedJpg(imgBuffer)
                            : await pdfDoc.embedPng(imgBuffer);

                        const imgH = (embeddedImg.height / embeddedImg.width) * imageW;
                        const imgX = marginLeft + textMaxW + imageGap;
                        const imgY = imageStartY - imgH;

                        page.drawImage(embeddedImg, {
                            x: imgX,
                            y: imgY,
                            width: imageW,
                            height: imgH,
                        });

                        // S'assurer que y est au moins sous l'image
                        y = Math.min(y, imgY - 6);
                    }
                } catch (imgErr) {
                    console.warn("Image non chargée:", imgErr);
                }
            }

            y -= 10;
        }

        // 8. Sauvegarder
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type":        "application/pdf",
                "Content-Disposition": `attachment; filename="rencontres-vignerons.pdf"`,
            },
        });

    } catch (err) {
        console.error("Erreur PDF:", err);
        return NextResponse.json({
            error:   "Erreur serveur",
            details: err instanceof Error ? err.message : String(err),
        }, { status: 500 });
    }
}