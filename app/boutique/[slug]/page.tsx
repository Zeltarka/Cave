"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useMessages } from "@/hooks/useMessages";
import { useFraisPort } from "@/hooks/useFraisPort";
import { construireMessageAjout } from "@/lib/messagesPanier";
import ConfirmationModal from "@/components/ConfirmationModal";

type BlocDescription = { type: "paragraphe"; contenu: string };

type ProduitContenu = {
    titre: string;
    prix: number;
    image: string;
    disponible?: boolean;
    type?: "bouteille" | "libre";
    blocs_description: BlocDescription[];
};

type PanierItem = { id: string; quantite: number; type?: string };

const isBouteille = (c: ProduitContenu | null) =>
    !c || c.type === undefined || c.type === "bouteille";

export default function Page() {
    const { slug } = useParams() as { slug: string };

    const [quantite, setQuantite]       = useState(6);
    const [message, setMessage]         = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [showModal, setShowModal]     = useState(false);
    const [disabled, setDisabled]       = useState(false);
    const [contenu, setContenu]         = useState<ProduitContenu | null>(null);
    const [loading, setLoading]         = useState(true);
    const [panierItems, setPanierItems] = useState<PanierItem[]>([]);

    const { messages }               = useMessages();
    const { maxBouteilles, paliersBouteilles } = useFraisPort();

    const fetchPanier = () => {
        fetch("/api/commandes")
            .then(res => res.json())
            .then((data: PanierItem[]) => setPanierItems(Array.isArray(data) ? data : []))
            .catch(() => {});
    };

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/contenu/${slug}`).then(r => r.json()),
            fetch("/api/commandes").then(r => r.json()),
        ])
            .then(([contenuData, panierData]) => {
                setContenu(contenuData.contenu);
                setPanierItems(Array.isArray(panierData) ? panierData : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    const totalAutresBouteilles = panierItems
        .filter(p => p.id !== slug && (p.type === "bouteille" || p.id === "champagne" || p.id === "rose"))
        .reduce((sum, p) => sum + p.quantite, 0);

    const estBouteille  = isBouteille(contenu);
    const maxDispo      = estBouteille ? maxBouteilles - totalAutresBouteilles : 99;
    const maxAtteint    = estBouteille && maxDispo <= 0;
    const paliersDispos = paliersBouteilles.filter(q => q <= maxDispo);

    useEffect(() => {
        if (!contenu) return;
        if (isBouteille(contenu)) {
            setQuantite(paliersDispos.length > 0 ? paliersDispos[0] : paliersBouteilles[0] ?? 6);
        } else {
            setQuantite(1);
        }
    }, [contenu, maxDispo, paliersBouteilles.length]);

    const ajouterAuPanier = async () => {
        if (disabled || !contenu || !messages || maxAtteint) return;
        setDisabled(true);
        try {
            const res  = await fetch("/api/commandes", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id:       slug,
                    produit:  contenu.titre,
                    quantite,
                    prix:     contenu.prix,
                    type:     isBouteille(contenu) ? "bouteille" : "libre",
                }),
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

            setMessage(
                construireMessageAjout({
                    template:     messages.panier.ajout_succes,
                    nomProduit:   contenu.titre,
                    quantite:     data.quantiteFinale ?? quantite,
                    maxBouteilles,
                    estBouteille,
                })
            );
            setMessageType("success");
            setShowModal(true);
        } catch {
            setMessage(messages.panier.ajout_erreur);
            setMessageType("error");
            setShowModal(true);
        }
    };

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

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/boutique" className="inline-flex items-center gap-2 text-black dark:text-[#faf5f1] text-base sm:text-lg hover:underline mb-6 sm:mb-8">
                ← Nos Produits
            </Link>

            <div className="flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-12 max-w-7xl mx-auto">
                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                    <div className="relative w-full max-w-[300px] sm:max-w-[350px] lg:w-[400px] h-[400px] sm:h-[470px] lg:h-[540px] border border-[#24586f] rounded-[20px] overflow-hidden flex-shrink-0">
                        <Image src={contenu.image} alt={contenu.titre} fill className="object-cover" sizes="(max-width: 640px) 300px, (max-width: 1024px) 350px, 400px" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full lg:max-w-[1000px]">
                    <div className="flex flex-col gap-4 sm:gap-5 flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-[30px] text-[#24586f] dark:text-[#3a8fa8] font-semibold">
                            {contenu.titre}
                        </h1>
                        <div className="bloc-contenu text-base sm:text-lg text-black dark:text-[#faf5f1] space-y-4">
                            {contenu.blocs_description.map((bloc, i) => (
                                <div key={i} dangerouslySetInnerHTML={{ __html: bloc.contenu }} />
                            ))}
                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">
                                {contenu.prix.toFixed(2)} €
                            </p>
                        </div>
                    </div>

                    <div className="border border-[#24586f] rounded-[20px] p-6 sm:p-8 flex flex-col justify-center items-center gap-6 w-full lg:w-auto lg:min-w-[320px] bg-[#faf5f1] dark:bg-[#1a1d27] self-start">
                        {contenu.disponible === false ? (
                            <div className="text-center py-8">
                                <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-3">INDISPONIBLE</div>
                                <p className="text-base text-gray-700 dark:text-gray-400">Ce produit est temporairement indisponible</p>
                            </div>
                        ) : (
                            <>
                                {maxAtteint && (
                                    <div className="w-full p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 text-center">
                                        Vous avez atteint le maximum de {maxBouteilles} bouteilles.{" "}
                                        <Link href="/contact" className="underline">Contactez-nous</Link> pour une commande plus importante.
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-3 w-full">
                                    <label htmlFor="quantite" className="text-[#24586f] dark:text-[#3a8fa8] font-semibold">
                                        Quantité
                                    </label>

                                    {estBouteille ? (
                                        <>
                                            <select
                                                id="quantite"
                                                value={quantite}
                                                onChange={e => setQuantite(parseInt(e.target.value))}
                                                disabled={maxAtteint}
                                                className="h-12 sm:h-14 px-4 text-lg font-semibold text-[#24586f] dark:text-[#3a8fa8] border border-[#24586f] rounded-xl bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {paliersBouteilles.map(qty => {
                                                    const grise = qty > maxDispo;
                                                    return (
                                                        <option key={qty} value={qty} disabled={grise}>
                                                            {qty} bouteille{qty > 1 ? "s" : ""}
                                                            {grise ? ` — max ${maxBouteilles} au total` : ""}
                                                        </option>
                                                    );
                                                })}
                                                <option disabled value="">──────────────────</option>
                                                <option disabled value="">+ de {maxBouteilles} ? Contactez-nous</option>
                                            </select>

                                            {!maxAtteint && totalAutresBouteilles > 0 && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                    {totalAutresBouteilles} bouteille{totalAutresBouteilles > 1 ? "s" : ""} déjà dans le panier
                                                    — il reste {maxDispo} place{maxDispo > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setQuantite(q => Math.max(1, q - 1))} className="w-10 h-10 border border-[#24586f] rounded-lg text-[#24586f] text-xl font-bold hover:bg-[#24586f] hover:text-white transition-colors">−</button>
                                            <span className="text-xl font-semibold text-[#24586f] dark:text-[#3a8fa8] w-8 text-center">{quantite}</span>
                                            <button onClick={() => setQuantite(q => Math.min(99, q + 1))} className="w-10 h-10 border border-[#24586f] rounded-lg text-[#24586f] text-xl font-bold hover:bg-[#24586f] hover:text-white transition-colors">+</button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={ajouterAuPanier}
                                    disabled={disabled || maxAtteint}
                                    className="w-full h-16 sm:h-[70px] bg-[#24586f] border border-[#24586f] rounded-[20px] text-white font-medium text-base sm:text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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