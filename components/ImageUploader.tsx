// components/ImageUploader.tsx
"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";

type ImageUploaderProps = {
    currentImage: string;
    onImageChange: (newImageName: string) => void;
    label: string;
};

export default function ImageUploader({ currentImage, onImageChange, label }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifications
        if (!file.type.startsWith("image/")) {
            setError("Le fichier doit être une image");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("L'image doit faire moins de 5 MB");
            return;
        }

        setError("");
        setUploading(true);

        try {
            // Créer une preview locale
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload vers l'API
            const formData = new FormData();
            formData.append("file", file);
            formData.append("oldFileName", currentImage);

            const res = await fetch("/api/admin/images/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de l'upload");
            }

            // Mettre à jour le nom du fichier (sans /public/)
            onImageChange(data.fileName);
            setError("");

        } catch (err) {
            console.error("Erreur upload:", err);
            setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const displayImage = preview || `/${currentImage}`;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
                {label}
            </label>

            {/* Prévisualisation */}
            <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt="Preview"
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Aucune image
                    </div>
                )}
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                    {uploading ? "Upload en cours..." : "Changer l'image"}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Erreur */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG, WebP, SVG • Max 5 MB
            </p>
        </div>
    );
}