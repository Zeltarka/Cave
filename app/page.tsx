"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

type HomeContenu = {
    image_principale: string;
    image_mobile?: string;
    alt: string;
    texte_bandeau?: string;
};

export default function Home() {
    const [contenu, setContenu] = useState<HomeContenu | null>(null);

    useEffect(() => {
        fetch("/api/admin/contenu/home")
            .then(res => res.json())
            .then(data => setContenu(data.contenu))
            .catch(err => console.error("Erreur chargement contenu:", err));
    }, []);

    const srcDesktop = contenu?.image_principale
        ? (contenu.image_principale.startsWith("http") ? contenu.image_principale : `/${contenu.image_principale}`)
        : "/main.jpg";

    const srcMobile = contenu?.image_mobile
        ? (contenu.image_mobile.startsWith("http") ? contenu.image_mobile : `/${contenu.image_mobile}`)
        : srcDesktop;

    return (
        <div>
            {/* Bandeau texte */}
            {contenu?.texte_bandeau && contenu.texte_bandeau.trim() !== "" && (
                <div className="bg-[#24586f] text-white py-3 px-4 text-center font-medium shadow-md">
                    {contenu.texte_bandeau}
                </div>
            )}

            {/* Image desktop */}
            <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] mt-4 sm:mt-8 md:mt-12 hidden sm:block">
                <Image
                    src={srcDesktop}
                    fill
                    priority
                    alt={contenu?.alt || "La Cave - Caviste à La Garenne-Colombes"}
                    className="object-cover object-[center_top]"
                    sizes="100vw"
                    unoptimized={!!contenu?.image_principale}
                />
            </div>

            {/* Image mobile */}
            <div className="relative w-full h-[40vh] mt-4 block sm:hidden">
                <Image
                    src={srcMobile}
                    fill
                    priority
                    alt={contenu?.alt || "La Cave - Caviste à La Garenne-Colombes"}
                    className="object-cover object-[center_top]"
                    sizes="100vw"
                    unoptimized={!!contenu?.image_mobile}
                />
            </div>
        </div>
    );
}