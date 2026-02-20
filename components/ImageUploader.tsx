"use client";
import React, { useState, useRef } from "react";

type ImageUploaderProps = {
    currentImage: string;
    onImageChange: (newImageUrl: string) => void;
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

        if (!file.type.startsWith("image/")) {
            setError("Le fichier doit être une image");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError("L'image doit faire moins de 20 MB");
            return;
        }

        setError("");
        setUploading(true);

        try {
            // Preview locale immédiate
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("oldFileName", currentImage);

            const res = await fetch("/api/admin/images/upload", {
                method: "POST",
                body: formData,
            });

            // ✅ FIX : vérifier le Content-Type avant de parser en JSON
            const contentType = res.headers.get("content-type");
            if (!contentType?.includes("application/json")) {
                const text = await res.text();
                console.error("Réponse non-JSON reçue:", text);
                throw new Error(`Erreur serveur (${res.status}) : réponse inattendue du serveur`);
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de l'upload");
            }

            onImageChange(data.fileName);
            setPreview(null);
            setError("");

            console.log("✅ Image uploadée:", data.fileName);

        } catch (err) {
            console.error("Erreur upload:", err);
            setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
            setPreview(null);
        } finally {
            setUploading(false);
            // Reset input pour permettre de re-sélectionner le même fichier
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getDisplayImage = () => {
        if (preview) return preview;
        if (!currentImage) return null;
        if (currentImage.startsWith("http")) return currentImage;
        return `/${currentImage}`;
    };

    const displayImage = getDisplayImage();

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
                {label}
            </label>

            <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={() => setError("Impossible de charger l'image")}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Aucune image
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                            <div className="text-sm">Upload en cours...</div>
                        </div>
                    </div>
                )}
            </div>

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

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG, WebP, SVG, GIF • Max 20 MB
            </p>

            {process.env.NODE_ENV === "development" && currentImage && (
                <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer">Debug info</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify({ currentImage, isUrl: currentImage.startsWith("http") }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}