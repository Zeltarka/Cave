// app/admin/contenu/messages/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

type Messages = {
    panier: {
        ajout_succes: string;
        ajout_erreur: string;
        panier_vide: string;
        bouton_remplir: string;
    };
    commande: {
        validation_succes: string;
        validation_email: string;
        champs_obligatoires: string;
        email_invalide: string;
        date_passage_requise: string;
        erreur_serveur: string;
    };
    carte_cadeau: {
        nom_requis: string;
        montant_minimum: string;
        ajout_succes: string;
        ajout_erreur: string;
    };
    email: {
        client_titre: string;
        client_sous_titre: string;
        details_commande: string;
        total_label: string;
        total_label_livraison: string;
        recuperation_titre: string;
        recuperation_retrait: string;
        recuperation_livraison: string;
        note_frais_port: string;
        commentaires_titre: string;
        carte_cadeau_pj: string;
        cartes_cadeaux_pj: string;
        paiement_virement_titre: string;
        paiement_virement_texte: string;
        paiement_boutique_titre: string;
        paiement_boutique_texte: string;
        paiement_boutique_date: string;
        paiement_boutique_attente: string;
    };
};

function MessagesEditor() {
    const [contenu, setContenu] = useState<Messages | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    useEffect(() => {
        fetchContenu();
    }, []);

    const fetchContenu = async () => {
        try {
            const res = await fetch("/api/admin/contenu/messages");
            if (!res.ok) {
                if (res.status === 404) {
                    setContenu(getDefaultMessages());
                    setLoading(false);
                    return;
                }
                throw new Error("Erreur chargement");
            }
            const data = await res.json();
            const loadedContent = data.contenu;

            // S'assurer que toutes les sections existent
            if (!loadedContent.email) {
                loadedContent.email = getDefaultMessages().email;
            }

            setContenu(loadedContent);
        } catch (err) {
            console.error("Erreur:", err);
            afficherMessage("Erreur lors du chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const getDefaultMessages = (): Messages => ({
        panier: {
            ajout_succes: "{quantite} bouteille(s) ajoutée(s) au panier !",
            ajout_erreur: "Erreur : impossible d'ajouter le produit.",
            panier_vide: "Votre panier est vide",
            bouton_remplir: "Le remplir"
        },
        commande: {
            validation_succes: "Commande validée avec succès !",
            validation_email: "Votre commande a été traitée ! Vous allez recevoir un email",
            champs_obligatoires: "Merci de remplir tous les champs obligatoires",
            email_invalide: "Veuillez entrer une adresse email valide",
            date_passage_requise: "Merci de sélectionner une date de passage en boutique",
            erreur_serveur: "Erreur serveur."
        },
        carte_cadeau: {
            nom_requis: "Veuillez entrer le nom du destinataire",
            montant_minimum: "Montant minimum : {montant}€",
            ajout_succes: "Carte cadeau de {montant}€ pour {destinataire} ajoutée au panier !",
            ajout_erreur: "Erreur serveur !"
        },
        email: {
            client_titre: "Merci pour votre commande !",
            client_sous_titre: "{prenom} {nom} — Commande #{commande_id}",
            details_commande: "Détails de votre commande",
            total_label: "Total",
            total_label_livraison: "Total (hors frais de port)",
            recuperation_titre: "Récupération de votre commande",
            recuperation_retrait: "Retrait en boutique — 3 rue Voltaire, 92250 La Garenne-Colombes",
            recuperation_livraison: "Livraison à domicile",
            note_frais_port: "Note : Les frais de port seront calculés et ajoutés au montant total. Vous recevrez une confirmation du montant final par email.",
            commentaires_titre: "Commentaires",
            carte_cadeau_pj: "Votre carte cadeau est en pièce jointe de cet email !",
            cartes_cadeaux_pj: "Vos cartes cadeaux sont en pièce jointe de cet email !",
            paiement_virement_titre: "🏦 Paiement par virement bancaire",
            paiement_virement_texte: "Merci d'indiquer votre nom dans le libellé du virement. La commande sera traitée après réception du paiement.",
            paiement_boutique_titre: "💳 Paiement en boutique",
            paiement_boutique_texte: "Vous paierez directement en boutique lors de la récupération de votre commande.",
            paiement_boutique_date: "Date de passage prévue : {date_passage}",
            paiement_boutique_attente: "Nous vous attendons en boutique pour finaliser votre achat."
        }
    });

    const afficherMessage = (msg: string, type: "success" | "error" = "success") => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(""), 4000);
    };

    const mettreAJourMessage = (categorie: keyof Messages, cle: string, valeur: string) => {
        setContenu(prev => {
            if (!prev) return null;

            if (!prev[categorie]) {
                return {
                    ...prev,
                    [categorie]: {
                        [cle]: valeur
                    }
                };
            }

            return {
                ...prev,
                [categorie]: {
                    ...prev[categorie],
                    [cle]: valeur
                }
            };
        });
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/admin/contenu/messages", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erreur lors de la sauvegarde");
            }

            afficherMessage("✅ Modifications sauvegardées avec succès", "success");
            fetchContenu();
        } catch (err) {
            console.error("Erreur sauvegarde:", err);
            afficherMessage(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "error");
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
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/contenu" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour aux pages
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditer Messages Système</h1>
                        </div>
                        <button onClick={sauvegarder} disabled={saving} className="px-6 py-2.5 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                            {saving ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg border ${messageType === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Messages Panier */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Panier</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ajout réussi <span className="text-xs text-gray-500">(Utilisez {"{quantite}"} pour afficher le nombre)</span>
                                </label>
                                <input
                                    type="text"
                                    value={contenu.panier.ajout_succes}
                                    onChange={(e) => mettreAJourMessage("panier", "ajout_succes", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ajout échoué</label>
                                <input
                                    type="text"
                                    value={contenu.panier.ajout_erreur}
                                    onChange={(e) => mettreAJourMessage("panier", "ajout_erreur", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Panier vide</label>
                                <input
                                    type="text"
                                    value={contenu.panier.panier_vide}
                                    onChange={(e) => mettreAJourMessage("panier", "panier_vide", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bouton remplir le panier</label>
                                <input
                                    type="text"
                                    value={contenu.panier.bouton_remplir}
                                    onChange={(e) => mettreAJourMessage("panier", "bouton_remplir", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages Commande */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Commande</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Validation réussie</label>
                                <input
                                    type="text"
                                    value={contenu.commande.validation_succes}
                                    onChange={(e) => mettreAJourMessage("commande", "validation_succes", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message email envoyé</label>
                                <input
                                    type="text"
                                    value={contenu.commande.validation_email}
                                    onChange={(e) => mettreAJourMessage("commande", "validation_email", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Champs obligatoires manquants</label>
                                <input
                                    type="text"
                                    value={contenu.commande.champs_obligatoires}
                                    onChange={(e) => mettreAJourMessage("commande", "champs_obligatoires", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email invalide</label>
                                <input
                                    type="text"
                                    value={contenu.commande.email_invalide}
                                    onChange={(e) => mettreAJourMessage("commande", "email_invalide", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de passage requise</label>
                                <input
                                    type="text"
                                    value={contenu.commande.date_passage_requise}
                                    onChange={(e) => mettreAJourMessage("commande", "date_passage_requise", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Erreur serveur</label>
                                <input
                                    type="text"
                                    value={contenu.commande.erreur_serveur}
                                    onChange={(e) => mettreAJourMessage("commande", "erreur_serveur", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages Carte Cadeau */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Carte Cadeau</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du destinataire requis</label>
                                <input
                                    type="text"
                                    value={contenu.carte_cadeau.nom_requis}
                                    onChange={(e) => mettreAJourMessage("carte_cadeau", "nom_requis", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Montant minimum 
                                </label>
                                <input
                                    type="text"
                                    value={contenu.carte_cadeau.montant_minimum}
                                    onChange={(e) => mettreAJourMessage("carte_cadeau", "montant_minimum", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ajout réussi <span className="text-xs text-gray-500">(Utilisez {"{montant}"} et {"{destinataire}"})</span>
                                </label>
                                <input
                                    type="text"
                                    value={contenu.carte_cadeau.ajout_succes}
                                    onChange={(e) => mettreAJourMessage("carte_cadeau", "ajout_succes", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Erreur d'ajout</label>
                                <input
                                    type="text"
                                    value={contenu.carte_cadeau.ajout_erreur}
                                    onChange={(e) => mettreAJourMessage("carte_cadeau", "ajout_erreur", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages Email */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Email</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre email client</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.client_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "client_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sous-titre client <span className="text-xs text-gray-500">({"{prenom} {nom} {commande_id}"})</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={contenu.email?.client_sous_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "client_sous_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre "Détails de la commande"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.details_commande || ""}
                                        onChange={(e) => mettreAJourMessage("email", "details_commande", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Label "Total"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.total_label || ""}
                                        onChange={(e) => mettreAJourMessage("email", "total_label", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Label "Total (livraison)"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.total_label_livraison || ""}
                                        onChange={(e) => mettreAJourMessage("email", "total_label_livraison", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre "Récupération"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.recuperation_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "recuperation_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Texte "Retrait en boutique"</label>
                                <input
                                    type="text"
                                    value={contenu.email?.recuperation_retrait || ""}
                                    onChange={(e) => mettreAJourMessage("email", "recuperation_retrait", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Texte "Livraison à domicile"</label>
                                <input
                                    type="text"
                                    value={contenu.email?.recuperation_livraison || ""}
                                    onChange={(e) => mettreAJourMessage("email", "recuperation_livraison", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Note frais de port</label>
                                <textarea
                                    value={contenu.email?.note_frais_port || ""}
                                    onChange={(e) => mettreAJourMessage("email", "note_frais_port", e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre "Commentaires"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.commentaires_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "commentaires_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message "1 carte cadeau PJ"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.carte_cadeau_pj || ""}
                                        onChange={(e) => mettreAJourMessage("email", "carte_cadeau_pj", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message "Plusieurs cartes PJ"</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.cartes_cadeaux_pj || ""}
                                        onChange={(e) => mettreAJourMessage("email", "cartes_cadeaux_pj", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h4 className="font-semibold text-gray-700 mb-3">Paiement par virement</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.paiement_virement_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_virement_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte explicatif</label>
                                    <textarea
                                        value={contenu.email?.paiement_virement_texte || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_virement_texte", e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h4 className="font-semibold text-gray-700 mb-3">Paiement en boutique</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.paiement_boutique_titre || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_boutique_titre", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Texte explicatif</label>
                                    <textarea
                                        value={contenu.email?.paiement_boutique_texte || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_boutique_texte", e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Date de passage <span className="text-xs text-gray-500">(Utilisez {"{date_passage}"})</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={contenu.email?.paiement_boutique_date || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_boutique_date", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message d'attente</label>
                                    <input
                                        type="text"
                                        value={contenu.email?.paiement_boutique_attente || ""}
                                        onChange={(e) => mettreAJourMessage("email", "paiement_boutique_attente", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function AdminMessagesPage() {
    return (
        <AdminGuard>
            <MessagesEditor />
        </AdminGuard>
    );
}