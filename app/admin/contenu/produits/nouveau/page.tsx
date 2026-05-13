"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useFraisPort } from "@/hooks/useFraisPort";

const genererSlug = (titre: string) =>
    titre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

type TypeProduit = "bouteille" | "bag-in-box" | "libre";

function NouveauProduitForm() {
    const router = useRouter();
    const { maxBouteilles, paliersBouteilles, maxBagInBox, paliersBagInBox } = useFraisPort();

    const [titre, setTitre]           = useState("");
    const [slug, setSlug]             = useState("");
    const [slugManuel, setSlugManuel] = useState(false);
    const [prix, setPrix]             = useState<number>(0);
    const [type, setType]             = useState<TypeProduit>("bouteille");
    const [fraisPortUnitaire, setFraisPortUnitaire] = useState<number | "">(0);
    const [volumeBib, setVolumeBib]   = useState<number | "">("");
    const [saving, setSaving]         = useState(false);
    const [modalOpen, setModalOpen]   = useState(false);
    const [modalMsg, setModalMsg]     = useState("");

    const handleTitreChange = (val: string) => {
        setTitre(val);
        if (!slugManuel) setSlug(genererSlug(val));
    };

    const handleSlugChange = (val: string) => {
        setSlugManuel(true);
        setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, ""));
    };

    const creerProduit = async () => {
        if (!titre.trim() || !slug.trim() || prix <= 0) {
            setModalMsg("Veuillez remplir le titre, l'url et un prix valide.");
            setModalOpen(true);
            return;
        }

        setSaving(true);
        try {
            const check = await fetch(`/api/admin/contenu/${slug}`);
            if (check.ok) {
                setModalMsg(`Un produit avec le lien "${slug}" existe déjà.`);
                setModalOpen(true);
                setSaving(false);
                return;
            }

            const contenu = {
                titre: titre.trim(),
                prix,
                image: "",
                disponible: true,
                type,
                ...(type === "libre"      && { fraisPortUnitaire: Number(fraisPortUnitaire) || 0 }),
                ...(type === "bag-in-box" && Number(volumeBib) > 0 && { volumeBib: Number(volumeBib) }),
                blocs_description: [],
            };

            const res = await fetch(`/api/admin/contenu/${slug}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });
            if (!res.ok) throw new Error("Erreur création produit");

            const boutiqueRes = await fetch("/api/admin/contenu/boutique");
            if (boutiqueRes.ok) {
                const boutiqueData = await boutiqueRes.json();
                const updatedProduits = [
                    ...(boutiqueData.contenu.produits || []),
                    { nom: titre.trim(), prix, image: "", lien: `/boutique/${slug}`, disponible: true, type },
                ];
                await fetch("/api/admin/contenu/boutique", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contenu: { ...boutiqueData.contenu, produits: updatedProduits } }),
                });
            }

            router.push(`/admin/contenu/produits/${slug}`);
        } catch (err) {
            setModalMsg(err instanceof Error ? err.message : "Erreur lors de la création");
            setModalOpen(true);
            setSaving(false);
        }
    };

    const labelBouteille = paliersBouteilles.length > 0
        ? `Bouteille — paliers ${paliersBouteilles.join(" / ")}, max ${maxBouteilles}`
        : `Bouteille — paliers par 6, max ${maxBouteilles}`;

    const labelBagInBox = paliersBagInBox.length > 0
        ? `Bag in box — paliers ${paliersBagInBox.join(" / ")} L, max ${maxBagInBox} L`
        : `Bag in box — paliers par 3 L, max ${maxBagInBox} L`;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <Link href="/admin/contenu" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                            ← Retour aux pages
                        </Link>
                        <h1 className="text-2xl font-bold text-[#24586f]">Nouveau produit</h1>
                    </div>
                    <button onClick={creerProduit} disabled={saving} className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Création..." : "Créer le produit"}
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

                    {/* Titre */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du produit *</label>
                        <input type="text" value={titre} onChange={e => handleTitreChange(e.target.value)}
                               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Lien (URL) *
                            <span className="font-normal text-gray-500 ml-2">— /boutique/<span className="text-[#24586f]">{slug || "..."}</span></span>
                        </label>
                        <input type="text" value={slug} onChange={e => handleSlugChange(e.target.value)}
                               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] font-mono text-sm" />
                        <p className="text-xs text-gray-500 mt-1">Généré automatiquement depuis le titre.</p>
                    </div>

                    {/* Prix */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (€) *</label>
                        <input type="number" step="0.01" min="0" value={prix || ""} onChange={e => setPrix(parseFloat(e.target.value) || 0)}
                               placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]" />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type de produit *</label>
                        <select value={type} onChange={e => setType(e.target.value as TypeProduit)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] bg-white">
                            <option value="bouteille">{labelBouteille}</option>
                            <option value="bag-in-box">{labelBagInBox}</option>
                            <option value="libre">Libre — quantité de 1 à 99</option>
                        </select>
                    </div>

                    {/* Volume BIB — uniquement pour "bag-in-box" */}
                    {type === "bag-in-box" && (
                        <div >
                            <label className="block text-sm font-semibold text-[#24586f] mb-1">
                                Volume du bag in box (L)
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Affiché dans le sélecteur de quantité — ex : 4 bag in box de 5L
                            </p>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={volumeBib}
                                onChange={e => setVolumeBib(parseInt(e.target.value) || "")}
                                placeholder="ex : 5"
                                className="w-full px-4 py-2 border border-[#24586f]/30 rounded-lg focus:ring-2 focus:ring-[#24586f] bg-white"
                            />
                            {Number(volumeBib) > 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    Affichage : "3 bag in box de {volumeBib}L", "4 bag in box de {volumeBib}L"…
                                </p>
                            )}
                        </div>
                    )}

                    {/* Frais de port unitaire — uniquement pour "libre" */}
                    {type === "libre" && (
                        <div className="bg-[#f1f5ff] border border-[#24586f]/20 rounded-xl p-4">
                            <label className="block text-sm font-semibold text-[#24586f] mb-1">
                                Frais de port pour 1 unité (€)
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Le total est calculé automatiquement : frais × quantité commandée.
                            </p>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={fraisPortUnitaire}
                                onChange={e => setFraisPortUnitaire(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-[#24586f]/30 rounded-lg focus:ring-2 focus:ring-[#24586f] bg-white"
                            />
                            {Number(fraisPortUnitaire) > 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    2 commandés → {(Number(fraisPortUnitaire) * 2).toFixed(2)} € · 5 commandés → {(Number(fraisPortUnitaire) * 5).toFixed(2)} €
                                </p>
                            )}
                        </div>
                    )}

                    {/* Note */}
                    <div className="pt-2 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-[#24586f] font-medium">Après création</p>
                        <p className="text-sm text-gray-600 mt-1">Vous serez redirigé(e) vers l'éditeur pour ajouter l'image et la description.</p>
                    </div>
                </div>
            </main>

            <ConfirmationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} type="error" title="Erreur" message={modalMsg} />
        </div>
    );
}

export default function NouveauProduitPage() {
    return <AdminGuard><NouveauProduitForm /></AdminGuard>;
}