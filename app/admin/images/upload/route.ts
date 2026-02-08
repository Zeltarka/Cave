// app/api/admin/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt-changez-moi";

export async function POST(req: NextRequest) {
    try {
        // Vérifier l'authentification
        const cookieStore = await cookies();
        const token = cookieStore.get("admin-token");

        if (!token) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        try {
            jwt.verify(token.value, JWT_SECRET);
        } catch {
            return NextResponse.json(
                { error: "Token invalide" },
                { status: 401 }
            );
        }

        // Récupérer le fichier
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const oldFileName = formData.get("oldFileName") as string;

        if (!file) {
            return NextResponse.json(
                { error: "Aucun fichier fourni" },
                { status: 400 }
            );
        }

        // Vérifications
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Le fichier doit être une image" },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "L'image doit faire moins de 5 MB" },
                { status: 400 }
            );
        }

        // Générer un nom de fichier unique
        const ext = file.name.split(".").pop();
        const timestamp = Date.now();
        const fileName = `${file.name.replace(/\.[^/.]+$/, "")}-${timestamp}.${ext}`;

        // Convertir le fichier en buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sauvegarder dans /public
        const publicPath = join(process.cwd(), "public", fileName);
        await writeFile(publicPath, buffer);

        console.log(`✅ Image uploadée: ${fileName}`);

        // Supprimer l'ancienne image si elle existe
        if (oldFileName && oldFileName !== fileName) {
            try {
                const oldPath = join(process.cwd(), "public", oldFileName);
                await unlink(oldPath);
                console.log(`🗑️  Ancienne image supprimée: ${oldFileName}`);
            } catch (err) {
                console.log(`⚠️  Impossible de supprimer l'ancienne image: ${oldFileName}`);
            }
        }

        return NextResponse.json({
            success: true,
            fileName: fileName,
            url: `/${fileName}`,
        });

    } catch (error) {
        console.error("❌ Erreur upload image:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'upload" },
            { status: 500 }
        );
    }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
