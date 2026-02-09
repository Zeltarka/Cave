// app/admin/contenu/contact/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";

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
    google_review_url: string;
    google_maps_url: string;
    linkedin_url: string;
    instagram_url: string;
};

function ContactEditor() {
    const [contenu, setContenu] = useState<ContactContenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // States pour la modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/contact");
            if (!res.ok) throw new Error("Erreur chargement");

            const data = await res.json();
            setContenu(data.contenu);
        } catch (err) {
            console.error("Erreur:", err);
            afficherMessage("Erreur lors du chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const afficherMessage = (msg: string, type: "success" | "error" = "success") => {
        setModalType(type);
        setModalTitle(type === "success" ? "Succès" : "Erreur");
        setModalMessage(msg);
        setModalOpen(true);
    };

    const mettreAJourChamp = (champ: keyof ContactContenu, valeur: any) => {
        setContenu(prev => prev ? { ...prev, [champ]: valeur } : null);
    };

    const mettreAJourHoraire = (index: number, plageIndex: number, nouvellePlage: string) => {
        setContenu(prev => {
            if (!prev) return null;
            const newHoraires = [...prev.horaires];
            newHoraires[index].plages[plageIndex] = nouvellePlage;
            return { ...prev, horaires: newHoraires };
        });
    };

    const ajouterPlageHoraire = (jourIndex: number) => {
        setContenu(prev => {
            if (!prev) return null;
            const newHoraires = [...prev.horaires];
            newHoraires[jourIndex].plages.push("");
            return { ...prev, horaires: newHoraires };
        });
    };

    const supprimerPlageHoraire = (jourIndex: number, plageIndex: number) => {
        setContenu(prev => {
            if (!prev) return null;
            const newHoraires = [...prev.horaires];
            newHoraires[jourIndex].plages = newHoraires[jourIndex].plages.filter(
                (_, i) => i !== plageIndex
            );
            return { ...prev, horaires: newHoraires };
        });
    };

    const sauvegarder = async () => {
        if (!contenu) return;

        setSaving(true);

        try {
            const res = await fetch("/api/admin/contenu/contact", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                afficherMessage(errorData.error || "Erreur lors de la sauvegarde", "error");
                return;
            }

            afficherMessage("Modifications sauvegardées avec succès !", "success");
            fetchContenu();
        } catch (err) {
            console.error("Erreur sauvegarde:", err);
            afficherMessage(
                err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#24586f] mb-4"></div>
                    <div className="text-[#24586f] text-xl font-medium">Chargement...</div>
                </div>
            </div>
        );
    }

    if (!contenu) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/admin/contenu"
                                className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium"
                            >
                                ← Retour aux pages
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">
                                Éditer Contact
                            </h1>
                        </div>
                        <button
                            onClick={sauvegarder}
                            disabled={saving}
                            className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm"
                        >
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Titre */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Titre de la page
                        </label>
                        <input
                            type="text"
                            value={contenu.titre}
                            onChange={(e) => mettreAJourChamp("titre", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            placeholder="Ex: Contactez-nous"
                        />
                    </div>

                    {/* Coordonnées */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Coordonnées</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Adresse
                                </label>
                                <input
                                    type="text"
                                    value={contenu.adresse}
                                    onChange={(e) => mettreAJourChamp("adresse", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="Ex: 3 rue Voltaire, 92250 La Garenne-Colombes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Téléphone
                                </label>
                                <input
                                    type="text"
                                    value={contenu.telephone}
                                    onChange={(e) => mettreAJourChamp("telephone", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="Ex: 01 47 84 57 63"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={contenu.email}
                                    onChange={(e) => mettreAJourChamp("email", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="Ex: contact@exemple.fr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horaires */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Horaires d'ouverture</h3>
                        <div className="space-y-4">
                            {contenu.horaires.map((horaire, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-semibold text-gray-800">{horaire.jour}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {horaire.plages.map((plage, plageIndex) => (
                                            <div key={plageIndex} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={plage}
                                                    onChange={(e) => mettreAJourHoraire(index, plageIndex, e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                                />
                                                {horaire.plages.length > 1 && (
                                                    <button
                                                        onClick={() => supprimerPlageHoraire(index, plageIndex)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer cette plage"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => ajouterPlageHoraire(index)}
                                            className="mt-2 px-4 py-2 text-sm text-[#24586f] hover:bg-[#24586f]/5 rounded-lg transition-colors font-medium"
                                        >
                                            + Ajouter une plage horaire
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Google Links */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Google</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Itinéraire Google Maps
                                </label>
                                <input
                                    type="url"
                                    value={contenu.google_maps_url || ""}
                                    onChange={(e) => mettreAJourChamp("google_maps_url", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="https://maps.google.com/..."
                                />

                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Lien pour laisser un avis Google
                                </label>
                                <input
                                    type="url"
                                    value={contenu.google_review_url || ""}
                                    onChange={(e) => mettreAJourChamp("google_review_url", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="https://g.page/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Réseaux sociaux */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Réseaux sociaux</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    LinkedIn
                                </label>
                                <input
                                    type="url"
                                    value={contenu.linkedin_url || ""}
                                    onChange={(e) => mettreAJourChamp("linkedin_url", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="https://linkedin.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Instagram
                                </label>
                                <input
                                    type="url"
                                    value={contenu.instagram_url || ""}
                                    onChange={(e) => mettreAJourChamp("instagram_url", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bouton sauvegarder bas */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={sauvegarder}
                        disabled={saving}
                        className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm"
                    >
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            {/* Modal de confirmation */}
            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    );
}

export default function AdminContactPage() {
    return (
        <AdminGuard>
            <ContactEditor />
        </AdminGuard>
    );
}