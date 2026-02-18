// app/admin/carte-cadeau/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";

type CarteCadeauContenu = {
    titre: string;
    description: string;
    montant_minimum: number;
    image: string;
    suggestions: number[];
};

type CarteLigne = {
    id: number;
    destinataire: string;
    montant: string;
    emailDestinataire: string;
};

function CarteCadeauAdminForm() {
    const [cartes, setCartes] = useState<CarteLigne[]>([
        { id: 1, destinataire: "", montant: "", emailDestinataire: "" }
    ]);

    const [nomAcheteur, setNomAcheteur]       = useState("");
    const [prenomAcheteur, setPrenomAcheteur] = useState("");
    const [emailAcheteur, setEmailAcheteur]   = useState("");
    const [telephoneAcheteur, setTelephoneAcheteur] = useState("");
    const [commentaire, setCommentaire]       = useState("");
    const [envoyerEmailAcheteur, setEnvoyerEmailAcheteur] = useState(false);

    const [disabled, setDisabled]         = useState(false);
    const [contenu, setContenu]           = useState<CarteCadeauContenu | null>(null);
    const [showModal, setShowModal]       = useState(false);
    const [modalType, setModalType]       = useState<"success" | "error">("success");
    const [modalMsg, setModalMsg]         = useState("");
    const [commandeCreee, setCommandeCreee] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/contenu/carte-cadeau")
            .then(res => res.json())
            .then(data => setContenu(data.contenu))
            .catch(err => console.error("Erreur chargement contenu:", err));
    }, []);

    const montantMin = contenu?.montant_minimum ?? 10;

    const handleMontantChange = (id: number, value: string) => {
        const regex = /^\d*$/;
        if (regex.test(value) || value === "") {
            setCartes(prev => prev.map(c => c.id === id ? { ...c, montant: value } : c));
        }
    };

    const updateCarte = (id: number, champ: keyof CarteLigne, value: string) => {
        setCartes(prev => prev.map(c => c.id === id ? { ...c, [champ]: value } : c));
    };

    const ajouterCarte = () => {
        const newId = Math.max(...cartes.map(c => c.id)) + 1;
        setCartes(prev => [...prev, { id: newId, destinataire: "", montant: "", emailDestinataire: "" }]);
    };

    const supprimerCarte = (id: number) => {
        if (cartes.length <= 1) return;
        setCartes(prev => prev.filter(c => c.id !== id));
    };

    const setSuggestion = (id: number, prix: number) => {
        setCartes(prev => prev.map(c => c.id === id ? { ...c, montant: prix.toString() } : c));
    };

    const totalGeneral = cartes.reduce((sum, c) => sum + (parseFloat(c.montant) || 0), 0);

    const formValide = cartes.every(c =>
        c.destinataire.trim() &&
        (parseFloat(c.montant) || 0) >= montantMin
    );

    const emailAcheteurValide = emailAcheteur.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAcheteur.trim());

    const afficherModal = (msg: string, type: "success" | "error") => {
        setModalMsg(msg);
        setModalType(type);
        setShowModal(true);
    };

    const creerCartes = async () => {
        if (!formValide || disabled) return;

        if (envoyerEmailAcheteur && !emailAcheteurValide) {
            afficherModal("Veuillez saisir un email valide pour l'acheteur", "error");
            return;
        }

        setDisabled(true);

        try {
            const res = await fetch("/api/admin/carte-cadeau", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartes: cartes.map(c => ({
                        destinataire:      c.destinataire.trim(),
                        montant:           parseFloat(c.montant),
                        emailDestinataire: c.emailDestinataire.trim() || null,
                    })),
                    nomAcheteur:           nomAcheteur.trim() || null,
                    prenomAcheteur:        prenomAcheteur.trim() || null,
                    emailAcheteur:         emailAcheteur.trim() || null,
                    telephoneAcheteur:     telephoneAcheteur.trim() || null,
                    envoyerEmailAcheteur:  envoyerEmailAcheteur && emailAcheteurValide,
                    commentaire:           commentaire.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                afficherModal(data.message || "Erreur lors de la création", "error");
                return;
            }

            const nb = cartes.length;
            setCommandeCreee(data.commandeId);

            let message = `${nb} carte${nb > 1 ? "s" : ""} cadeau créée${nb > 1 ? "s" : ""} avec succès ! ID${nb > 1 ? "s" : ""} #${data.commandeId}`;
            if (envoyerEmailAcheteur && emailAcheteurValide) {
                message += ` — Email envoyé à ${emailAcheteur}`;
            }

            afficherModal(message, "success");

            setTimeout(() => {
                resetFormulaire();
            }, 2000);

        } catch (err) {
            console.error("Erreur:", err);
            afficherModal("Erreur serveur, veuillez réessayer", "error");
        } finally {
            setDisabled(false);
        }
    };

    const resetFormulaire = () => {
        setCartes([{ id: 1, destinataire: "", montant: "", emailDestinataire: "" }]);
        setNomAcheteur("");
        setPrenomAcheteur("");
        setEmailAcheteur("");
        setTelephoneAcheteur("");
        setCommentaire("");
        setEnvoyerEmailAcheteur(false);
        setCommandeCreee(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/commandes" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                &larr; Retour aux commandes
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Créer une carte cadeau</h1>
                        </div>
                        <button
                            onClick={creerCartes}
                            disabled={disabled || !formValide || !!commandeCreee}
                            className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                        >
                            {disabled ? "Création..." : `Créer ${cartes.length > 1 ? `${cartes.length} cartes` : "la carte"}`}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {commandeCreee && (
                    <div className="mb-6 bg-green-50 border-2 border-green-400 rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-green-800">
                                    Carte{cartes.length > 1 ? "s" : ""} créée{cartes.length > 1 ? "s" : ""} - Commande #{commandeCreee}
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    PDF{cartes.length > 1 ? "s" : ""} envoyé{cartes.length > 1 ? "s" : ""} à la boutique
                                    {envoyerEmailAcheteur && emailAcheteurValide && ` et à ${emailAcheteur}`}
                                </p>
                            </div>
                            <button
                                onClick={resetFormulaire}
                                className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm"
                            >
                                Nouvelle carte
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="space-y-6">
                        {contenu?.image && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <Image
                                    src={contenu.image}
                                    alt="Carte cadeau"
                                    width={500}
                                    height={300}
                                    className="w-full h-auto rounded-lg"
                                    unoptimized
                                />
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h2 className="text-base font-semibold text-[#24586f]">Informations acheteur</h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom</label>
                                    <input type="text" value={prenomAcheteur} onChange={e => setPrenomAcheteur(e.target.value)} disabled={!!commandeCreee} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm disabled:bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nom</label>
                                    <input type="text" value={nomAcheteur} onChange={e => setNomAcheteur(e.target.value)} disabled={!!commandeCreee} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm disabled:bg-gray-50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" value={emailAcheteur} onChange={e => setEmailAcheteur(e.target.value)} disabled={!!commandeCreee} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm disabled:bg-gray-50" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                                <input type="tel" value={telephoneAcheteur} onChange={e => setTelephoneAcheteur(e.target.value)} disabled={!!commandeCreee} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm disabled:bg-gray-50" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Commentaire</label>
                                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3} disabled={!!commandeCreee} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm resize-none disabled:bg-gray-50" />
                            </div>

                            <div className="pt-3 border-t border-gray-200">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={envoyerEmailAcheteur} onChange={e => setEnvoyerEmailAcheteur(e.target.checked)} disabled={!!commandeCreee || !emailAcheteurValide} className="mt-1 w-4 h-4 text-[#24586f] border-gray-300 rounded focus:ring-[#24586f] disabled:opacity-50" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-[#24586f]">
                                            Envoyer les cartes par email à l'acheteur
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {emailAcheteurValide
                                                ? `Les PDFs seront envoyés à ${emailAcheteur}`
                                                : "Veuillez saisir un email valide ci-dessus"
                                            }
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">

                        {cartes.map((carte, index) => {
                            const montantNum  = parseFloat(carte.montant) || 0;
                            const carteValide = carte.destinataire.trim() && montantNum >= montantMin;

                            return (
                                <div key={carte.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-colors ${commandeCreee ? "border-green-300 bg-green-50/30" : carteValide ? "border-[#24586f]" : "border-gray-200"}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-[#24586f]">
                                            Carte {index + 1}
                                            {carte.destinataire && (
                                                <span className="font-normal text-gray-500 ml-2">- {carte.destinataire}</span>
                                            )}
                                        </h3>
                                        {cartes.length > 1 && !commandeCreee && (
                                            <button onClick={() => supprimerCarte(carte.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded transition-colors">
                                                Supprimer
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Destinataire <span className="text-red-500">*</span></label>
                                            <input type="text" value={carte.destinataire} onChange={e => updateCarte(carte.id, "destinataire", e.target.value)} maxLength={50} disabled={!!commandeCreee} className="w-full px-4 py-2.5 border-2 border-[#8ba9b7] rounded-lg focus:outline-none focus:border-[#24586f] focus:ring-2 focus:ring-[#24586f] disabled:bg-gray-50" />
                                            <p className="text-xs text-gray-400 mt-1">Apparaît sur la carte cadeau</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Montant <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input type="text" inputMode="decimal" value={carte.montant} onChange={e => handleMontantChange(carte.id, e.target.value)} placeholder={`Min. ${montantMin}`} disabled={!!commandeCreee} className="w-full px-4 py-2.5 pr-10 border-2 border-[#8ba9b7] rounded-lg focus:outline-none focus:border-[#24586f] focus:ring-2 focus:ring-[#24586f] text-lg font-bold text-[#24586f] disabled:bg-gray-50" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#24586f]">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {contenu?.suggestions && !commandeCreee && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {contenu.suggestions.map(prix => (
                                                <button key={prix} onClick={() => setSuggestion(carte.id, prix)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${parseFloat(carte.montant) === prix ? "bg-[#24586f] text-white" : "bg-[#f1f5ff] text-[#24586f] hover:bg-[#24586f] hover:text-white"}`}>
                                                    {prix} €
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email du destinataire <span className="font-normal text-gray-400">(optionnel)</span></label>
                                        <input type="email" value={carte.emailDestinataire} onChange={e => updateCarte(carte.id, "emailDestinataire", e.target.value)} disabled={!!commandeCreee} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm disabled:bg-gray-50" />
                                        <p className="text-xs text-gray-400 mt-1">Si renseigné, la carte lui sera envoyée directement</p>
                                    </div>
                                </div>
                            );
                        })}

                        {!commandeCreee && (
                            <button onClick={ajouterCarte} className="w-full py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-xl hover:bg-[#24586f] hover:text-white transition-colors font-medium">
                                + Ajouter une carte cadeau
                            </button>
                        )}

                        {totalGeneral > 0 && (
                            <div className={`rounded-xl p-5 border-2 ${commandeCreee ? "bg-green-50 border-green-400" : "bg-[#f1f5ff] border-[#24586f]"}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#24586f] font-semibold">Total - {cartes.length} carte{cartes.length > 1 ? "s" : ""}</span>
                                    <span className="text-2xl font-bold text-[#24586f]">{Math.round(totalGeneral)} €</span>
                                </div>
                                {cartes.filter(c => c.destinataire.trim()).length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {cartes.filter(c => c.destinataire.trim()).map(c => (
                                            <span key={c.id} className="px-2 py-1 bg-white text-[#24586f] text-xs rounded-full border border-[#8ba9b7]">
                                                {c.destinataire} - {parseFloat(c.montant) > 0 ? `${Math.round(parseFloat(c.montant))} €` : "-"}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!commandeCreee && (
                            <button onClick={creerCartes} disabled={disabled || !formValide} className="w-full py-4 bg-[#24586f] text-white rounded-xl font-semibold text-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                {disabled ? "Création en cours..." : `Créer ${cartes.length > 1 ? `${cartes.length} cartes` : "la carte"}${totalGeneral > 0 ? ` - ${Math.round(totalGeneral)} €` : ""}`}
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                title={modalType === "success" ? "Succès" : "Erreur"}
                message={modalMsg}
                autoClose={false}
            />
        </div>
    );
}

export default function AdminCarteCadeauPage() {
    return (
        <AdminGuard>
            <CarteCadeauAdminForm />
        </AdminGuard>
    );
}