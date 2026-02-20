// app/(pages)/rencontres-vignerons/page.tsx
"use client";
import { useEffect, useState } from "react";

type Bloc = {
    type: "titre" | "paragraphe";
    contenu: string;
};

type Rencontre = {
    id: string;
    date: string;
    blocs: Bloc[];
    image?: string;
};

type RencontresContenu = {
    titre?: string;
    rencontres: Rencontre[];
};

function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function RencontreCard({ rencontre }: { rencontre: Rencontre }) {
    const hasImage = rencontre.image && rencontre.image.length > 0;
    const titre = rencontre.blocs.find(b => b.type === "titre");
    const paragraphes = rencontre.blocs.filter(b => b.type === "paragraphe");

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-sm font-semibold text-[#8ba9b7] uppercase tracking-widest mb-3">
                {formatDate(rencontre.date)}
            </p>

            {/* Image flottante à droite sur desktop, pleine largeur en bas sur mobile */}
            {hasImage && (
                <img
                    src={rencontre.image!.startsWith("http") ? rencontre.image! : `/${rencontre.image}`}
                    alt={titre?.contenu.replace(/<[^>]*>/g, "") || "Rencontre vigneron"}
                    style={{ float: "right", width: "240px", height: "240px", objectFit: "contain", margin: "0 0 4px 12px", borderRadius: "8px" }}
            />
            )}

            {titre && (
                <h2
                    className="text-2xl sm:text-3xl font-semibold text-[#24586f] mb-4"
                    dangerouslySetInnerHTML={{ __html: titre.contenu }}
                />
            )}
            <div className="space-y-3">
                {paragraphes.map((bloc, i) => (
                    <div
                        key={i}
                        className="text-base sm:text-lg text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: bloc.contenu }}
                    />
                ))}
            </div>
            <div className="clear-both" />
        </div>
    );
}

export default function Page() {
    const [contenu, setContenu] = useState<RencontresContenu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/rencontres-vignerons")
            .then(res => res.json())
            .then(data => {
                setContenu({ rencontres: [], ...data.contenu });
                setLoading(false);
            })
            .catch(() => setLoading(false));
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

    const today = new Date().toISOString().split("T")[0];

    const aVenir = (contenu.rencontres || [])
        .filter(r => r.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));

    const passees = (contenu.rencontres || [])
        .filter(r => r.date < today)
        .sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8 sm:py-12 lg:py-16 max-w-6xl mx-auto">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold mb-10 sm:mb-14 text-center">
                {contenu.titre || "Rencontres Vignerons"}
            </h1>

            {/* À venir */}
            {aVenir.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-[#24586f] border-b-2 border-[#24586f] pb-2 mb-6">
                        À venir
                    </h2>
                    <div className="space-y-6">
                        {aVenir.map(r => <RencontreCard key={r.id} rencontre={r} />)}
                    </div>
                </section>
            )}

            {aVenir.length === 0 && passees.length === 0 && (
                <p className="text-center text-gray-500 text-lg mt-12">
                    Aucune rencontre programmée pour le moment.
                </p>
            )}

            {/* Passées */}
            {passees.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-400 border-b border-gray-200 pb-2 mb-6">
                        Rencontres passées
                    </h2>
                    <div className="space-y-6 opacity-75">
                        {passees.map(r => <RencontreCard key={r.id} rencontre={r} />)}
                    </div>
                </section>
            )}
        </div>
    );
}