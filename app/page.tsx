// app/page.tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

type HomeContenu = {
    image_principale: string;
    alt: string;
    texte_bandeau?: string;
};

export default function Home() {
    const [contenu, setContenu] = useState<HomeContenu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/home")
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
            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-4 sm:mt-8 md:mt-12 flex items-center justify-center">
                <div className="text-[#24586f] text-lg">Chargement...</div>
            </div>
        );
    }

    if (!contenu) {
        return (
            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-4 sm:mt-8 md:mt-12 flex items-center justify-center">
                <div className="text-red-600">Contenu indisponible</div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Bandeau texte (si présent) */}
            {contenu.texte_bandeau && contenu.texte_bandeau.trim() !== "" && (
                <div className="bg-[#24586f] text-white py-3 px-4 text-center font-medium shadow-md">
                    {contenu.texte_bandeau}
                </div>
            )}

            {/* Image principale */}
            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-4 sm:mt-8 md:mt-12">
                <Image
                    src={`/${contenu.image_principale}`}
                    fill
                    priority
                    alt={contenu.alt}
                    className="object-cover object-[center_top]"
                    sizes="100vw"
                />
            </div>
        </div>
    );
}