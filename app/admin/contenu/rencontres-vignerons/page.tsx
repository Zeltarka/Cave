// app/admin/contenu/rencontres-vignerons/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";
import ConfirmationModal from "@/components/ConfirmationModal";

type Bloc = {
    type: "titre" | "paragraphe";
    contenu: string;
};

type Rencontre = {
    id: string;
    date: string;
    blocs: Bloc[];
    image?: string;
};

type RencontresContenu = {
    titre: string;
    rencontres: Rencontre[];
};

function RencontresEditor() {
    const [contenu, setContenu] = useState<RencontresContenu>({ titre: "Rencontres Vignerons", rencontres: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalMessage, setModalMessage] = useState("");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => { fetchContenu(); }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/rencontres-vignerons");
            if (!res.ok) throw new Error("Erreur chargement");
            const data = await res.json();
            if (data.contenu?.blocs && !data.contenu?.rencontres) {
                setContenu({ titre: "Rencontres Vignerons", rencontres: [] });
            } else {
                setContenu({ titre: "Rencontres Vignerons", rencontres: [], ...data.contenu });
            }
        } catch (err) {
            afficherMessage("Erreur lors du chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const afficherMessage = (msg: string, type: "success" | "error" = "success") => {
        setModalType(type);
        setModalMessage(msg);
        setShowModal(true);
    };

    const telechargerPDF = async () => {
        try {
            const res = await fetch("/api/admin/rencontres-vignerons/pdf");
            if (!res.ok) throw new Error("Erreur génération PDF");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "rencontres-vignerons.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            afficherMessage("Erreur lors de la génération du PDF", "error");
        }
    };

    const toggleCollapse = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getTitreRencontre = (rencontre: Rencontre): string => {
        const titreBloc = rencontre.blocs.find(b => b.type === "titre");
        if (titreBloc?.contenu) {
            return titreBloc.contenu.replace(/<[^>]*>/g, "").trim() || "Sans titre";
        }
        return "Sans titre";
    };

    const ajouterRencontre = () => {
        const newRencontre: Rencontre = {
            id: Date.now().toString(),
            date: new Date().toISOString().split("T")[0],
            blocs: [{ type: "titre", contenu: "" }, { type: "paragraphe", contenu: "" }],
            image: "",
        };
        setContenu(prev => ({ ...prev, rencontres: [newRencontre, ...prev.rencontres] }));
    };

    const supprimerRencontre = (id: string) => {
        setContenu(prev => ({ ...prev, rencontres: prev.rencontres.filter(r => r.id !== id) }));
    };

    const mettreAJourRencontre = (id: string, champ: keyof Rencontre, valeur: any) => {
        setContenu(prev => ({
            ...prev,
            rencontres: prev.rencontres.map(r => r.id === id ? { ...r, [champ]: valeur } : r)
        }));
    };

    const mettreAJourBloc = (rencontreId: string, blocIndex: number, nouveauContenu: string) => {
        setContenu(prev => ({
            ...prev,
            rencontres: prev.rencontres.map(r =>
                r.id === rencontreId
                    ? { ...r, blocs: r.blocs.map((b, i) => i === blocIndex ? { ...b, contenu: nouveauContenu } : b) }
                    : r
            )
        }));
    };

    const ajouterBloc = (rencontreId: string) => {
        setContenu(prev => ({
            ...prev,
            rencontres: prev.rencontres.map(r =>
                r.id === rencontreId
                    ? { ...r, blocs: [...r.blocs, { type: "paragraphe", contenu: "" }] }
                    : r
            )
        }));
    };

    const supprimerBloc = (rencontreId: string, blocIndex: number) => {
        setContenu(prev => ({
            ...prev,
            rencontres: prev.rencontres.map(r =>
                r.id === rencontreId
                    ? { ...r, blocs: r.blocs.filter((_, i) => i !== blocIndex) }
                    : r
            )
        }));
    };

    const deplacerBloc = (rencontreId: string, blocIndex: number, direction: "haut" | "bas") => {
        setContenu(prev => ({
            ...prev,
            rencontres: prev.rencontres.map(r => {
                if (r.id !== rencontreId) return r;
                const blocs = [...r.blocs];
                const newIndex = direction === "haut" ? blocIndex - 1 : blocIndex + 1;
                if (newIndex < 0 || newIndex >= blocs.length) return r;
                [blocs[blocIndex], blocs[newIndex]] = [blocs[newIndex], blocs[blocIndex]];
                return { ...r, blocs };
            })
        }));
    };

    const deplacerRencontre = (index: number, direction: "haut" | "bas") => {
        const rencontres = [...contenu.rencontres];
        const newIndex = direction === "haut" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= rencontres.length) return;
        [rencontres[index], rencontres[newIndex]] = [rencontres[newIndex], rencontres[index]];
        setContenu(prev => ({ ...prev, rencontres }));
    };

    const sauvegarder = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/contenu/rencontres-vignerons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");
            afficherMessage("Modifications sauvegardées avec succès", "success");
            fetchContenu();
        } catch (err) {
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
                            <Link href="/admin/contenu" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour aux pages
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditer Rencontres Vignerons</h1>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={telechargerPDF}
                                className="px-5 py-2.5 bg-white border border-[#24586f] text-[#24586f] rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm text-sm"
                            >
                                Télécharger PDF
                            </button>
                            <button
                                onClick={sauvegarder}
                                disabled={saving}
                                className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm"
                            >
                                {saving ? "Sauvegarde..." : "Sauvegarder"}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Titre de la page */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre de la page</label>
                    <input
                        type="text"
                        value={contenu.titre || ""}
                        onChange={(e) => setContenu(prev => ({ ...prev, titre: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                        placeholder="Rencontres Vignerons"
                    />
                </div>

                {/* Bouton ajouter */}
                <button onClick={ajouterRencontre} className="w-full px-6 py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium mb-8">
                    + Ajouter une rencontre
                </button>

                <div className="space-y-4">
                    {contenu.rencontres.map((rencontre, rIndex) => {
                        const isCollapsed = collapsed[rencontre.id] ?? false;
                        const titreAffiche = getTitreRencontre(rencontre);

                        return (
                            <div key={rencontre.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                                {/* Header rencontre — cliquable pour réduire */}
                                <div
                                    className="bg-[#24586f] px-6 py-4 flex justify-between items-center cursor-pointer select-none"
                                    onClick={() => toggleCollapse(rencontre.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-white text-lg font-semibold truncate max-w-xs">
                                            {titreAffiche}
                                        </span>
                                        <input
                                            type="date"
                                            value={rencontre.date}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                mettreAJourRencontre(rencontre.id, "date", e.target.value);
                                            }}
                                            className="px-3 py-1 rounded text-sm bg-white text-[#24586f] font-medium border-0 focus:ring-2 focus:ring-white"
                                        />
                                        <span className="text-white/70 text-sm">{isCollapsed ? "▼" : "▲"}</span>
                                    </div>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => deplacerRencontre(rIndex, "haut")} disabled={rIndex === 0} className="p-1.5 text-white hover:bg-white/20 rounded disabled:opacity-30">↑</button>
                                        <button onClick={() => deplacerRencontre(rIndex, "bas")} disabled={rIndex === contenu.rencontres.length - 1} className="p-1.5 text-white hover:bg-white/20 rounded disabled:opacity-30">↓</button>
                                        <button onClick={() => supprimerRencontre(rencontre.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>

                                {/* Contenu — masqué si réduit */}
                                {!isCollapsed && (
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                                        {/* Blocs texte — 2/3 */}
                                        <div className="lg:col-span-2 space-y-4">
                                            {rencontre.blocs.map((bloc, bIndex) => (
                                                <div key={bIndex} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{bloc.type}</span>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => deplacerBloc(rencontre.id, bIndex, "haut")} disabled={bIndex === 0} className="p-1 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30 text-sm">↑</button>
                                                            <button onClick={() => deplacerBloc(rencontre.id, bIndex, "bas")} disabled={bIndex === rencontre.blocs.length - 1} className="p-1 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30 text-sm">↓</button>
                                                            {bloc.type === "paragraphe" && (
                                                                <button onClick={() => supprimerBloc(rencontre.id, bIndex)} className="p-1 text-red-500 hover:bg-red-50 rounded text-sm">✕</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <RichTextEditor
                                                        value={bloc.contenu}
                                                        onChange={(val) => mettreAJourBloc(rencontre.id, bIndex, val)}
                                                        placeholder={bloc.type === "titre" ? "Titre de la rencontre..." : "Description..."}
                                                    />
                                                </div>
                                            ))}
                                            <button onClick={() => ajouterBloc(rencontre.id)} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-[#24586f] hover:text-[#24586f] transition-colors text-sm">
                                                + Ajouter un paragraphe
                                            </button>
                                        </div>

                                        {/* Image — 1/3 */}
                                        <div className="lg:col-span-1 space-y-2">
                                            <ImageUploader
                                                currentImage={rencontre.image || ""}
                                                onImageChange={(url) => mettreAJourRencontre(rencontre.id, "image", url)}
                                                label="Image de la rencontre (optionnelle)"
                                            />
                                            {rencontre.image && (
                                                <button
                                                    onClick={() => mettreAJourRencontre(rencontre.id, "image", "")}
                                                    className="w-full py-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                                                >
                                                    Supprimer l'image
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {contenu.rencontres.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                            {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                        </button>
                    </div>
                )}
            </main>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                title={modalType === "success" ? "Succès" : "Erreur"}
                message={modalMessage}
            />
        </div>
    );
}

export default function AdminRencontresPage() {
    return <AdminGuard><RencontresEditor /></AdminGuard>;
}