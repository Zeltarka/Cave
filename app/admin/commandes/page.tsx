"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";
import ConfirmationModal from "@/components/ConfirmationModal";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
};

type Commande = {
    id: string | number;
    nom: string;
    prenom: string;
    email: string;
    total: number;
    statut: string;
    createdAt: string;
    panier: ProduitPanier[];
};

const STATUTS_ARCHIVES = ["livree", "annulee"];

function formatId(id: string | number): string {
    const str = String(id);
    if (str.includes("-")) return str.slice(-8).toUpperCase();
    return str;
}

function CommandesContent() {
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
    const [recherche, setRecherche] = useState("");
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [afficherHistorique, setAfficherHistorique] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("error");
    const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
    const [modalMessage, setModalMessage] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalConfirmLabel, setModalConfirmLabel] = useState("Confirmer");
    const [modalConfirmFn, setModalConfirmFn] = useState<(() => void) | undefined>(undefined);

    const afficherMessage = (msg: string, type: "success" | "error" | "info" = "error", titre?: string) => {
        setModalType(type);
        setModalTitle(titre);
        setModalMessage(msg);
        setModalConfirm(false);
        setModalConfirmFn(undefined);
        setShowModal(true);
    };

    const afficherConfirmation = (msg: string, onConfirm: () => void, label = "Confirmer", titre?: string, type: "success" | "error" | "info" = "error") => {
        setModalType(type);
        setModalTitle(titre);
        setModalMessage(msg);
        setModalConfirm(true);
        setModalConfirmLabel(label);
        setModalConfirmFn(() => onConfirm);
        setShowModal(true);
    };

    useEffect(() => { fetchCommandes(); }, []);

    const fetchCommandes = async () => {
        try {
            const res = await fetch("/api/admin/commandes");
            if (!res.ok) {
                const errorData = await res.json();
                afficherMessage(`Erreur ${res.status} : ${errorData.error || "Impossible de charger les commandes"}`, "error", "Erreur de chargement");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setCommandes(data);
        } catch (err) {
            afficherMessage("Erreur de connexion au serveur", "error", "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const changerStatut = async (id: string | number, nouveauStatut: string) => {
        if (nouveauStatut === "supprimer") { supprimerCommande(id); return; }
        try {
            const res = await fetch(`/api/admin/commandes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statut: nouveauStatut }),
            });
            if (res.ok) {
                setCommandes(prev => prev.map(cmd => cmd.id === id ? { ...cmd, statut: nouveauStatut } : cmd));
            } else {
                const data = await res.json();
                afficherMessage(data.error || "Erreur lors du changement de statut", "error", "Erreur");
            }
        } catch {
            afficherMessage("Erreur de connexion au serveur", "error", "Erreur");
        }
    };

    const supprimerCommande = (id: string | number) => {
        afficherConfirmation(
            `Supprimer définitivement la commande #${formatId(id)} ? Cette action est irréversible.`,
            async () => {
                setDeletingId(id);
                try {
                    const res = await fetch(`/api/admin/commandes/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        setCommandes(prev => prev.filter(cmd => cmd.id !== id));
                    } else {
                        const data = await res.json();
                        afficherMessage(data.error || "Erreur lors de la suppression", "error", "Erreur");
                    }
                } catch {
                    afficherMessage("Erreur de connexion au serveur", "error", "Erreur");
                } finally {
                    setDeletingId(null);
                }
            },
            "Supprimer", "Supprimer la commande", "error"
        );
    };

    const getStatutColor = (statut: string) => {
        const colors: Record<string, string> = {
            en_attente: "bg-yellow-100 text-yellow-800 border-yellow-300",
            payee:      "bg-green-100 text-green-800 border-green-300",
            stockee:    "bg-purple-100 text-purple-800 border-purple-300",
            livree:     "bg-gray-100 text-gray-800 border-gray-300",
            annulee:    "bg-red-100 text-red-800 border-red-300",
        };
        return colors[statut.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getStatutLabel = (statut: string) => {
        const labels: Record<string, string> = {
            en_attente: "En attente",
            payee:      "Payée",
            stockee:    "Stockée",
            livree:     "Livrée",
            annulee:    "Annulée",
        };
        return labels[statut.toLowerCase()] || statut;
    };

    const getDestinataires = (panier: ProduitPanier[]): string[] =>
        panier.filter(p => p.destinataire).map(p => p.destinataire!);

    const statuts = ["TOUS", "en_attente", "payee", "stockee", "livree", "annulee"];

    const appliquerFiltres = (liste: Commande[]) => liste.filter(cmd => {
        const matchStatut = filtreStatut === "TOUS" || cmd.statut.toLowerCase() === filtreStatut.toLowerCase();
        const termeLower = recherche.toLowerCase();
        const matchRecherche = recherche === "" ||
            cmd.nom.toLowerCase().includes(termeLower) ||
            cmd.prenom.toLowerCase().includes(termeLower) ||
            cmd.panier?.some(p => p.destinataire?.toLowerCase().includes(termeLower));
        return matchStatut && matchRecherche;
    });

    const toutesLesFiltrees  = appliquerFiltres(commandes);
    const commandesActives   = toutesLesFiltrees.filter(c => !STATUTS_ARCHIVES.includes(c.statut.toLowerCase()));
    const commandesArchivees = toutesLesFiltrees.filter(c =>  STATUTS_ARCHIVES.includes(c.statut.toLowerCase()));

    const LigneCommande = ({ commande }: { commande: Commande }) => {
        const destinataires = getDestinataires(commande.panier);
        const nbArticles    = commande.panier.length;
        const isDeleting    = deletingId === commande.id;
        return (
            <tr className={`hover:bg-gray-50 ${isDeleting ? "opacity-50" : ""}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono cursor-default" title={String(commande.id)}>
                        #{formatId(commande.id)}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{commande.prenom} {commande.nom}</div>
                    <div className="text-sm text-gray-500">{commande.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{nbArticles} article{nbArticles > 1 ? "s" : ""}</div>
                    {destinataires.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {destinataires.map((dest, i) => (
                                <span key={i} className="text-[#24586f] text-xs">Carte cadeau pour {dest}</span>
                            ))}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {commande.total.toFixed(2)} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <select
                        value={commande.statut}
                        onChange={e => changerStatut(commande.id, e.target.value)}
                        disabled={isDeleting}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border cursor-pointer ${getStatutColor(commande.statut)} ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <option value="en_attente">En attente</option>
                        <option value="payee">Payée</option>
                        <option value="stockee">Stockée</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                        <option disabled>──────────</option>
                        <option value="supprimer">Supprimer</option>
                    </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link href={`/admin/commandes/${commande.id}`} className="text-[#24586f] hover:text-[#1a4557] font-medium">
                        Détails →
                    </Link>
                </td>
            </tr>
        );
    };

    const EnTeteTableau = () => (
        <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Commande</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produits</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
        </thead>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
                confirm={modalConfirm}
                onConfirm={modalConfirmFn}
                confirmLabel={modalConfirmLabel}
            />

            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/dashboard" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block">
                                ← Retour au dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Gestion des commandes</h1>
                        </div>
                        <AdminNav />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                            <input
                                type="text"
                                value={recherche}
                                onChange={e => setRecherche(e.target.value)}
                                placeholder="Nom, prénom, destinataire carte cadeau..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut</label>
                            <select
                                value={filtreStatut}
                                onChange={e => setFiltreStatut(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            >
                                {statuts.map(statut => (
                                    <option key={statut} value={statut}>
                                        {statut === "TOUS" ? "Tous les statuts" : getStatutLabel(statut)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        {commandesActives.length} commande{commandesActives.length > 1 ? "s" : ""} en cours
                        {commandesArchivees.length > 0 && ` · ${commandesArchivees.length} archivée${commandesArchivees.length > 1 ? "s" : ""}`}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Chargement des commandes...</div>
                    ) : commandesActives.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">Aucune commande en cours</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <EnTeteTableau />
                                <tbody className="bg-white divide-y divide-gray-200">
                                {commandesActives.map(c => <LigneCommande key={c.id} commande={c} />)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {commandesArchivees.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setAfficherHistorique(prev => !prev)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-sm font-medium text-gray-500">
                                Historique — {commandesArchivees.length} commande{commandesArchivees.length > 1 ? "s" : ""} livrée{commandesArchivees.length > 1 ? "s" : ""} ou annulée{commandesArchivees.length > 1 ? "s" : ""}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${afficherHistorique ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {afficherHistorique && (
                            <div className="border-t border-gray-100 overflow-x-auto">
                                <table className="w-full">
                                    <EnTeteTableau />
                                    <tbody className="bg-white divide-y divide-gray-200 opacity-70">
                                    {commandesArchivees.map(c => <LigneCommande key={c.id} commande={c} />)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminCommandesPage() {
    return (
        <AdminGuard>
            <CommandesContent />
        </AdminGuard>
    );
}