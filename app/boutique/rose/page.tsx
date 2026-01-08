"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Page() {
    const MAX_QUANTITE = 180;
    const [quantitec, setQuantitec] = useState(1);
    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = parseInt(event.target.value);
        if (isNaN(newValue) || newValue < 1) newValue = 1;
        if (newValue > MAX_QUANTITE) newValue = MAX_QUANTITE;
        setQuantitec(newValue);
    };

    const augmenter = () => setQuantitec((q) => Math.min(q + 1, MAX_QUANTITE));
    const diminuer = () => setQuantitec((q) => Math.max(1, q - 1));

    const ajouterAuPanier = async () => {
        if (disabled) return;
        setDisabled(true);

        try {
            const res = await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: "rose",
                    produit: "Rosé La Cave",
                    quantite: quantitec,
                    prix: 9.90,
                }),
            });

            await res.json();

            setMessage(
                quantitec === 1
                    ? `${quantitec} bouteille ajoutée au panier !`
                    : `${quantitec} bouteilles ajoutées au panier !`
            );

            setTimeout(() => setDisabled(false), 3000);
        } catch {
            setMessage("Erreur : impossible d'ajouter le produit.");
            setTimeout(() => setDisabled(false), 3000);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {/* Lien retour */}
            <Link
                href="/boutique"
                className="inline-flex items-center gap-2 text-black text-base sm:text-lg hover:underline mb-6 sm:mb-8"
            >
                ← Nos Produits
            </Link>

            {/* Container principal */}
            <div className="flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-12 max-w-7xl mx-auto">
                {/* Image du produit */}
                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                    <div className="relative w-full max-w-[300px] sm:max-w-[350px] lg:w-[400px] h-[400px] sm:h-[470px] lg:h-[540px] border border-[#24586f] rounded-[20px] overflow-hidden flex-shrink-0">
                        <Image
                            src="/rose.jpg"
                            alt="Rosé La Cave"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 300px, (max-width: 1024px) 350px, 400px"
                        />
                    </div>
                </div>

                {/* Contenu description + ajout panier */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full lg:max-w-[1000px]">
                    {/* Description */}
                    <div className="flex flex-col gap-4 sm:gap-5 flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-[30px] text-[#24586f] font-semibold">
                            Rosé La Cave
                        </h1>

                        <div className="text-base sm:text-lg text-black space-y-4">
                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f] mt-4">
                                9,90€
                            </p>
                        </div>
                    </div>

                    {/* Carte ajout au panier */}
                    <div className="border border-[#24586f] rounded-[20px] p-6 sm:p-8 flex flex-col justify-center items-center gap-6 w-full lg:w-auto lg:min-w-[280px] bg-[#faf5f1]">
                        {/* Sélecteur de quantité */}
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={diminuer}
                                className="w-12 h-12 sm:w-14 sm:h-14 text-2xl rounded-xl border border-[#24586f] hover:bg-[#8ba9b7] hover:text-white transition-colors cursor-pointer"
                                aria-label="Diminuer la quantité"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={quantitec}
                                onChange={handleChange}
                                min={1}
                                max={MAX_QUANTITE}
                                className="w-16 sm:w-20 h-12 sm:h-14 text-center text-lg bg-transparent border-none rounded-xl font-semibold text-[#24586f] focus:outline-none"
                                aria-label="Quantité"
                            />
                            <button
                                onClick={augmenter}
                                className="w-12 h-12 sm:w-14 sm:h-14 text-2xl rounded-xl border border-[#24586f] hover:bg-[#8ba9b7] hover:text-white transition-colors cursor-pointer"
                                aria-label="Augmenter la quantité"
                            >
                                +
                            </button>
                        </div>

                        {/* Bouton ajouter */}
                        <button
                            onClick={ajouterAuPanier}
                            disabled={disabled}
                            className="w-full sm:w-[200px] h-16 sm:h-[70px] bg-[#8ba9b7] border border-[#24586f] rounded-[20px] text-white font-medium text-base sm:text-lg hover:bg-[#24586f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Ajouter au panier
                        </button>

                        {/* Message de confirmation */}
                        {message && (
                            <p className="text-[#24586f] text-sm sm:text-base text-center">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}