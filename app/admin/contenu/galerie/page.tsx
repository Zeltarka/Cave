// app/admin/contenu/galerie/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ImageUploader from "@/components/ImageUploader";

type Photo = {
    image: string;
    legende: string;
    ordre: number;
};

type GalerieContenu = {
    titre: string;
    description: string;
    photos: Photo[];
};

function GalerieEditor() {
    const [contenu, setContenu] = useState<GalerieContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/galerie");
            if (!res.ok) throw new Error("Erreur chargement");
            const data = await res.json();
            setContenu(data.contenu);
        } catch (err) {
            console.error("Erreur:", err);
            afficherMessage("Erreur lors du chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const afficherMessage = (msg: string, type: "success" | "error" = "success") => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 4000);
    };

    const mettreAJourChamp = (champ: keyof GalerieContenu, valeur: any) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const mettreAJourPhoto = (index: number, champ: keyof Photo, valeur: any) => {
        setContenu(prev => {
            if (!prev) return null;
            const newPhotos = [...prev.photos];
            newPhotos[index] = { ...newPhotos[index], [champ]: valeur };
            return { ...prev, photos: newPhotos };
        });
    };

    const ajouterPhoto = () => {
        setContenu(prev => {
            if (!prev) return null;
            const maxOrdre = Math.max(...prev.photos.map(p => p.ordre), 0);
            return {
                ...prev,
                photos: [...prev.photos, { image: "", legende: "", ordre: maxOrdre + 1 }]
            };
        });
    };

    const supprimerPhoto = (index: number) => {
        setContenu(prev => {
            if (!prev) return null;
            return { ...prev, photos: prev.photos.filter((_, i) => i !== index) };
        });
    };

    const deplacerPhoto = (index: number, direction: "haut" | "bas") => {
        if (!contenu) return;

        if (
            (direction === "haut" && index === 0) ||
            (direction === "bas" && index === contenu.photos.length - 1)
        ) {
            return;
        }

        const newIndex = direction === "haut" ? index - 1 : index + 1;
        const newPhotos = [...contenu.photos];
        [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];

        // Réorganiser les ordres
        newPhotos.forEach((photo, i) => {
            photo.ordre = i + 1;
        });

        setContenu({ ...contenu, photos: newPhotos });
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/contenu/galerie", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de la sauvegarde");
            }

            afficherMessage("✅ Modifications sauvegardées avec succès", "success");
            fetchContenu();
        } catch (err) {
            console.error("Erreur sauvegarde:", err);
            afficherMessage(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#24586f] mb-4"></div>
                    <div className="text-[#24586f] text-xl font-medium">Chargement...</div>
                </div>
            </div>
        );
    }

    if (!contenu) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/contenu" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour aux pages
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditer Galerie Photo</h1>
                        </div>
                        <button onClick={sauvegarder} disabled={saving} className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg border ${messageType === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Informations générales */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Informations générales</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre de la page</label>
                                <input type="text" value={contenu.titre} onChange={(e) => mettreAJourChamp("titre", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea value={contenu.description} onChange={(e) => mettreAJourChamp("description", e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                            </div>
                        </div>
                    </div>

                    {/* Photos */}
                    {contenu.photos.map((photo, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-[#24586f]">Photo {index + 1}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => deplacerPhoto(index, "haut")} disabled={index === 0} className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                                    <button onClick={() => deplacerPhoto(index, "bas")} disabled={index === contenu.photos.length - 1} className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                                    <button onClick={() => supprimerPhoto(index)} className="p-2 text-red-600 hover:bg-red-50 rounded">🗑️</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ImageUploader
                                    currentImage={photo.image}
                                    onImageChange={(newImage) => mettreAJourPhoto(index, "image", newImage)}
                                    label="Image"
                                />
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Légende</label>
                                    <input type="text" value={photo.legende} onChange={(e) => mettreAJourPhoto(index, "legende", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" placeholder="Description de la photo" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Bouton ajouter photo */}
                    <button onClick={ajouterPhoto} className="w-full px-6 py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium">
                        + Ajouter une photo
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function AdminGaleriePage() {
    return <AdminGuard><GalerieEditor /></AdminGuard>;
}