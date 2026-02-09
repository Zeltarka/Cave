// app/admin/contenu/champagne/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";

type BlocDescription = {
    type: "paragraphe";
    contenu: string;
};

type ChampagneContenu = {
    titre: string;
    prix: number;
    image: string;
    blocs_description: BlocDescription[];
};

function ChampagneEditor() {
    const [contenu, setContenu] = useState<ChampagneContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/champagne");
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

    const mettreAJourChamp = (champ: keyof ChampagneContenu, valeur: any) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const mettreAJourBloc = (index: number, nouveauContenu: string) => {
        setContenu(prev => {
            if (!prev) return null;
            const newBlocs = [...prev.blocs_description];
            newBlocs[index].contenu = nouveauContenu;
            return { ...prev, blocs_description: newBlocs };
        });
    };

    const ajouterBloc = () => {
        setContenu(prev => {
            if (!prev) return null;
            return {
                ...prev,
                blocs_description: [...prev.blocs_description, { type: "paragraphe", contenu: "" }]
            };
        });
    };

    const supprimerBloc = (index: number) => {
        setContenu(prev => {
            if (!prev) return null;
            return {
                ...prev,
                blocs_description: prev.blocs_description.filter((_, i) => i !== index)
            };
        });
    };

    const deplacerBloc = (index: number, direction: "haut" | "bas") => {
        if (!contenu) return;

        if (
            (direction === "haut" && index === 0) ||
            (direction === "bas" && index === contenu.blocs_description.length - 1)
        ) {
            return;
        }

        const newIndex = direction === "haut" ? index - 1 : index + 1;
        const newBlocs = [...contenu.blocs_description];
        [newBlocs[index], newBlocs[newIndex]] = [newBlocs[newIndex], newBlocs[index]];

        setContenu({ ...contenu, blocs_description: newBlocs });
    };

    const sauvegarder = async () => {
        if (!contenu) return;

        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/contenu/champagne", {
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
            afficherMessage(
                err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
                "error"
            );
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
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/admin/contenu"
                                className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium"
                            >
                                ← Retour aux pages
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">
                                Éditer Champagne
                            </h1>
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

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg border ${
                            messageType === "success"
                                ? "bg-green-50 text-green-800 border-green-200"
                                : "bg-red-50 text-red-800 border-red-200"
                        }`}
                    >
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Informations de base */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Informations de base</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Titre du produit
                                </label>
                                <input
                                    type="text"
                                    value={contenu.titre}
                                    onChange={(e) => mettreAJourChamp("titre", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Prix (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={contenu.prix}
                                    onChange={(e) => mettreAJourChamp("prix", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ImageUploader
                            currentImage={contenu.image}
                            onImageChange={(newImage) => mettreAJourChamp("image", newImage)}
                            label="Image du produit"
                        />
                    </div>

                    {/* Blocs de description */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Description du produit</h3>

                        <div className="space-y-6">
                            {contenu.blocs_description.map((bloc, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-medium text-gray-600">
                                            Bloc {index + 1}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => deplacerBloc(index, "haut")}
                                                disabled={index === 0}
                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => deplacerBloc(index, "bas")}
                                                disabled={index === contenu.blocs_description.length - 1}
                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => supprimerBloc(index)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                x
                                            </button>
                                        </div>
                                    </div>
                                    <RichTextEditor
                                        value={bloc.contenu}
                                        onChange={(newContent) => mettreAJourBloc(index, newContent)}
                                        placeholder="Décrivez le produit..."
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={ajouterBloc}
                            className="mt-4 w-full px-6 py-3 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium"
                        >
                            + Ajouter un bloc de description
                        </button>
                    </div>
                </div>

                {/* Bouton sauvegarder bas */}
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
        </div>
    );
}

export default function AdminChampagnePage() {
    return (
        <AdminGuard>
            <ChampagneEditor />
        </AdminGuard>
    );
}