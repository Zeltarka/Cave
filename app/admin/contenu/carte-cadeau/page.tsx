// app/admin/contenu/carte-cadeau/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ImageUploader from "@/components/ImageUploader";
import ConfirmationModal from "@/components/ConfirmationModal";

type CarteCadeauContenu = {
    titre: string;
    description: string;
    montant_minimum: number;
    image: string;
    suggestions: number[];
};

function CarteCadeauEditor() {
    const [contenu, setContenu] = useState<CarteCadeauContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // States pour la modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/carte-cadeau");
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
        setModalType(type);
        setModalTitle(type === "success" ? "Succès" : "Erreur");
        setModalMessage(msg);
        setModalOpen(true);
    };

    const mettreAJourChamp = (champ: keyof CarteCadeauContenu, valeur: any) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const mettreAJourSuggestion = (index: number, valeur: number) => {
        setContenu(prev => {
            if (!prev) return null;
            const newSuggestions = [...prev.suggestions];
            newSuggestions[index] = valeur;
            return { ...prev, suggestions: newSuggestions };
        });
    };

    const ajouterSuggestion = () => {
        setContenu(prev => {
            if (!prev) return null;
            return { ...prev, suggestions: [...prev.suggestions, 0] };
        });
    };

    const supprimerSuggestion = (index: number) => {
        setContenu(prev => {
            if (!prev) return null;
            return { ...prev, suggestions: prev.suggestions.filter((_, i) => i !== index) };
        });
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);

        try {
            const res = await fetch("/api/admin/contenu/carte-cadeau", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de la sauvegarde");
            }

            afficherMessage("Modifications sauvegardées avec succès !", "success");
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
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditer Carte Cadeau</h1>
                        </div>
                        <button onClick={sauvegarder} disabled={saving} className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Informations générales</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                                <input type="text" value={contenu.titre} onChange={(e) => mettreAJourChamp("titre", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea value={contenu.description} onChange={(e) => mettreAJourChamp("description", e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Montant minimum (€)</label>
                                <input type="number" value={contenu.montant_minimum} onChange={(e) => mettreAJourChamp("montant_minimum", parseInt(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ImageUploader currentImage={contenu.image} onImageChange={(newImage) => mettreAJourChamp("image", newImage)} label="Image carte cadeau" />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Suggestions de prix</h3>
                        <div className="space-y-3">
                            {contenu.suggestions.map((prix, index) => (
                                <div key={index} className="flex gap-2">
                                    <input type="number" value={prix} onChange={(e) => mettreAJourSuggestion(index, parseInt(e.target.value) || 0)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" placeholder="Prix en €" />
                                    <button onClick={() => supprimerSuggestion(index)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded">✕</button>
                                </div>
                            ))}
                            <button onClick={ajouterSuggestion} className="px-4 py-2 text-[#24586f] border border-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors text-sm">
                                + Ajouter une suggestion
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            {/* Modal de confirmation */}
            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    );
}

export default function AdminCarteCadeauPage() {
    return <AdminGuard><CarteCadeauEditor /></AdminGuard>;
}