"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

type Stats = {
    commandesTotal: number;
    commandesEnAttente: number;
    commandesPayees: number;
    dernieresCommandes: Commande[];
};

type Commande = {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    total: number;
    statut: string;
    createdAt: string;
};

const STATUTS_ARCHIVES = ["livree", "annulee"];

function DashboardContent() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [afficherHistorique, setAfficherHistorique] = useState(false);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Erreur chargement stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatutColor = (statut: string) => {
        const colors: Record<string, string> = {
            en_attente: "bg-yellow-100 text-yellow-800",
            payee:      "bg-green-100 text-green-800",
            stockee:    "bg-purple-100 text-purple-800",
            livree:     "bg-gray-100 text-gray-800",
            annulee:    "bg-red-100 text-red-800",
        };
        return colors[statut.toLowerCase()] || "bg-gray-100 text-gray-800";
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

    const commandesActives   = stats?.dernieresCommandes.filter(c => !STATUTS_ARCHIVES.includes(c.statut.toLowerCase())) ?? [];
    const commandesArchivees = stats?.dernieresCommandes.filter(c =>  STATUTS_ARCHIVES.includes(c.statut.toLowerCase())) ?? [];

    const EnTete = () => (
        <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Commande</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
        </thead>
    );

    const LigneCommande = ({ commande }: { commande: Commande }) => (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{commande.id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {commande.prenom} {commande.nom}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric", month: "short", day: "numeric",
                })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {commande.total.toFixed(2)} €
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutColor(commande.statut)}`}>
                    {getStatutLabel(commande.statut)}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link href={`/admin/commandes/${commande.id}`} className="text-[#24586f] hover:text-[#1a4557] font-medium">
                    Voir détails →
                </Link>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-[#24586f] text-xl">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-[#24586f]">Dashboard Admin</h1>
                        <div className="flex gap-4">
                            <Link href="/admin/commandes" className="px-4 py-2 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors">
                                Voir les commandes
                            </Link>
                            <Link href="/admin/contenu" className="px-4 py-2 bg-[#8ba9b7] text-white rounded-lg hover:bg-[#24586f] transition-colors">
                                Modifier le contenu
                            </Link>
                            <Link href="/admin/carte-cadeau" className="px-4 py-2 bg-[#8ba9b7] text-white rounded-lg hover:bg-[#24586f] transition-colors">
                                Carte Cadeau
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Commandes totales</p>
                        <p className="text-3xl font-bold text-[#24586f]">{stats?.commandesTotal || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">En attente</p>
                        <p className="text-3xl font-bold text-yellow-600">{stats?.commandesEnAttente || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Payées</p>
                        <p className="text-3xl font-bold text-green-600">{stats?.commandesPayees || 0}</p>
                    </div>
                </div>

                {/* Commandes actives */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-[#24586f]">Dernières commandes</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {commandesActives.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">Aucune commande en cours</div>
                        ) : (
                            <table className="w-full">
                                <EnTete />
                                <tbody className="bg-white divide-y divide-gray-200">
                                {commandesActives.map(c => <LigneCommande key={c.id} commande={c} />)}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Link href="/admin/commandes" className="text-[#24586f] hover:text-[#1a4557] font-medium text-sm">
                            Voir toutes les commandes →
                        </Link>
                    </div>
                </div>

                {/* Historique */}
                {commandesArchivees.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setAfficherHistorique(prev => !prev)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-sm font-medium text-gray-500">
                                Historique — {commandesArchivees.length} commande{commandesArchivees.length > 1 ? "s" : ""} livrée{commandesArchivees.length > 1 ? "s" : ""} ou annulée{commandesArchivees.length > 1 ? "s" : ""}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-4 h-4 text-gray-400 transition-transform ${afficherHistorique ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {afficherHistorique && (
                            <div className="border-t border-gray-100 overflow-x-auto">
                                <table className="w-full">
                                    <EnTete />
                                    <tbody className="bg-white divide-y divide-gray-200 opacity-70">
                                    {commandesArchivees.map(c => <LigneCommande key={c.id} commande={c} />)}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <AdminGuard>
            <DashboardContent />
        </AdminGuard>
    );
}