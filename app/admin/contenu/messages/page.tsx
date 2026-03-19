// app/admin/contenu/messages/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";

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
        carte_cadeau_conditions: string;
        paiement_virement_titre: string;
        paiement_virement_texte: string;
        virement_iban: string;
        virement_bic: string;
        virement_titulaire: string;
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
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { fetchContenu(); }, []);

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
            const loaded = data.contenu;
            if (!loaded.email) loaded.email = getDefaultMessages().email;
            // Assurer les nouveaux champs
            const defaults = getDefaultMessages().email;
            loaded.email = { ...defaults, ...loaded.email };
            setContenu(loaded);
        } catch (err) {
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
            bouton_remplir: "Le remplir",
        },
        commande: {
            validation_succes: "Commande validée avec succès !",
            validation_email: "Votre commande a été traitée ! Vous allez recevoir un email",
            champs_obligatoires: "Merci de remplir tous les champs obligatoires",
            email_invalide: "Veuillez entrer une adresse email valide",
            date_passage_requise: "Merci de sélectionner une date de passage en boutique",
            erreur_serveur: "Erreur serveur.",
        },
        carte_cadeau: {
            nom_requis: "Veuillez entrer le nom du destinataire",
            montant_minimum: "Montant minimum : {montant}€",
            ajout_succes: "Carte cadeau de {montant}€ pour {destinataire} ajoutée au panier !",
            ajout_erreur: "Erreur serveur !",
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
            carte_cadeau_pj: "Votre carte cadeau est en pièce jointe de cet email.",
            cartes_cadeaux_pj: "Vos cartes cadeaux sont en pièce jointe de cet email.",
            carte_cadeau_conditions: "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.",
            paiement_virement_titre: "Paiement par virement bancaire",
            paiement_virement_texte: "Merci d'indiquer votre nom dans le libellé du virement. La commande sera traitée après réception du paiement.",
            virement_iban: "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
            virement_bic: "",
            virement_titulaire: "La Cave La Garenne",
            paiement_boutique_titre: "Paiement en boutique",
            paiement_boutique_texte: "Vous paierez directement en boutique lors de la récupération de votre commande.",
            paiement_boutique_date: "Date de passage prévue : {date_passage}",
            paiement_boutique_attente: "Nous vous attendons en boutique pour finaliser votre achat.",
        },
    });

    const afficherMessage = (msg: string, type: "success" | "error" = "success") => {
        setMessage(msg);
        setMessageType(type);
        setShowModal(true);
    };

    const update = (categorie: keyof Messages, cle: string, valeur: string) => {
        setContenu(prev => {
            if (!prev) return null;
            return { ...prev, [categorie]: { ...prev[categorie], [cle]: valeur } };
        });
    };

    const sauvegarder = async () => {
        if (!contenu) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/contenu/messages", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contenu }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Erreur sauvegarde");
            afficherMessage("Modifications sauvegardées avec succès", "success");
            fetchContenu();
        } catch (err) {
            afficherMessage(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#24586f] mb-4"></div>
                <div className="text-[#24586f] text-xl font-medium">Chargement...</div>
            </div>
        </div>
    );

    if (!contenu) return null;

    const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f]";
    const labelCls = "block text-sm font-semibold text-gray-700 mb-2";

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

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Panier */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Panier</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Ajout réussi <span className="text-xs text-gray-500">(utilisez {"{quantite}"})</span></label>
                            <input type="text" value={contenu.panier.ajout_succes} onChange={e => update("panier", "ajout_succes", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Ajout échoué</label>
                            <input type="text" value={contenu.panier.ajout_erreur} onChange={e => update("panier", "ajout_erreur", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Panier vide</label>
                            <input type="text" value={contenu.panier.panier_vide} onChange={e => update("panier", "panier_vide", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Bouton remplir le panier</label>
                            <input type="text" value={contenu.panier.bouton_remplir} onChange={e => update("panier", "bouton_remplir", e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Commande */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Commande</h3>
                    <div className="space-y-4">
                        {[
                            ["validation_succes", "Validation réussie"],
                            ["validation_email", "Message email envoyé"],
                            ["champs_obligatoires", "Champs obligatoires manquants"],
                            ["email_invalide", "Email invalide"],
                            ["date_passage_requise", "Date de passage requise"],
                            ["erreur_serveur", "Erreur serveur"],
                        ].map(([key, label]) => (
                            <div key={key}>
                                <label className={labelCls}>{label}</label>
                                <input type="text" value={(contenu.commande as any)[key]} onChange={e => update("commande", key, e.target.value)} className={inputCls} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Carte cadeau */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Carte Cadeau</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Nom du destinataire requis</label>
                            <input type="text" value={contenu.carte_cadeau.nom_requis} onChange={e => update("carte_cadeau", "nom_requis", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Montant minimum</label>
                            <input type="text" value={contenu.carte_cadeau.montant_minimum} onChange={e => update("carte_cadeau", "montant_minimum", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Ajout réussi <span className="text-xs text-gray-500">(utilisez {"{montant}"} et {"{destinataire}"})</span></label>
                            <input type="text" value={contenu.carte_cadeau.ajout_succes} onChange={e => update("carte_cadeau", "ajout_succes", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Erreur d'ajout</label>
                            <input type="text" value={contenu.carte_cadeau.ajout_erreur} onChange={e => update("carte_cadeau", "ajout_erreur", e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#24586f] mb-4">Messages Email</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Titre email client</label>
                                <input type="text" value={contenu.email?.client_titre || ""} onChange={e => update("email", "client_titre", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Sous-titre client <span className="text-xs text-gray-500">({"{prenom} {nom} {commande_id}"})</span></label>
                                <input type="text" value={contenu.email?.client_sous_titre || ""} onChange={e => update("email", "client_sous_titre", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Titre "Détails de la commande"</label>
                                <input type="text" value={contenu.email?.details_commande || ""} onChange={e => update("email", "details_commande", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Label "Total"</label>
                                <input type="text" value={contenu.email?.total_label || ""} onChange={e => update("email", "total_label", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Label "Total (livraison)"</label>
                                <input type="text" value={contenu.email?.total_label_livraison || ""} onChange={e => update("email", "total_label_livraison", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Titre "Récupération"</label>
                                <input type="text" value={contenu.email?.recuperation_titre || ""} onChange={e => update("email", "recuperation_titre", e.target.value)} className={inputCls} />
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Texte "Retrait en boutique"</label>
                            <input type="text" value={contenu.email?.recuperation_retrait || ""} onChange={e => update("email", "recuperation_retrait", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Texte "Livraison à domicile"</label>
                            <input type="text" value={contenu.email?.recuperation_livraison || ""} onChange={e => update("email", "recuperation_livraison", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Note frais de port</label>
                            <textarea value={contenu.email?.note_frais_port || ""} onChange={e => update("email", "note_frais_port", e.target.value)} rows={2} className={inputCls} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Titre "Commentaires"</label>
                                <input type="text" value={contenu.email?.commentaires_titre || ""} onChange={e => update("email", "commentaires_titre", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Message "1 carte cadeau PJ"</label>
                                <input type="text" value={contenu.email?.carte_cadeau_pj || ""} onChange={e => update("email", "carte_cadeau_pj", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Message "Plusieurs cartes PJ"</label>
                                <input type="text" value={contenu.email?.cartes_cadeaux_pj || ""} onChange={e => update("email", "cartes_cadeaux_pj", e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Conditions carte cadeau (texte bas de PDF)</label>
                            <textarea value={contenu.email?.carte_cadeau_conditions || ""} onChange={e => update("email", "carte_cadeau_conditions", e.target.value)} rows={2} className={inputCls} />
                        </div>

                        {/* RIB virement */}
                        <hr className="my-2" />
                        <h4 className="font-semibold text-gray-800 mb-3">Coordonnées bancaires (virement)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>IBAN</label>
                                <input type="text" value={contenu.email?.virement_iban || ""} onChange={e => update("email", "virement_iban", e.target.value)} className={inputCls} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
                            </div>
                            <div>
                                <label className={labelCls}>BIC <span className="text-xs text-gray-500">(optionnel)</span></label>
                                <input type="text" value={contenu.email?.virement_bic || ""} onChange={e => update("email", "virement_bic", e.target.value)} className={inputCls} placeholder="XXXXFRXX" />
                            </div>
                            <div>
                                <label className={labelCls}>Titulaire du compte</label>
                                <input type="text" value={contenu.email?.virement_titulaire || ""} onChange={e => update("email", "virement_titulaire", e.target.value)} className={inputCls} />
                            </div>
                        </div>

                        <hr className="my-2" />
                        <h4 className="font-semibold text-gray-800 mb-3">Paiement par virement</h4>
                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>Titre</label>
                                <input type="text" value={contenu.email?.paiement_virement_titre || ""} onChange={e => update("email", "paiement_virement_titre", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Texte explicatif</label>
                                <textarea value={contenu.email?.paiement_virement_texte || ""} onChange={e => update("email", "paiement_virement_texte", e.target.value)} rows={2} className={inputCls} />
                            </div>
                        </div>

                        <hr className="my-2" />
                        <h4 className="font-semibold text-gray-800 mb-3">Paiement en boutique</h4>
                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>Titre</label>
                                <input type="text" value={contenu.email?.paiement_boutique_titre || ""} onChange={e => update("email", "paiement_boutique_titre", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Texte explicatif</label>
                                <textarea value={contenu.email?.paiement_boutique_texte || ""} onChange={e => update("email", "paiement_boutique_texte", e.target.value)} rows={2} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Date de passage <span className="text-xs text-gray-500">(utilisez {"{date_passage}"})</span></label>
                                <input type="text" value={contenu.email?.paiement_boutique_date || ""} onChange={e => update("email", "paiement_boutique_date", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Message d'attente</label>
                                <input type="text" value={contenu.email?.paiement_boutique_attente || ""} onChange={e => update("email", "paiement_boutique_attente", e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button onClick={sauvegarder} disabled={saving} className="w-full px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:opacity-50 font-medium shadow-sm">
                        {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
                    </button>
                </div>
            </main>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={messageType}
                title={messageType === "success" ? "Succès" : "Erreur"}
                message={message}
            />
        </div>
    );
}

export default function AdminMessagesPage() {
    return <AdminGuard><MessagesEditor /></AdminGuard>;
}