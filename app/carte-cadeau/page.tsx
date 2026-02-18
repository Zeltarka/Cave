// app/(pages)/carte-cadeau/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMessages } from "@/hooks/useMessages";
import ConfirmationModal from "@/components/ConfirmationModal";

type CarteCadeauContenu = {
    titre: string;
    description: string;
    montant_minimum: number;
    image: string;
    suggestions: number[];
};

export default function CarteCadeauPage() {
    const [montant, setMontant] = useState<string>("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [showModal, setShowModal] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [destinataire, setDestinataire] = useState("");
    const [contenu, setContenu] = useState<CarteCadeauContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const { messages } = useMessages();

    useEffect(() => {
        fetch("/api/admin/contenu/carte-cadeau")
            .then(res => res.json())
            .then(data => {
                if (!data.contenu) {
                    console.error("Pas de contenu dans la réponse!", data);
                    setLoading(false);
                    return;
                }
                setContenu(data.contenu);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement contenu:", err);
                setLoading(false);
            });
    }, []);

    const montantNum = parseFloat(montant) || 0;

    const handleMontantChange = (value: string) => {
        const regex = /^\d*$/;
        if (regex.test(value) || value === "") setMontant(value);
    };

    const ajouterAuPanier = async () => {
        if (!contenu || !messages) return;

        if (!destinataire.trim()) {
            setMessage(messages.carte_cadeau.nom_requis);
            setMessageType("error");
            setShowModal(true);
            return;
        }

        if (montantNum < contenu.montant_minimum) {
            const msg = messages.carte_cadeau.montant_minimum.replace(/{montant}/g, contenu.montant_minimum.toString());
            setMessage(msg);
            setMessageType("error");
            setShowModal(true);
            return;
        }

        setDisabled(true);

        try {
            const safeName = destinataire.trim().replace(/\s+/g, "-");
            const uniqueId = `carte-cadeau-${safeName}-${Date.now()}`;

            const res = await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: uniqueId,
                    produit: `Carte cadeau ${Math.round(montantNum)}€`,
                    quantite: 1,
                    prix: montantNum,
                    destinataire: destinataire.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Erreur API:", data);
                setMessage(data.error || messages.carte_cadeau.ajout_erreur);
                setMessageType("error");
                setShowModal(true);
                setTimeout(() => setDisabled(false), 2000);
                return;
            }

            window.dispatchEvent(new Event('cartUpdated'));

            const msg = messages.carte_cadeau.ajout_succes
                .replace(/{montant}/g, Math.round(montantNum).toString())
                .replace(/{destinataire}/g, destinataire);
            setMessage(msg);
            setMessageType("success");
            setShowModal(true);

            setMontant("");
            setDestinataire("");
            setTimeout(() => {
                setDisabled(false);
            }, 3000);
        } catch (err) {
            console.error("Erreur catch:", err);
            setMessage(messages.carte_cadeau.ajout_erreur);
            setMessageType("error");
            setShowModal(true);
            setTimeout(() => setDisabled(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="text-[#24586f] text-lg">Chargement...</div>
            </div>
        );
    }

    if (!contenu) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="text-red-600">Contenu indisponible</div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/la-cave" className="absolute top-0 left-15 inline-flex items-center gap-2 text-black text-base sm:text-lg hover:underline mb-6 sm:mb-8">
                ← La Cave
            </Link>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-0 sm:py-0">
                <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl text-[#24586f] font-semibold mb-8 sm:mb-12">
                    {contenu.titre}
                </h1>
                <p className="text-center">{contenu.description}<br /><br /></p>

                <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8 lg:gap-16 xl:gap-24 max-w-6xl mx-auto">
                    {contenu && (
                        <div className="w-full max-w-[300px] sm:max-w-[400px] lg:w-[450px] xl:w-[500px] flex-shrink-0 space-y-6">
                            <img
                                src={contenu.image}
                                alt="Carte cadeau La Cave"
                                className="w-full h-auto max-w-[500px]"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-6 w-full max-w-md">
                        <div className="space-y-3">
                            <label className="block text-lg font-semibold text-[#24586f]">Montant de la carte cadeau</label>
                            <div className="relative">
                                <input type="text" inputMode="decimal" value={montant} onChange={(e) => handleMontantChange(e.target.value)} placeholder="Ex: 50" className="w-full h-16 text-center text-2xl font-semibold text-[#24586f] bg-white border-2 border-[#24586f] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#24586f]" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[#24586f]">€</span>
                            </div>
                            <p className="text-sm text-gray-600 text-center">Montant minimum : {contenu.montant_minimum}€</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-base font-semibold text-[#24586f]">Destinataire <span className="text-red-600">*</span></label>
                            <input type="text" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="Ex: Archibald Haddock" maxLength={50} required className="w-full h-12 px-4 text-base text-[#24586f] bg-white border-2 border-[#24586f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#24586f]" />
                            <p className="text-xs text-gray-600">Le nom apparaîtra sur la carte cadeau</p>
                        </div>

                        <button onClick={ajouterAuPanier} disabled={disabled || montantNum < contenu.montant_minimum || !destinataire.trim()} className="w-full h-16 bg-white text-black border border-[#24586f] rounded-xl font-medium text-lg transition-colors enabled:hover:bg-[#24586f] hover:text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                            Ajouter au panier
                        </button>

                        {message && (
                            <p className={`text-base text-center font-semibold ${message.includes("Erreur") || message.includes("Veuillez") ? "text-red-600" : "text-[#24586f]"}`}>
                                {message}
                            </p>
                        )}

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-600 mb-3">Suggestions :</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {contenu.suggestions.map((prix) => (
                                    <button key={prix} onClick={() => setMontant(prix.toString())} className="px-4 py-2 bg-[#f1f5ff] text-[#24586f] rounded-lg text-sm hover:bg-[#24586f] hover:text-white transition-colors">
                                        {prix}€
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={messageType}
                message={message}
                autoClose={messageType === "success"}
                autoCloseDelay={3000}
            />
        </div>
    );
}