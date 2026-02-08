// app/(pages)/la-cave/page.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Bloc = {
    type: "titre" | "paragraphe" | "liste";
    contenu?: string;
    items?: string[];
};

type LaCaveContenu = {
    blocs: Bloc[];
};

export default function Page() {
    const [contenu, setContenu] = useState<LaCaveContenu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/la-cave")
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

    if (!contenu || !contenu.blocs) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="text-red-600">Contenu indisponible</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-start px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8 sm:py-12 lg:py-16 max-w-6xl mx-auto">
            {/* Titre + boutons */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                {contenu.blocs[0]?.type === "titre" && (
                    <h1
                        className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold text-center lg:text-left"
                        dangerouslySetInnerHTML={{ __html: contenu.blocs[0].contenu || "" }}
                    />
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/carte-cadeau"
                        className="px-6 py-3 border-2 border-[#24586f] text-[#24586f] font-semibold text-center hover:bg-[#24586f] hover:text-white transition-colors"
                    >
                        Carte Cadeau
                    </Link>

                    <Link
                        href="/boutique"
                        className="px-6 py-3 border-2 border-[#24586f] text-[#24586f] font-semibold text-center hover:bg-[#24586f] hover:text-white transition-colors"
                    >
                        Boutique en ligne
                    </Link>
                </div>
            </div>

            {/* Contenu */}
            <div className="text-black text-base sm:text-lg leading-relaxed space-y-4">
                {contenu.blocs.slice(1).map((bloc, index) => {
                    if (bloc.type === "titre") {
                        return (
                            <h2
                                key={index}
                                className="text-2xl font-semibold text-[#24586f] mt-6 mb-4"
                                dangerouslySetInnerHTML={{ __html: bloc.contenu || "" }}
                            />
                        );
                    }

                    if (bloc.type === "liste") {
                        return (
                            <ul key={index} className="list-none space-y-2 ml-4">
                                {bloc.items?.map((item, itemIndex) => (
                                    <li key={itemIndex}>• {item}</li>
                                ))}
                            </ul>
                        );
                    }

                    return (
                        <div
                            key={index}
                            dangerouslySetInnerHTML={{ __html: bloc.contenu || "" }}
                        />
                    );
                })}
            </div>
        </div>
    );
}