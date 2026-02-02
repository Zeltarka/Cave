"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Page() {
    const MAX_QUANTITE = 180;
    const [quantitec, setQuantitec] = useState(6);
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
                    id: "champagne",
                    produit: "Champagne La Cave",
                    quantite: quantitec,
                    prix: 29.90,
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
                            src="/champagne.jpg"
                            alt="Champagne La Cave"
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
                            Champagne La Cave
                        </h1>

                        <div className="text-base sm:text-lg text-black space-y-4">
                            <p>
                                Champagne Julien HERBERT sélectionné par LA CAVE LA GARENNE
                            </p>

                            <p>
                                Premier Cru<br />
                                Signature Gilles POTTIER
                            </p>

                            <p>
                                6 ans de vieillissement minimum<br />
                                4.8 g/L - Brut
                            </p>

                            <p>
                                Cuvée assemblage de trois cépages : 50% Chardonnay - 30% Pinot Noir - 20% Pinot Meunier
                            </p>

                            <p>
                                Ce champagne est le fruit d'un partenariat entre deux indépendants, Julien Herbert et Gilles Pottier,
                                partageant des valeurs communes de l'exigence, de l'authenticité, du travail.
                            </p>

                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f]">
                                29,90€
                            </p>
                        </div>
                    </div>

                    {/* Carte ajout au panier */}
                    <div className="border border-[#24586f] rounded-[20px] p-6 sm:p-8 flex flex-col justify-center items-center gap-6 w-full lg:w-auto lg:min-w-[280px] bg-[#faf5f1]">
                        {/* Sélecteur de quantité */}
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="quantite"
                                className="text-[#24586f] font-semibold"
                            >
                                Quantité :
                            </label>

                            <select
                                id="quantite"
                                value={quantitec}
                                onChange={(e) => setQuantitec(parseInt(e.target.value))}
                                className="h-12 sm:h-14 px-4 text-lg font-light text-[#24586f] border border-[#24586f] rounded-xl bg-transparent focus:outline-none cursor-pointer"
                            >
                                <option value={6}>6 bouteilles</option>
                                <option value={12}>12 bouteilles</option>
                                <option value={18}>18 bouteilles</option>
                            </select>
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