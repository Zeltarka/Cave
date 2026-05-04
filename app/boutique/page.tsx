"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";

type Produit = {
    nom: string;
    prix: number;
    image: string;
    lien: string;
    disponible?: boolean;
};

type BoutiqueContenu = {
    titre: string;
    description: string;
    produits: Produit[];
};

export default function Boutique() {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [contenu, setContenu]       = useState<BoutiqueContenu | null>(null);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/boutique")
            .then(res => res.json())
            .then(data => {
                setContenu(data.contenu);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement contenu:", err);
                setLoading(false);
            });
    }, []);

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
            <Link href="/la-cave" className="absolute top-0 left-15 inline-flex items-center gap-2 text-black dark:text-[#faf5f1] text-base sm:text-lg hover:underline mb-6 sm:mb-8">
                ← La Cave
            </Link>

            <div className="flex flex-col items-center justify-start text-center text-[#24586f] dark:text-[#3a8fa8] px-4 sm:px-6 lg:px-8 py-0 sm:py-0">
                <h1 className="mt-0 text-3xl sm:text-4xl lg:text-[40px] mb-2 sm:mb-3 font-semibold">
                    {contenu.titre}
                </h1>

                <p className="bloc-contenu text-base sm:text-lg text-black dark:text-[#faf5f1] mb-8 sm:mb-12 max-w-3xl">
                    {contenu.description}
                </p>

                <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl mx-auto">
                    {contenu.produits.map((produit, index) => (
                        <Link key={index} href={produit.lien} className="flex justify-center">
                            <div
                                className="relative w-[320px] h-[480px] border border-[#24586f] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-400 hover:shadow-[0_10px_20px_rgba(36,88,111,0.3)]"
                                onMouseEnter={() => setHoverIndex(index)}
                                onMouseLeave={() => setHoverIndex(null)}
                            >
                                <Image
                                    src={produit.image}
                                    alt={produit.nom}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
                                />

                                <div className={`absolute inset-0 flex flex-col justify-center items-center bg-white/90 dark:bg-[#0f1117]/90 transition-opacity duration-700 ${hoverIndex === index ? "opacity-90" : "opacity-0"}`}>
                                    {produit.disponible === false && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white font-bold text-base px-4 py-2 rounded-lg">
                                            INDISPONIBLE
                                        </div>
                                    )}
                                    <span className="font-bold text-xl text-black dark:text-[#faf5f1] text-center px-4">
                                        {produit.nom} <br /> {produit.prix.toFixed(2)} €
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}