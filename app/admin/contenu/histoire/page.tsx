// app/admin/contenu/histoire/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ConfirmationModal from "@/components/ConfirmationModal";

type Bloc = {
    type: "titre" | "paragraphe";
    contenu: string;
    style?: {
        fontWeight?: string;
        color?: string;
        fontSize?: string;
    };
};

type HistoireContenu = {
    blocs: Bloc[];
};

function HistoireEditor() {
    const [contenu, setContenu] = useState<HistoireContenu>({ blocs: [] });
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
            const res = await fetch("/api/admin/contenu/histoire");
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

    const mettreAJourBloc = (index: number, nouveauContenu: string) => {
        setContenu(prev => ({
            blocs: prev.blocs.map((bloc, i) =>
                i === index ? { ...bloc, contenu: nouveauContenu } : bloc
            )
        }));
    };

    const ajouterBloc = () => {
        setContenu(prev => ({
            blocs: [...prev.blocs, { type: "paragraphe", contenu: "" }]
        }));
    };

    const supprimerBloc = (index: number) => {
        setContenu(prev => ({
            blocs: prev.blocs.filter((_, i) => i !== index)
        }));
    };

    const deplacerBloc = (index: number, direction: "haut" | "bas") => {
        if (
            (direction === "haut" && index === 0) ||
            (direction === "bas" && index === contenu.blocs.length - 1)
        ) {
            return;
        }

        const newIndex = direction === "haut" ? index - 1 : index + 1;
        const newBlocs = [...contenu.blocs];
        [newBlocs[index], newBlocs[newIndex]] = [newBlocs[newIndex], newBlocs[index]];

        setContenu({ blocs: newBlocs });
    };

    const sauvegarder = async () => {
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/contenu/histoire", {
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
                                Éditer Histoire
                            </h1>
                        </div>
                        <button
                            onClick={sauvegarder}
                            disabled={saving}
                            className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
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

                {/* Blocs */}
                <div className="space-y-6">
                    {contenu.blocs.map((bloc, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                        >
                            {/* En-tête du bloc */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-[#24586f] text-white text-sm rounded-full font-medium">
                                        Bloc {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-600 capitalize">
                                        {bloc.type}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    {/* Flèches déplacement */}
                                    <button
                                        onClick={() => deplacerBloc(index, "haut")}
                                        disabled={index === 0}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Déplacer vers le haut"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => deplacerBloc(index, "bas")}
                                        disabled={index === contenu.blocs.length - 1}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Déplacer vers le bas"
                                    >
                                        ↓
                                    </button>

                                    {/* Supprimer */}
                                    {bloc.type === "paragraphe" &&(
                                        <button
                                        onClick={() => supprimerBloc(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        title="Supprimer ce bloc"
                                    >
                                        x
                                    </button>)}
                                </div>
                            </div>

                            {/* Éditeur */}
                            <RichTextEditor
                                value={bloc.contenu}
                                onChange={(newContent) => mettreAJourBloc(index, newContent)}
                                placeholder={
                                    bloc.type === "titre"
                                        ? "Entrez un titre..."
                                        : "Entrez un paragraphe..."
                                }
                            />
                        </div>
                    ))}
                </div>

                {/* Bouton ajouter */}
                <div className="mt-8">
                    <button
                        onClick={ajouterBloc}
                        className="w-full px-6 py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium"
                    >
                        + Ajouter un bloc de texte
                    </button>
                </div>

                {/* Bouton sauvegarder bas */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={sauvegarder}
                        disabled={saving}
                        className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                    >
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            {/* Modale de confirmation */}
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={messageType}
                title={messageType === "success" ? "Succès" : "Erreur"}
                message={message}
                autoClose={messageType === "success"}
                autoCloseDelay={2000}
            />
        </div>
    );
}

export default function AdminHistoirePage() {
    return (
        <AdminGuard>
            <HistoireEditor />
        </AdminGuard>
    );
}