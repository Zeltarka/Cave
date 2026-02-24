"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useMessages } from "@/hooks/useMessages";
import ConfirmationModal from "@/components/ConfirmationModal";

type BlocDescription = {
    type: "paragraphe";
    contenu: string;
};

type ChampagneContenu = {
    titre: string;
    prix: number;
    image: string;
    disponible?: boolean;
    blocs_description: BlocDescription[];
};

export default function Page() {
    const QUANTITES_DISPONIBLES = [6, 12, 18, 24];
    const [quantitec, setQuantitec] = useState(6);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [showModal, setShowModal] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [contenu, setContenu] = useState<ChampagneContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [bouteillesChampagneExistantes, setBouteillesChampagneExistantes] = useState(0);
    const [bouteillesRose, setBouteillesRose] = useState(0);
    const { messages } = useMessages();

    const fetchPanier = () => {
        fetch("/api/commandes")
            .then(res => res.json())
            .then((panier: { id: string; quantite: number }[]) => {
                const champagne = panier.find(p => p.id === "champagne");
                const rose = panier.find(p => p.id === "rose");
                setBouteillesChampagneExistantes(champagne?.quantite || 0);
                setBouteillesRose(rose?.quantite || 0);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetch("/api/admin/contenu/champagne")
            .then(res => res.json())
            .then(data => { setContenu(data.contenu); setLoading(false); })
            .catch(err => { console.error("Erreur chargement contenu:", err); setLoading(false); });

        fetchPanier();
    }, []);

    const maxDispo = 24 - bouteillesChampagneExistantes - bouteillesRose;
    const maxAtteint = maxDispo <= 0;

    useEffect(() => {
        if (quantitec > maxDispo) {
            const quantitesDispos = QUANTITES_DISPONIBLES.filter(q => q <= maxDispo);
            setQuantitec(quantitesDispos.length > 0 ? quantitesDispos[quantitesDispos.length - 1] : 6);
        }
    }, [bouteillesChampagneExistantes, bouteillesRose]);

    const ajouterAuPanier = async () => {
        if (disabled || !contenu || !messages || maxAtteint) return;
        setDisabled(true);

        try {
            const res = await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: "champagne", produit: contenu.titre, quantite: quantitec, prix: contenu.prix }),
            });
            await res.json();
            window.dispatchEvent(new Event('cartUpdated'));
            fetchPanier();
            setMessage(messages.panier.ajout_succes.replace("{quantite}", quantitec.toString()));
            setMessageType("success");
            setShowModal(true);
        } catch {
            setMessage(messages.panier.ajout_erreur);
            setMessageType("error");
            setShowModal(true);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="text-[#24586f] text-lg">Chargement...</div></div>;
    if (!contenu) return <div className="flex justify-center items-center min-h-[50vh]"><div className="text-red-600">Contenu indisponible</div></div>;

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
                        <h1 className="text-2xl sm:text-3xl lg:text-[30px] text-[#24586f] dark:text-[#3a8fa8] font-semibold">{contenu.titre}</h1>
                        <div className="bloc-contenu text-base sm:text-lg text-black dark:text-[#faf5f1] space-y-4">
                            {contenu.blocs_description.map((bloc, index) => (
                                <div key={index} dangerouslySetInnerHTML={{ __html: bloc.contenu }} />
                            ))}
                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">{contenu.prix.toFixed(2)}€</p>
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
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <label htmlFor="quantite" className="text-[#24586f] dark:text-[#3a8fa8] font-semibold">Quantité</label>
                                    <select
                                        id="quantite"
                                        value={quantitec}
                                        onChange={(e) => setQuantitec(parseInt(e.target.value))}
                                        disabled={maxAtteint}
                                        className="h-12 sm:h-14 px-4 text-lg font-semibold text-[#24586f] dark:text-[#3a8fa8] border border-[#24586f] rounded-xl bg-transparent dark:bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {QUANTITES_DISPONIBLES.map((qty) => {
                                            const grise = qty > maxDispo;
                                            return (
                                                <option key={qty} value={qty} disabled={grise}>
                                                    {qty} bouteilles{grise ? " — max 24 au total" : ""}
                                                </option>
                                            );
                                        })}
                                        <option disabled value="">──────────────────</option>
                                        <option disabled value="">+ de 24 ? Contactez-nous</option>
                                    </select>
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