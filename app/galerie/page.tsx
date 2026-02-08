// app/(pages)/galerie/page.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Photo = {
    image: string;
    legende: string;
    ordre: number;
};

type GalerieContenu = {
    titre: string;
    description: string;
    photos: Photo[];
};

export default function GaleriePage() {
    const [contenu, setContenu] = useState<GalerieContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/admin/contenu/galerie")
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

    const ouvrirModal = (index: number) => {
        setSelectedPhoto(index);
    };

    const fermerModal = () => {
        setSelectedPhoto(null);
    };

    const photoSuivante = () => {
        if (selectedPhoto !== null && contenu && selectedPhoto < contenu.photos.length - 1) {
            setSelectedPhoto(selectedPhoto + 1);
        }
    };

    const photoPrecedente = () => {
        if (selectedPhoto !== null && selectedPhoto > 0) {
            setSelectedPhoto(selectedPhoto - 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedPhoto !== null) {
                if (e.key === "Escape") fermerModal();
                if (e.key === "ArrowRight") photoSuivante();
                if (e.key === "ArrowLeft") photoPrecedente();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPhoto]);

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
        <>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* En-tête */}
                    <div className="text-center mb-8 sm:mb-12">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold mb-4">
                            {contenu.titre}
                        </h1>
                        {contenu.description && (
                            <p className="text-base sm:text-lg text-gray-700">
                                {contenu.description}
                            </p>
                        )}
                    </div>

                    {/* Grille de photos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {contenu.photos
                            .sort((a, b) => a.ordre - b.ordre)
                            .map((photo, index) => (
                                <div
                                    key={index}
                                    onClick={() => ouvrirModal(index)}
                                    className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-100"
                                >
                                    <Image
                                        src={`/${photo.image}`}
                                        alt={photo.legende || `Photo ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />

                                    {/* Overlay avec légende */}
                                    {photo.legende && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <p className="text-white text-sm sm:text-base font-medium">
                                                {photo.legende}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    {contenu.photos.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Aucune photo disponible pour le moment
                        </div>
                    )}
                </div>
            </div>

            {/* Modal lightbox */}
            {selectedPhoto !== null && contenu.photos[selectedPhoto] && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={fermerModal}
                >
                    <button
                        onClick={fermerModal}
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
                        aria-label="Fermer"
                    >
                        ×
                    </button>

                    {/* Bouton précédent */}
                    {selectedPhoto > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                photoPrecedente();
                            }}
                            className="absolute left-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
                            aria-label="Photo précédente"
                        >
                            ‹
                        </button>
                    )}

                    {/* Bouton suivant */}
                    {selectedPhoto < contenu.photos.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                photoSuivante();
                            }}
                            className="absolute right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
                            aria-label="Photo suivante"
                        >
                            ›
                        </button>
                    )}

                    {/* Image principale */}
                    <div
                        className="relative w-full h-full max-w-6xl max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={`/${contenu.photos[selectedPhoto].image}`}
                            alt={contenu.photos[selectedPhoto].legende || `Photo ${selectedPhoto + 1}`}
                            fill
                            className="object-contain"
                            sizes="90vw"
                        />

                        {/* Légende en bas */}
                        {contenu.photos[selectedPhoto].legende && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-center">
                                <p className="text-base sm:text-lg">
                                    {contenu.photos[selectedPhoto].legende}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Compteur */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                        {selectedPhoto + 1} / {contenu.photos.length}
                    </div>
                </div>
            )}
        </>
    );
}