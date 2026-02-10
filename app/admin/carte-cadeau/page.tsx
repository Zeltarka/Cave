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

    // Infos acheteur
    const [nomAcheteur, setNomAcheteur]       = useState("");
    const [prenomAcheteur, setPrenomAcheteur] = useState("");
    const [emailAcheteur, setEmailAcheteur]   = useState("");
    const [commentaire, setCommentaire]       = useState("");

    // UI
    const [disabled, setDisabled]   = useState(false);
    const [contenu, setContenu]     = useState<CarteCadeauContenu | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalMsg, setModalMsg]   = useState("");

    useEffect(() => {
        fetch("/api/admin/contenu/carte-cadeau")
            .then(res => res.json())
            .then(data => setContenu(data.contenu))
            .catch(err => console.error("Erreur chargement contenu:", err));
    }, []);

    const montantMin = contenu?.montant_minimum ?? 10;

    const handleMontantChange = (id: number, value: string) => {
        const regex = /^\d*\.?\d{0,2}$/;
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

    const afficherModal = (msg: string, type: "success" | "error") => {
        setModalMsg(msg);
        setModalType(type);
        setShowModal(true);
    };

    const creerCartes = async () => {
        if (!formValide || disabled) return;
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
                    nomAcheteur:    nomAcheteur.trim() || null,
                    prenomAcheteur: prenomAcheteur.trim() || null,
                    emailAcheteur:  emailAcheteur.trim() || null,
                    commentaire:    commentaire.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                afficherModal(data.message || "Erreur lors de la création", "error");
                return;
            }

            const nb = cartes.length;
            afficherModal(
                `${nb} carte${nb > 1 ? "s" : ""} cadeau créée${nb > 1 ? "s" : ""} avec succès ! Les PDFs ont été envoyés par email.`,
                "success"
            );

            setCartes([{ id: 1, destinataire: "", montant: "", emailDestinataire: "" }]);
            setNomAcheteur("");
            setPrenomAcheteur("");
            setEmailAcheteur("");
            setCommentaire("");

        } catch (err) {
            console.error("Erreur:", err);
            afficherModal("Erreur serveur, veuillez réessayer", "error");
        } finally {
            setDisabled(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/commandes" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour aux commandes
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Créer une carte cadeau</h1>
                        </div>
                        <button
                            onClick={creerCartes}
                            disabled={disabled || !formValide}
                            className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                        >
                            {disabled ? "Création..." : `Créer ${cartes.length > 1 ? `${cartes.length} cartes` : "la carte"}`}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne gauche : image + acheteur */}
                    <div className="space-y-6">
                        {contenu?.image && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <Image
                                    src={`/${contenu.image}`}
                                    alt="Carte cadeau"
                                    width={500}
                                    height={300}
                                    className="w-full h-auto rounded-lg"
                                />
                            </div>
                        )}

                        {/* Infos acheteur */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h2 className="text-base font-semibold text-[#24586f]">
                                Acheteur
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom</label>
                                    <input type="text" value={prenomAcheteur} onChange={e => setPrenomAcheteur(e.target.value)} placeholder="Jean" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nom</label>
                                    <input type="text" value={nomAcheteur} onChange={e => setNomAcheteur(e.target.value)} placeholder="Dupont" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" value={emailAcheteur} onChange={e => setEmailAcheteur(e.target.value)} placeholder="jean.dupont@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm" />
                                <p className="text-xs text-gray-500 mt-1">Reçoit tous les PDFs par email</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Commentaire</label>
                                <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm resize-none" />
                            </div>
                        </div>

                        <div className=" rounded-lg p-4">
                            <p className="text-xs">
                                <strong>Rappel :</strong> Les commandes sont créées avec le statut <strong>Payée</strong>.
                                Les PDFs sont envoyés automatiquement à la boutique.
                            </p>
                        </div>
                    </div>

                    {/* Colonne droite : liste des cartes */}
                    <div className="lg:col-span-2 space-y-4">

                        {cartes.map((carte, index) => {
                            const montantNum  = parseFloat(carte.montant) || 0;
                            const carteValide = carte.destinataire.trim() && montantNum >= montantMin;

                            return (
                                <div
                                    key={carte.id}
                                    className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-colors ${
                                        carteValide ? "border-[#24586f]" : "border-gray-200"
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-[#24586f]">
                                            Carte {index + 1}
                                            {carte.destinataire && (
                                                <span className="font-normal text-gray-500 ml-2">— {carte.destinataire}</span>
                                            )}
                                        </h3>
                                        {cartes.length > 1 && (
                                            <button
                                                onClick={() => supprimerCarte(carte.id)}
                                                className="text-red-400 hover:text-red-600 text-sm px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Destinataire */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Destinataire <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={carte.destinataire}
                                                onChange={e => updateCarte(carte.id, "destinataire", e.target.value)}
                                                placeholder="Ex: Marie Dupont"
                                                maxLength={50}
                                                className="w-full px-4 py-2.5 border-2 border-[#8ba9b7] rounded-lg focus:outline-none focus:border-[#24586f] focus:ring-2 focus:ring-[#24586f]"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Apparaît sur la carte cadeau</p>
                                        </div>

                                        {/* Montant */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Montant <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={carte.montant}
                                                    onChange={e => handleMontantChange(carte.id, e.target.value)}
                                                    placeholder={`Min. ${montantMin}`}
                                                    className="w-full px-4 py-2.5 pr-10 border-2 border-[#8ba9b7] rounded-lg focus:outline-none focus:border-[#24586f] focus:ring-2 focus:ring-[#24586f] text-lg font-bold text-[#24586f]"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#24586f]">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    {contenu?.suggestions && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {contenu.suggestions.map(prix => (
                                                <button
                                                    key={prix}
                                                    onClick={() => setSuggestion(carte.id, prix)}
                                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                                        montantNum === prix
                                                            ? "bg-[#24586f] text-white"
                                                            : "bg-[#f1f5ff] text-[#24586f] hover:bg-[#24586f] hover:text-white"
                                                    }`}
                                                >
                                                    {prix}€
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Email destinataire */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email du destinataire <span className="font-normal text-gray-400">(optionnel)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={carte.emailDestinataire}
                                            onChange={e => updateCarte(carte.id, "emailDestinataire", e.target.value)}
                                            placeholder="marie.dupont@email.com"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Si renseigné, la carte lui sera envoyée directement</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Ajouter une carte */}
                        <button
                            onClick={ajouterCarte}
                            className="w-full py-4 border-2 border-dashed border-[#24586f] text-[#24586f] rounded-xl hover:bg-[#24586f] hover:text-white transition-colors font-medium"
                        >
                            + Ajouter une carte cadeau
                        </button>

                        {/* Total */}
                        {totalGeneral > 0 && (
                            <div className="bg-[#f1f5ff] rounded-xl p-5 border-2 border-[#24586f]">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#24586f] font-semibold">
                                        Total — {cartes.length} carte{cartes.length > 1 ? "s" : ""}
                                    </span>
                                    <span className="text-2xl font-bold text-[#24586f]">
                                        {totalGeneral.toFixed(2)} €
                                    </span>
                                </div>
                                {cartes.filter(c => c.destinataire.trim()).length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {cartes.filter(c => c.destinataire.trim()).map(c => (
                                            <span key={c.id} className="px-2 py-1 bg-white text-[#24586f] text-xs rounded-full border border-[#8ba9b7]">
                                                {c.destinataire} — {parseFloat(c.montant) > 0 ? `${parseFloat(c.montant).toFixed(2)}€` : "—"}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bouton créer */}
                        <button
                            onClick={creerCartes}
                            disabled={disabled || !formValide}
                            className="w-full py-4 bg-[#24586f] text-white rounded-xl font-semibold text-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {disabled
                                ? "Création en cours..."
                                : `Créer ${cartes.length > 1 ? `${cartes.length} cartes` : "la carte"}${totalGeneral > 0 ? ` — ${totalGeneral.toFixed(2)}€` : ""}`
                            }
                        </button>
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                title={modalType === "success" ? "Carte(s) créée(s) !" : "Erreur"}
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