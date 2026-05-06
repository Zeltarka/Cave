// app/admin/frais-port/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";

type Tranche = {
    id: string;
    quantite_min: number;
    frais: number;
};

const GAP_BOUTEILLES = 6;
const GAP_BAG_IN_BOX = 3;

const PALIERS_BOUTEILLES = [6, 12, 18, 24, 30, 36, 42, 48, 60, 72, 96];
const PALIERS_BAG_IN_BOX = [3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 48];

function ColonneTranches({
                             titre,
                             description,
                             tranches,
                             paliers,
                             gap,
                             couleur = "[#24586f]",
                             onChange,
                             onAjouter,
                             onSupprimer,
                         }: {
    titre: string;
    description: string;
    tranches: Tranche[];
    paliers: number[];
    gap: number;
    couleur?: string;
    onChange: (id: string, champ: keyof Tranche, val: number) => void;
    onAjouter: () => void;
    onSupprimer: (id: string) => void;
}) {
    const maxActuel = tranches.length > 0
        ? Math.max(...tranches.map(t => t.quantite_min))
        : 0;

    const triees = [...tranches].sort((a, b) => a.quantite_min - b.quantite_min);

    return (
        <div className="flex flex-col gap-4">
            {/* En-tête colonne */}
            <div>
                <h2 className="text-lg font-bold text-[#24586f]">{titre}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>

            {/* Récapitulatif max */}
            {tranches.length > 0 && (
                <div className="bg-[#f1f5ff] border border-[#24586f]/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Maximum actuel</p>
                        <p className="text-xl font-bold text-[#24586f]">{maxActuel}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Array.from({ length: Math.floor(maxActuel / gap) }, (_, i) => (i + 1) * gap).map(q => (
                            <span key={q} className="px-1.5 py-0.5 bg-white border border-[#24586f]/20 text-[#24586f] rounded text-xs font-medium">
                                {q}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tranches */}
            <div className="space-y-3">
                {triees.map((tranche, index) => (
                    <div key={tranche.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-semibold text-[#24586f]">
                                Tranche {index + 1}
                                {tranche.quantite_min === maxActuel && (
                                    <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-[#24586f] text-white rounded-full">
                                        max
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={() => onSupprimer(tranche.id)}
                                disabled={tranches.length <= 1}
                                className="text-red-500 hover:bg-red-50 px-2 py-0.5 rounded text-xs disabled:opacity-30"
                            >
                                Supprimer
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantité</label>
                                <select
                                    value={tranche.quantite_min}
                                    onChange={e => onChange(tranche.id, "quantite_min", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                >
                                    {paliers.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Frais (€)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={tranche.frais === 0 ? "" : tranche.frais}
                                    onChange={e => onChange(tranche.id, "frais", parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onAjouter}
                className="w-full px-4 py-3 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors text-sm font-medium"
            >
                + Ajouter ({maxActuel + gap})
            </button>
        </div>
    );
}

function FraisPortEditor() {
    const [bouteilles, setBouteilles] = useState<Tranche[]>([]);
    const [bagInBox,   setBagInBox]   = useState<Tranche[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);

    const [modalOpen, setModalOpen]       = useState(false);
    const [modalType, setModalType]       = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle]     = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => { fetchFrais(); }, []);

    const fetchFrais = async () => {
        try {
            const res = await fetch("/api/admin/frais-port");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setBouteilles(data.bouteilles ?? []);
            setBagInBox(data.bagInBox ?? []);
        } catch {
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

    // ── Helpers génériques ──
    const mettreAJour = (
        setter: React.Dispatch<React.SetStateAction<Tranche[]>>,
        id: string, champ: keyof Tranche, val: number
    ) => setter(prev => prev.map(t => t.id === id ? { ...t, [champ]: val } : t));

    const ajouter = (
        setter: React.Dispatch<React.SetStateAction<Tranche[]>>,
        tranches: Tranche[], gap: number
    ) => {
        const maxActuel = tranches.length > 0 ? Math.max(...tranches.map(t => t.quantite_min)) : 0;
        setter(prev => [...prev, { id: `new-${Date.now()}`, quantite_min: maxActuel + gap, frais: 0 }]);
    };

    const supprimer = async (
        setter: React.Dispatch<React.SetStateAction<Tranche[]>>,
        tranches: Tranche[], id: string
    ) => {
        if (tranches.length <= 1) {
            afficherMessage("Vous devez garder au moins une tranche", "error");
            return;
        }
        try {
            if (!id.startsWith("new-")) {
                const res = await fetch("/api/admin/frais-port", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });
                if (!res.ok) throw new Error();
            }
            setter(prev => prev.filter(t => t.id !== id));
            afficherMessage("Tranche supprimée", "success");
        } catch {
            afficherMessage("Erreur lors de la suppression", "error");
        }
    };

    const sauvegarder = async () => {
        // Vérifier doublons dans chaque catégorie
        const checkDoublons = (tranches: Tranche[], label: string) => {
            const vals = tranches.map(t => t.quantite_min);
            const doublons = vals.filter((v, i) => vals.indexOf(v) !== i);
            if (doublons.length > 0) {
                afficherMessage(`${label} — valeurs en double : ${doublons.join(", ")}`, "error");
                return false;
            }
            return true;
        };
        if (!checkDoublons(bouteilles, "Bouteilles")) return;
        if (!checkDoublons(bagInBox,   "Bag in box")) return;

        setSaving(true);
        try {
            const res = await fetch("/api/admin/frais-port", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bouteilles, bagInBox }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");
            afficherMessage("Frais de port sauvegardés !", "success");
            fetchFrais();
        } catch (err) {
            afficherMessage(err instanceof Error ? err.message : "Erreur", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#24586f] mb-4" />
                <div className="text-[#24586f] text-xl font-medium">Chargement...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Deux colonnes côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Gauche : Bag in box */}
                    <ColonneTranches
                        titre="Bag in box"
                        description="Paliers par 3 litres"
                        tranches={bagInBox}
                        paliers={PALIERS_BAG_IN_BOX}
                        gap={GAP_BAG_IN_BOX}
                        onChange={(id, champ, val) => mettreAJour(setBagInBox, id, champ, val)}
                        onAjouter={() => ajouter(setBagInBox, bagInBox, GAP_BAG_IN_BOX)}
                        onSupprimer={id => supprimer(setBagInBox, bagInBox, id)}
                    />

                    {/* Droite : Bouteilles */}
                    <ColonneTranches
                        titre="Bouteilles"
                        description="Paliers par 6 bouteilles"
                        tranches={bouteilles}
                        paliers={PALIERS_BOUTEILLES}
                        gap={GAP_BOUTEILLES}
                        onChange={(id, champ, val) => mettreAJour(setBouteilles, id, champ, val)}
                        onAjouter={() => ajouter(setBouteilles, bouteilles, GAP_BOUTEILLES)}
                        onSupprimer={id => supprimer(setBouteilles, bouteilles, id)}
                    />
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200">
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