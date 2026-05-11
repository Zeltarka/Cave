"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useMessages } from "@/hooks/useMessages";
import { useFraisPort } from "@/hooks/useFraisPort";
import ConfirmationModal from "@/components/ConfirmationModal";

// ── Types ────────────────────────────────────────────────────────────────────

type BlocDescription = { type: "paragraphe"; contenu: string };
type TypeProduit     = "bouteille" | "bag-in-box" | "libre";

type ProduitContenu = {
    titre:              string;
    prix:               number;
    image:              string;
    disponible?:        boolean;
    type?:              TypeProduit;
    fraisPortUnitaire?: number;
    blocs_description:  BlocDescription[];
};

type PanierItem = { id: string; quantite: number; type?: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function interpoler(template: string, quantite: number, nomProduit: string): string {
    return template
        .replace("{quantite}", String(quantite))
        .replace("{produit}", nomProduit);
}

function isBouteille(p: PanierItem): boolean {
    return p.type === "bouteille" || p.id === "champagne" || p.id === "rose";
}

// ── Composant ────────────────────────────────────────────────────────────────

export default function Page() {
    const { slug } = useParams() as { slug: string };

    const [quantite,    setQuantite]    = useState(6);
    const [message,     setMessage]     = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [showModal,   setShowModal]   = useState(false);
    const [disabled,    setDisabled]    = useState(false);
    const [contenu,     setContenu]     = useState<ProduitContenu | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [panierItems, setPanierItems] = useState<PanierItem[]>([]);

    const { messages } = useMessages();
    const { maxBouteilles, paliersBouteilles, maxBagInBox, paliersBagInBox } = useFraisPort();

    // ── Chargement initial ───────────────────────────────────────────────────

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/contenu/${slug}`).then(r => r.json()),
            fetch("/api/commandes").then(r => r.json()),
        ])
            .then(([cd, pd]) => {
                setContenu(cd.contenu);
                setPanierItems(Array.isArray(pd) ? pd : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);

    const fetchPanier = () =>
        fetch("/api/commandes")
            .then(r => r.json())
            .then((d: PanierItem[]) => setPanierItems(Array.isArray(d) ? d : []))
            .catch(console.error);

    // ── Dérivés ──────────────────────────────────────────────────────────────

    const type = contenu?.type ?? "bouteille";

    const totalBouteilles      = panierItems.filter(isBouteille).reduce((s, p) => s + p.quantite, 0);
    const maxDispoBouteilles   = maxBouteilles - totalBouteilles;
    const maxAtteintBouteilles = type === "bouteille" && maxDispoBouteilles <= 0;

    const totalBagInBox      = panierItems.filter(p => p.type === "bag-in-box").reduce((s, p) => s + p.quantite, 0);
    const maxDispoBagInBox   = maxBagInBox - totalBagInBox;
    const maxAtteintBagInBox = type === "bag-in-box" && maxDispoBagInBox <= 0;

    const maxAtteint = maxAtteintBouteilles || maxAtteintBagInBox;

    const paliersDisposBouteilles = paliersBouteilles.filter(q => q <= maxDispoBouteilles);
    const paliersDisposBagInBox   = paliersBagInBox.filter(q => q <= maxDispoBagInBox);

    // ── Initialise la quantité selon le type ─────────────────────────────────

    useEffect(() => {
        if (!contenu) return;
        if (type === "bouteille") {
            setQuantite(paliersDisposBouteilles[0] ?? paliersBouteilles[0] ?? 6);
        } else if (type === "bag-in-box") {
            setQuantite(paliersDisposBagInBox[0] ?? paliersBagInBox[0] ?? 3);
        } else {
            setQuantite(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contenu, maxDispoBouteilles, maxDispoBagInBox, paliersBouteilles.length, paliersBagInBox.length]);

    // ── Template de succès ───────────────────────────────────────────────────

    const getTemplateSucces = (): string => {
        if (!messages?.panier) return "";
        switch (type) {
            case "bouteille":  return messages.panier.ajout_succes_bouteille ?? "";
            case "bag-in-box": return messages.panier.ajout_succes_bag_in_box ?? "";
            case "libre":      return messages.panier.ajout_succes_libre ?? "";
            default:           return messages.panier.ajout_succes_bouteille ?? "";
        }
    };

    // ── Action panier ────────────────────────────────────────────────────────

    const ajouterAuPanier = async () => {
        if (disabled || !contenu || !messages || maxAtteint) return;
        setDisabled(true);

        try {
            const res  = await fetch("/api/commandes", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: slug, produit: contenu.titre, quantite, prix: contenu.prix, type }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || messages.panier.ajout_erreur);
                setMessageType("error");
                setShowModal(true);
                return;
            }

            window.dispatchEvent(new Event("cartUpdated"));
            fetchPanier();
            setMessage(interpoler(getTemplateSucces(), data.quantiteFinale ?? quantite, contenu.titre));
            setMessageType("success");
            setShowModal(true);
        } catch {
            setMessage(messages.panier.ajout_erreur);
            setMessageType("error");
            setShowModal(true);
        }
    };

    // ── Rendu ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-[#24586f] text-lg">Chargement...</div>
        </div>
    );

    if (!contenu) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-red-600">Contenu indisponible</div>
        </div>
    );

    const boutonDesactive =
        disabled ||
        maxAtteint ||
        (type === "bouteille"  && paliersDisposBouteilles.length === 0) ||
        (type === "bag-in-box" && paliersDisposBagInBox.length   === 0);

    const W         = "w-[330px]";
    const selectCls = `${W} h-12 sm:h-14 px-4 text-lg font-semibold text-[#24586f] dark:text-[#3a8fa8] border border-[#24586f] rounded-xl bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`;
    const boutonCls = `${W} h-14 sm:h-16 bg-[#24586f] border border-[#24586f] rounded-[20px] text-white font-medium text-base sm:text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

            <Link
                href="/boutique"
                className="inline-flex items-center gap-2 text-black dark:text-[#faf5f1] text-base sm:text-lg hover:underline mb-6 sm:mb-8"
            >
                ← Nos Produits
            </Link>

            <div className="flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-12 max-w-7xl mx-auto">

                {/* ── Image ── */}
                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                    <div className="relative w-full max-w-[300px] sm:max-w-[350px] lg:w-[400px] h-[400px] sm:h-[470px] lg:h-[540px] border border-[#24586f] rounded-[20px] overflow-hidden flex-shrink-0">
                        <Image
                            src={contenu.image}
                            alt={contenu.titre}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 300px, (max-width: 1024px) 350px, 400px"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full lg:max-w-[1000px]">

                    {/* ── Description ── */}
                    <div className="flex flex-col gap-4 sm:gap-5 flex-1">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-[30px] text-[#24586f] dark:text-[#3a8fa8] font-semibold mb-1">
                                {contenu.titre}
                            </h1>
                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">
                                {contenu.prix.toFixed(2)} €
                            </p>
                        </div>
                        <div className="bloc-contenu text-base sm:text-lg text-black dark:text-[#faf5f1] space-y-4">
                            {contenu.blocs_description.map((bloc, i) => (
                                <div key={i} dangerouslySetInnerHTML={{ __html: bloc.contenu }} />
                            ))}
                        </div>
                    </div>

                    {/* ── Bloc achat ── */}
                    <div className="border border-[#24586f] rounded-[20px] p-6 flex flex-col items-center gap-4 w-fit bg-[#faf5f1] dark:bg-[#1a1d27] self-start">

                        {contenu.disponible === false ? (
                            <div className="text-center py-4">
                                <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-3">INDISPONIBLE</div>
                                <p className="text-base text-gray-700 dark:text-gray-400">
                                    Ce produit est temporairement indisponible
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Message quota — masqué quand inactif */}
                                {maxAtteint && (
                                    <div className={`${W} p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 text-center`}>
                                        {type === "bouteille"
                                            ? <>Vous avez atteint le maximum de {maxBouteilles} bouteilles.</>
                                            : <>Vous avez atteint le maximum de {maxBagInBox} L en bag in box.</>
                                        }{" "}
                                        <Link href="/contact" className="underline">Contactez-nous</Link> pour une commande plus importante.
                                    </div>
                                )}

                                {/* Sélecteur de quantité */}
                                <div className="flex flex-col items-center gap-3">
                                    <label htmlFor="quantite" className="text-[#24586f] dark:text-[#3a8fa8] font-semibold">
                                        Quantité
                                    </label>

                                    {/* Bouteilles */}
                                    {type === "bouteille" && (
                                        <>
                                            <select
                                                id="quantite"
                                                value={quantite}
                                                onChange={e => setQuantite(parseInt(e.target.value))}
                                                disabled={maxAtteint}
                                                className={selectCls}
                                            >
                                                {paliersBouteilles.map(qty => (
                                                    <option key={qty} value={qty} disabled={qty > maxDispoBouteilles}>
                                                        {qty} bouteille{qty > 1 ? "s" : ""}
                                                        {qty > maxDispoBouteilles ? ` — max ${maxBouteilles} au total` : ""}
                                                    </option>
                                                ))}
                                                <option disabled value="">──────────────────</option>
                                                <option disabled value="">+ de {maxBouteilles} ? Contactez-nous</option>
                                            </select>
                                            {!maxAtteint && totalBouteilles > 0 && (
                                                <p className={`text-xs text-gray-500 dark:text-gray-400 text-center ${W}`}>
                                                    {totalBouteilles} bouteille{totalBouteilles > 1 ? "s" : ""} déjà dans le panier
                                                    — il reste {maxDispoBouteilles} place{maxDispoBouteilles > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* Bag-in-box */}
                                    {type === "bag-in-box" && (
                                        <>
                                            <select
                                                id="quantite"
                                                value={quantite}
                                                onChange={e => setQuantite(parseInt(e.target.value))}
                                                disabled={maxAtteint}
                                                className={selectCls}
                                            >
                                                {paliersBagInBox.map(qty => (
                                                    <option key={qty} value={qty} disabled={qty > maxDispoBagInBox}>
                                                        {qty} L{qty > maxDispoBagInBox ? ` — max ${maxBagInBox} L au total` : ""}
                                                    </option>
                                                ))}
                                                <option disabled value="">──────────────────</option>
                                                <option disabled value="">+ de {maxBagInBox} L ? Contactez-nous</option>
                                            </select>
                                            {!maxAtteint && totalBagInBox > 0 && (
                                                <p className={`text-xs text-gray-500 dark:text-gray-400 text-center ${W}`}>
                                                    {totalBagInBox} L déjà dans le panier
                                                    — il reste {maxDispoBagInBox} L
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {/* Libre */}
                                    {type === "libre" && (
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setQuantite(q => Math.max(1, q - 1))}
                                                className="w-10 h-10 border border-[#24586f] rounded-lg text-[#24586f] text-xl font-bold hover:bg-[#24586f] hover:text-white transition-colors"
                                            >−</button>
                                            <span className="text-xl font-semibold text-[#24586f] dark:text-[#3a8fa8] w-8 text-center">
                                                {quantite}
                                            </span>
                                            <button
                                                onClick={() => setQuantite(q => Math.min(99, q + 1))}
                                                className="w-10 h-10 border border-[#24586f] rounded-lg text-[#24586f] text-xl font-bold hover:bg-[#24586f] hover:text-white transition-colors"
                                            >+</button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={ajouterAuPanier}
                                    disabled={boutonDesactive}
                                    className={boutonCls}
                                >
                                    Ajouter au panier
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setDisabled(false); }}
                type={messageType}
                message={message}
                autoClose={true}
                autoCloseDelay={3000}
            />
        </div>
    );
}