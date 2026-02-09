// app/admin/frais-port/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";

type FraisPort = {
    id: string;
    bouteilles_min: number;
    frais: number;
};

function FraisPortEditor() {
    const [frais, setFrais] = useState<FraisPort[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // States pour la modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        fetchFrais();
    }, []);

    const fetchFrais = async () => {
        try {
            const res = await fetch("/api/frais-port");
            if (!res.ok) throw new Error("Erreur chargement");
            const data = await res.json();
            setFrais(data);
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

    const mettreAJourFrais = (id: string, champ: keyof FraisPort, valeur: number) => {
        setFrais(prev =>
            prev.map(f => f.id === id ? { ...f, [champ]: valeur } : f)
        );
    };

    const ajouterTranche = () => {
        const maxBouteilles = Math.max(...frais.map(f => f.bouteilles_min), 0);
        const nouvelleTranche: FraisPort = {
            id: `new-${Date.now()}`,
            bouteilles_min: maxBouteilles + 6,
            frais: 0,
        };
        setFrais(prev => [...prev, nouvelleTranche]);
    };

    const supprimerTranche = async (id: string) => {
        if (frais.length <= 1) {
            afficherMessage("Vous devez garder au moins une tranche", "error");
            return;
        }

        try {
            if (!id.startsWith("new-")) {
                const res = await fetch("/api/frais-port", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });

                if (!res.ok) throw new Error("Erreur suppression");
            }

            setFrais(prev => prev.filter(f => f.id !== id));
            afficherMessage("Tranche supprimée avec succès !", "success");
        } catch (err) {
            console.error("Erreur:", err);
            afficherMessage("Erreur lors de la suppression", "error");
        }
    };

    const sauvegarder = async () => {
        setSaving(true);

        try {
            const res = await fetch("/api/frais-port", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frais }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de la sauvegarde");
            }

            afficherMessage("Frais de port sauvegardés avec succès !", "success");
            fetchFrais();
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

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour à l'admin
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Gérer les Frais de Port</h1>
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
                <div className="space-y-4">
                    {frais.map((tranche, index) => (
                        <div key={tranche.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-[#24586f]">Tranche {index + 1}</h3>
                                <button
                                    onClick={() => supprimerTranche(tranche.id)}
                                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                    disabled={frais.length <= 1}
                                >
                                    Supprimer
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nombre de bouteilles
                                    </label>
                                    <select
                                        value={tranche.bouteilles_min}
                                        onChange={(e) =>
                                            mettreAJourFrais(
                                                tranche.id,
                                                "bouteilles_min",
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    >
                                        {[6, 12, 18, 24, 30, 36, 42, 48].map((value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Frais de port (€)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={tranche.frais === 0 ? '' : tranche.frais}
                                        onChange={(e) => mettreAJourFrais(tranche.id, "frais", parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={ajouterTranche}
                    className="mt-6 w-full px-6 py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium"
                >
                    + Ajouter une tranche
                </button>

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

export default function AdminFraisPortPage() {
    return <AdminGuard><FraisPortEditor /></AdminGuard>;
}