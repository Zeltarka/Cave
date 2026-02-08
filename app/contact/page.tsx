// app/(pages)/contact/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Horaire = {
    jour: string;
    plages: string[];
};

type ContactContenu = {
    titre: string;
    adresse: string;
    telephone: string;
    email: string;
    horaires: Horaire[];
    google_review_url?: string;
    google_maps_url?: string;
    linkedin_url?: string;
    instagram_url?: string;
};

export default function Page() {
    const [contenu, setContenu] = useState<ContactContenu | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/contact")
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
        <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-0">
            <div className="flex justify-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold">
                    {contenu.titre}
                </h1>
            </div>

            <div className="text-black flex flex-col gap-6 sm:gap-8 max-w-3xl mx-auto w-full lg:ml-[15%] lg:mr-auto text-base sm:text-lg">
                <div className="space-y-3 sm:space-y-4">
                    <p>
                        <span className="font-semibold">Adresse</span> - {contenu.adresse}
                    </p>
                    <p>
                        <span className="font-semibold">Téléphone</span> - {contenu.telephone}
                    </p>
                    <p>
                        <span className="font-semibold">Adresse Mail</span> - {contenu.email}
                    </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <p className="font-semibold">Horaires :</p>
                    <div className="ml-4 sm:ml-8 overflow-x-auto">
                        <div className="inline-block min-w-full sm:min-w-0">
                            <div className="grid grid-cols-[100px_auto_auto] sm:grid-cols-[120px_120px_150px] gap-y-2 gap-x-3 sm:gap-x-4 text-sm sm:text-base">
                                {contenu.horaires.map((horaire) => (
                                    <React.Fragment key={horaire.jour}>
                                        <div className="font-medium">{horaire.jour}</div>
                                        {horaire.plages[0] === "Fermé" ? (
                                            <div className="col-span-2">{horaire.plages[0]}</div>
                                        ) : (
                                            <>
                                                <div>{horaire.plages[0] || ""}</div>
                                                <div>{horaire.plages[1] || ""}</div>
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Google Maps et Reviews */}
                {(contenu.google_maps_url || contenu.google_review_url) && (
                    <div className="flex flex-wrap items-baseline gap-3">
                        {contenu.google_maps_url && (
                            <Link
                                href={contenu.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-[#24586f] hover:opacity-80 transition-opacity"
                            >
                                Itinéraire
                            </Link>
                        )}
                        {contenu.google_maps_url && contenu.google_review_url && (
                            <span className="text-gray-400">•</span>
                        )}
                        {contenu.google_review_url && (
                            <Link
                                href={contenu.google_review_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-[#24586f] hover:opacity-80 transition-opacity"
                            >
                                Laissez votre avis sur Google
                            </Link>
                        )}
                    </div>
                )}

                {/* Réseaux sociaux */}
                {(contenu.linkedin_url || contenu.instagram_url) && (
                    <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                        <p>Nos réseaux :</p>
                        <div className="flex gap-3 sm:gap-4 underline text-[#24586f]">
                            {contenu.linkedin_url && (
                                <Link
                                    href={contenu.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80 transition-opacity"
                                >
                                    Linkedin
                                </Link>
                            )}
                            {contenu.instagram_url && (
                                <Link
                                    href={contenu.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80 transition-opacity"
                                >
                                    Instagram
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}