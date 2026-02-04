"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Page() {
    const QUANTITES_DISPONIBLES = [6, 12, 18, 24];
    const [quantitec, setQuantitec] = useState(6);
    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);

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
                    prix: 29.90,
                }),
            });

            await res.json();

            setMessage(
                quantitec === 1
                    ? `${quantitec} bouteille ajoutée au panier !`
                    : `${quantitec} bouteilles ajoutées au panier !`
            );

            setTimeout(() => {
                setDisabled(false);
            }, 3000);
        } catch {
            setMessage("Erreur : impossible d'ajouter le produit.");
            setTimeout(() => {
                setDisabled(false);
            }, 3000);
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

                            <p className="text-xl sm:text-2xl font-semibold text-[#24586f]">
                                    9,90€
                            </p>
                        </div>
                    </div>

                    {/* Carte ajout au panier */}
                    <div className="border border-[#24586f] rounded-[20px] p-6 sm:p-8 flex flex-col justify-center items-center gap-6 w-full lg:w-auto lg:min-w-[320px] bg-[#faf5f1] self-start">
                        {/* Sélecteur de quantité */}
                        <div className="flex flex-col items-center gap-3">
                            <label
                                htmlFor="quantite"
                                className="text-[#24586f] font-semibold"
                            >
                                Quantité
                            </label>

                            <select
                                id="quantite"
                                value={quantitec}
                                onChange={(e) => setQuantitec(parseInt(e.target.value))}
                                className="h-12 sm:h-14 px-4 text-lg font-semibold text-[#24586f] border border-[#24586f] rounded-xl bg-transparent focus:outline-none cursor-pointer"
                            >
                                {QUANTITES_DISPONIBLES.map((qty) => (
                                    <option key={qty} value={qty}>
                                        {qty} bouteilles
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Bouton ajouter */}
                        <button
                            onClick={ajouterAuPanier}
                            disabled={disabled}
                            className="w-full h-16 sm:h-[70px] bg-[#8ba9b7] border border-[#24586f] rounded-[20px] text-white font-medium text-base sm:text-lg hover:bg-[#24586f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Ajouter au panier
                        </button>

                        {/* Message de confirmation */}
                        {message && (
                            <p className="text-[#24586f] text-sm sm:text-base text-center font-semibold">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}