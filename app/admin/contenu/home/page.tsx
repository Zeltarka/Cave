// app/admin/contenu/home/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ImageUploader from "@/components/ImageUploader";

type HomeContenu = {
    image_principale: string;
    alt: string;
    texte_bandeau?: string;
};

function HomeEditor() {
    const [contenu, setContenu] = useState<HomeContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/home");
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

    const mettreAJourChamp = (champ: keyof HomeContenu, valeur: string) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/contenu/home", {
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
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditer Accueil</h1>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Texte bandeau (optionnel)
                        </label>
                        <input
                            type="text"
                            value={contenu.texte_bandeau || ""}
                            onChange={(e) => mettreAJourChamp("texte_bandeau", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"

                        />
                        <p className="text-sm text-gray-500 mt-2">
                            Ce texte s'affichera en haut de la page, au-dessus de l'image. Laissez vide pour ne rien afficher.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ImageUploader
                            currentImage={contenu.image_principale}
                            onImageChange={(newImage) => mettreAJourChamp("image_principale", newImage)}
                            label="Image principale de la page d'accueil"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Texte alternatif (pour l'accessibilité)
                        </label>
                        <input
                            type="text"
                            value={contenu.alt}
                            onChange={(e) => mettreAJourChamp("alt", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                            placeholder="Ex: La Cave - Caviste à La Garenne-Colombes"
                        />
                    </div>
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

export default function AdminHomePage() {
    return <AdminGuard><HomeEditor /></AdminGuard>;
}