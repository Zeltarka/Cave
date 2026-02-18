// app/admin/contenu/home/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ImageUploader from "@/components/ImageUploader";
import ConfirmationModal from "@/components/ConfirmationModal";

type HomeContenu = {
    image_principale: string;
    image_mobile?: string;
    alt: string;
    texte_bandeau?: string;
};

function HomeEditor() {
    const [contenu, setContenu] = useState<HomeContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [showModal, setShowModal] = useState(false);

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
        setShowModal(true);
    };

    const mettreAJourChamp = (champ: keyof HomeContenu, valeur: string) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);

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

            afficherMessage("Modifications sauvegardées avec succès", "success");
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
                        <button
                            onClick={sauvegarder}
                            disabled={saving}
                            className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm"
                        >
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">

                    {/* Bandeau texte */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Texte bandeau (optionnel)
                        </label>
                        <input
                            type="text"
                            value={contenu.texte_bandeau || ""}
                            onChange={(e) => mettreAJourChamp("texte_bandeau", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                            placeholder="Ex: Bienvenue à La Cave !"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            Affiché en haut de la page d'accueil. Laissez vide pour ne rien afficher.
                        </p>
                    </div>

                    {/* Image principale - Desktop */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ImageUploader
                            currentImage={contenu.image_principale}
                            onImageChange={(newImage) => mettreAJourChamp("image_principale", newImage)}
                            label="Image PC"
                        />

                    </div>

                    {/* Image mobile */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ImageUploader
                            currentImage={contenu.image_mobile || ""}
                            onImageChange={(newImage) => mettreAJourChamp("image_mobile", newImage)}
                            label="Image mobile"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            Si non renseignée, l'image ordinateur sera utilisée sur mobile.
                        </p>

                    </div>

                    {/* Texte alternatif */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Texte alternatif (accessibilité)
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
                    <button
                        onClick={sauvegarder}
                        disabled={saving}
                        className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm"
                    >
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={messageType}
                title={messageType === "success" ? "Succès" : "Erreur"}
                message={message}
            />
        </div>
    );
}

export default function AdminHomePage() {
    return <AdminGuard><HomeEditor /></AdminGuard>;
}