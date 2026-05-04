"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploader from "@/components/ImageUploader";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useFraisPort } from "@/hooks/useFraisPort";

type BlocDescription = { type: "paragraphe"; contenu: string };

type ProduitContenu = {
    titre: string;
    prix: number;
    image: string;
    disponible: boolean;
    type: "bouteille" | "libre";
    blocs_description: BlocDescription[];
};

function ProduitEditor() {
    const { slug }   = useParams() as { slug: string };
    const router     = useRouter();
    const { maxBouteilles, paliers } = useFraisPort();

    const [contenu, setContenu]                   = useState<ProduitContenu | null>(null);
    const [loading, setLoading]                   = useState(true);
    const [saving, setSaving]                     = useState(false);
    const [deleting, setDeleting]                 = useState(false);
    const [modalOpen, setModalOpen]               = useState(false);
    const [modalType, setModalType]               = useState<"success" | "error">("success");
    const [modalTitle, setModalTitle]             = useState("");
    const [modalMessage, setModalMessage]         = useState("");
    const [deleteModalOpen, setDeleteModalOpen]   = useState(false);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

    useEffect(() => { fetchContenu(); }, [slug]);

    const fetchContenu = async () => {
        try {
            const res = await fetch(`/api/admin/contenu/${slug}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setContenu({ type: "bouteille", ...data.contenu });
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

    const set = (champ: keyof ProduitContenu, valeur: any) =>
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);

    const setBloc = (index: number, val: string) =>
        setContenu(prev => {
            if (!prev) return null;
            const blocs = [...prev.blocs_description];
            blocs[index] = { ...blocs[index], contenu: val };
            return { ...prev, blocs_description: blocs };
        });

    const ajouterBloc = () =>
        setContenu(prev => prev ? { ...prev, blocs_description: [...prev.blocs_description, { type: "paragraphe", contenu: "" }] } : null);

    const supprimerBloc = (i: number) =>
        setContenu(prev => prev ? { ...prev, blocs_description: prev.blocs_description.filter((_, idx) => idx !== i) } : null);

    const deplacerBloc = (i: number, dir: "haut" | "bas") => {
        if (!contenu) return;
        const j = dir === "haut" ? i - 1 : i + 1;
        if (j < 0 || j >= contenu.blocs_description.length) return;
        const blocs = [...contenu.blocs_description];
        [blocs[i], blocs[j]] = [blocs[j], blocs[i]];
        setContenu({ ...contenu, blocs_description: blocs });
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/contenu/${slug}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");

            const boutiqueRes = await fetch("/api/admin/contenu/boutique");
            if (boutiqueRes.ok) {
                const boutiqueData = await boutiqueRes.json();
                const updatedProduits = boutiqueData.contenu.produits.map((p: any) => {
                    const produitSlug = p.lien?.split("/").pop();
                    if (produitSlug === slug) {
                        return { ...p, nom: contenu.titre, prix: contenu.prix, image: contenu.image, disponible: contenu.disponible };
                    }
                    return p;
                });
                await fetch("/api/admin/contenu/boutique", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contenu: { ...boutiqueData.contenu, produits: updatedProduits } }),
                });
            }

            afficherMessage("Modifications sauvegardées !", "success");
            fetchContenu();
        } catch (err) {
            afficherMessage(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "error");
        } finally {
            setSaving(false);
        }
    };

    const supprimerPage = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/contenu/${slug}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json()).error || "Erreur suppression");

            const boutiqueRes = await fetch("/api/admin/contenu/boutique");
            if (boutiqueRes.ok) {
                const boutiqueData = await boutiqueRes.json();
                const updatedProduits = boutiqueData.contenu.produits.filter((p: any) => {
                    const produitSlug = p.lien?.split("/").pop();
                    return produitSlug !== slug;
                });
                await fetch("/api/admin/contenu/boutique", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contenu: { ...boutiqueData.contenu, produits: updatedProduits } }),
                });
            }

            setDeleteModalOpen(false);
            router.push("/admin/contenu");
        } catch (err) {
            setDeleteModalOpen(false);
            afficherMessage(err instanceof Error ? err.message : "Erreur lors de la suppression", "error");
        } finally {
            setDeleting(false);
        }
    };

    // Texte descriptif du type "bouteille" basé sur le vrai max
    const labelBouteille = paliers.length > 0
        ? `Bouteille — paliers ${paliers.join(" / ")}, quota partagé de ${maxBouteilles}`
        : `Bouteille — paliers par 6, quota partagé de ${maxBouteilles}`;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#24586f] mb-4"></div>
                <div className="text-[#24586f] text-xl font-medium">Chargement...</div>
            </div>
        </div>
    );
    if (!contenu) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <Link href="/admin/contenu" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                            ← Retour aux pages
                        </Link>
                        <h1 className="text-2xl font-bold text-[#24586f] capitalize">Éditer — {contenu.titre || slug}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setDeleteConfirmInput(""); setDeleteModalOpen(true); }}
                            className="px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                        >
                            Supprimer
                        </button>
                        <button onClick={sauvegarder} disabled={saving} className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Informations de base</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du produit</label>
                            <input type="text" value={contenu.titre} onChange={e => set("titre", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (€)</label>
                            <input type="number" step="0.01" value={contenu.prix} onChange={e => set("prix", parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de produit</label>
                            <select value={contenu.type} onChange={e => set("type", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] bg-white">
                                <option value="bouteille">{labelBouteille}</option>
                                <option value="libre">Libre — quantité de 1 à 99</option>
                            </select>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={contenu.disponible ?? true} onChange={e => set("disponible", e.target.checked)} className="w-5 h-5 text-[#24586f] border-gray-300 rounded focus:ring-[#24586f] cursor-pointer" />
                                <span className="text-sm font-semibold text-gray-700">Produit disponible à la vente</span>
                            </label>
                            {!contenu.disponible && <p className="text-sm text-red-600 mt-2 ml-8">Ce produit apparaîtra comme indisponible.</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <ImageUploader currentImage={contenu.image} onImageChange={img => set("image", img)} label="Image du produit" />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Description du produit</h3>
                    <div className="space-y-6">
                        {contenu.blocs_description.map((bloc, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-600">Bloc {i + 1}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => deplacerBloc(i, "haut")} disabled={i === 0} className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                                        <button onClick={() => deplacerBloc(i, "bas")} disabled={i === contenu.blocs_description.length - 1} className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                                        <button onClick={() => supprimerBloc(i)} className="p-1 text-red-600 hover:bg-red-50 rounded">✕</button>
                                    </div>
                                </div>
                                <RichTextEditor value={bloc.contenu} onChange={val => setBloc(i, val)} placeholder="Décrivez le produit..." />
                            </div>
                        ))}
                    </div>
                    <button onClick={ajouterBloc} className="mt-4 w-full px-6 py-3 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium">
                        + Ajouter un bloc de description
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 text-lg">⚠</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Supprimer cette page ?</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Cette action est <strong>irréversible</strong>. La page <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{slug}</code> et son entrée dans la boutique seront définitivement supprimées.
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                            Pour confirmer, saisissez <strong>{slug}</strong> ci-dessous :
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmInput}
                            onChange={e => setDeleteConfirmInput(e.target.value)}
                            placeholder={slug}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 mb-4 font-mono text-sm"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                                Annuler
                            </button>
                            <button
                                onClick={supprimerPage}
                                disabled={deleteConfirmInput !== slug || deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
                            >
                                {deleting ? "Suppression..." : "Supprimer définitivement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} type={modalType} title={modalTitle} message={modalMessage} />
        </div>
    );
}

export default function AdminProduitPage() {
    return <AdminGuard><ProduitEditor /></AdminGuard>;
}