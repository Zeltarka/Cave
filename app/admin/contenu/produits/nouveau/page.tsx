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

function NouveauProduitForm() {
    const router = useRouter();
    const { maxBouteilles, paliers } = useFraisPort();

    const [titre, setTitre]           = useState("");
    const [slug, setSlug]             = useState("");
    const [slugManuel, setSlugManuel] = useState(false);
    const [prix, setPrix]             = useState<number>(0);
    const [type, setType]             = useState<"bouteille" | "libre">("bouteille");
    const [saving, setSaving]         = useState(false);
    const [modalOpen, setModalOpen]   = useState(false);
    const [modalType, setModalType]   = useState<"success" | "error">("error");
    const [modalMessage, setModalMessage] = useState("");

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
            setModalType("error");
            setModalMessage("Veuillez remplir le titre, l'url et un prix valide.");
            setModalOpen(true);
            return;
        }

        setSaving(true);
        try {
            const check = await fetch(`/api/admin/contenu/${slug}`);
            if (check.ok) {
                setModalType("error");
                setModalMessage(`Un produit avec le lien "${slug}" existe déjà. Choisissez un autre titre ou modifiez le lien.`);
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
                const nouveauProduit = {
                    nom: titre.trim(),
                    prix,
                    image: "",
                    lien: `/boutique/${slug}`,
                    disponible: true,
                };
                const updatedProduits = [...(boutiqueData.contenu.produits || []), nouveauProduit];
                await fetch("/api/admin/contenu/boutique", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contenu: { ...boutiqueData.contenu, produits: updatedProduits } }),
                });
            }

            router.push(`/admin/contenu/produits/${slug}`);
        } catch (err) {
            setModalType("error");
            setModalMessage(err instanceof Error ? err.message : "Erreur lors de la création");
            setModalOpen(true);
            setSaving(false);
        }
    };

    // Texte descriptif du type "bouteille" basé sur le vrai max
    const labelBouteille = paliers.length > 0
        ? `Bouteille — paliers ${paliers.join(" / ")}, quota partagé de ${maxBouteilles}`
        : `Bouteille — paliers par 6, quota partagé de ${maxBouteilles}`;

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
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du produit *</label>
                        <input
                            type="text"
                            value={titre}
                            onChange={e => handleTitreChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Lien (URL) *
                            <span className="font-normal text-gray-500 ml-2">— /boutique/<span className="text-[#24586f]">{slug || "..."}</span></span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={e => handleSlugChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Généré automatiquement depuis le titre. Uniquement lettres minuscules, chiffres et tirets.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prix || ""}
                            onChange={e => setPrix(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type de produit *</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as "bouteille" | "libre")}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] bg-white"
                        >
                            <option value="bouteille">{labelBouteille}</option>
                            <option value="libre">Libre — quantité de 1 à 99</option>
                        </select>
                    </div>

                    <div className="pt-4 rounded-lg p-4">
                        <p className="text-sm text-[#24586f] font-medium">Après création</p>
                        <p className="text-sm text-gray-600 mt-1">Vous serez redirigé(e) vers l'éditeur pour ajouter l'image et la description. Le produit sera visible dans la boutique dès la première sauvegarde.</p>
                    </div>
                </div>
            </main>

            <ConfirmationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} type={modalType} title="Erreur" message={modalMessage} />
        </div>
    );
}

export default function NouveauProduitPage() {
    return <AdminGuard><NouveauProduitForm /></AdminGuard>;
}