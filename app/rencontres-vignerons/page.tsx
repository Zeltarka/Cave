// app/(pages)/rencontres-vignerons/page.tsx
"use client";
import { useEffect, useState } from "react";

type Bloc = {
    type: "titre" | "paragraphe";
    contenu: string;
};

type RencontresContenu = {
    blocs: Bloc[];
};

export default function Page() {
    const [contenu, setContenu] = useState<RencontresContenu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/rencontres-vignerons")
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
        <div className="flex flex-col justify-start px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8 sm:py-12 lg:py-16 text-black max-w-6xl mx-auto">
            {contenu.blocs.map((bloc, index) => {
                if (bloc.type === "titre") {
                    return (
                        <h1
                            key={index}
                            className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold mb-6 sm:mb-8 text-center lg:text-left"
                            dangerouslySetInnerHTML={{ __html: bloc.contenu }}
                        />
                    );
                }

                return (
                    <div
                        key={index}
                        className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-5"
                        dangerouslySetInnerHTML={{ __html: bloc.contenu }}
                    />
                );
            })}
        </div>
    );
}