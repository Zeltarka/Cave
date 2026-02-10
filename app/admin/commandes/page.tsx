// app/admin/commandes/page.tsx

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
};

type Commande = {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    total: number;
    statut: string;
    createdAt: string;
    panier: ProduitPanier[];
};

function CommandesContent(){
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState<string>("TOUS");
    const [recherche, setRecherche] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCommandes();
    }, []);

    const fetchCommandes = async () => {
        try {
            console.log("📡 Fetching commandes...");
            const res = await fetch("/api/admin/commandes");

            console.log("📊 Response status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Erreur API:", errorData);
                setError(`Erreur ${res.status}: ${errorData.error || 'Impossible de charger les commandes'}`);
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log("📦 Commandes reçues:", data);
            setCommandes(data);
            setError("");
        } catch (err) {
            console.error("❌ Erreur chargement commandes:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    const changerStatut = async (id: number, nouveauStatut: string) => {
        try {
            console.log(`🔄 Changement statut commande #${id} vers "${nouveauStatut}"`);

            const res = await fetch(`/api/admin/commandes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statut: nouveauStatut }),
            });

            if (res.ok) {
                console.log(`✅ Statut changé avec succès`);
                // Mettre à jour localement
                setCommandes((prev) =>
                    prev.map((cmd) =>
                        cmd.id === id ? { ...cmd, statut: nouveauStatut } : cmd
                    )
                );
            } else {
                const errorData = await res.json();
                console.error("❌ Erreur changement statut:", errorData);
            }
        } catch (err) {
            console.error("❌ Erreur changement statut:", err);
        }
    };

    const commandesFiltrees = commandes.filter((cmd) => {
        const statutCmd = cmd.statut.toLowerCase();
        const filtreStatutLower = filtreStatut.toLowerCase();

        const matchStatut =
            filtreStatut === "TOUS" || statutCmd === filtreStatutLower;
        const termeLower = recherche.toLowerCase();
        const matchRecherche =
            recherche === "" ||
            cmd.nom.toLowerCase().includes(termeLower) ||
            cmd.prenom.toLowerCase().includes(termeLower) ||
            cmd.panier?.some(p => p.destinataire?.toLowerCase().includes(termeLower));
        return matchStatut && matchRecherche;
    });

    const getStatutColor = (statut: string) => {
        const statutLower = statut.toLowerCase();
        const colors: Record<string, string> = {
            en_attente: "bg-yellow-100 text-yellow-800 border-yellow-300",
            payee: "bg-green-100 text-green-800 border-green-300",
            preparee: "bg-blue-100 text-blue-800 border-blue-300",
            prete: "bg-purple-100 text-purple-800 border-purple-300",
            livree: "bg-gray-100 text-gray-800 border-gray-300",
            annulee: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[statutLower] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getStatutLabel = (statut: string) => {
        const statutLower = statut.toLowerCase();
        const labels: Record<string, string> = {
            en_attente: "En attente",
            payee: "Payée",
            preparee: "En préparation",
            prete: "Prête",
            livree: "Livrée",
            annulee: "Annulée",
        };
        return labels[statutLower] || statut;
    };

    const statuts = [
        "TOUS",
        "en_attente",
        "payee",
        "preparee",
        "prete",
        "livree",
        "annulee",
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block"
                            >
                                ← Retour au dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">
                                Gestion des commandes
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filtres */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Recherche */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rechercher
                            </label>
                            <input
                                type="text"
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                                placeholder="N° commande, nom, email..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            />
                        </div>

                        {/* Filtre statut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrer par statut
                            </label>
                            <select
                                value={filtreStatut}
                                onChange={(e) => setFiltreStatut(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            >
                                {statuts.map((statut) => (
                                    <option key={statut} value={statut}>
                                        {statut === "TOUS" ? "Tous les statuts" : getStatutLabel(statut)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        {commandesFiltrees.length} commande(s) trouvée(s)
                    </div>
                </div>

                {/* Affichage des erreurs */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Tableau des commandes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            Chargement des commandes...
                        </div>
                    ) : commandesFiltrees.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Aucune commande trouvée
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        N° Commande
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Produits
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Montant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {commandesFiltrees.map((commande) => (
                                    <tr key={commande.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                #{commande.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {commande.prenom} {commande.nom}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {commande.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {commande.panier.length} article(s)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {commande.total.toFixed(2)} €
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={commande.statut}
                                                onChange={(e) =>
                                                    changerStatut(commande.id, e.target.value)
                                                }
                                                className={`text-xs font-semibold rounded-full px-3 py-1 border cursor-pointer ${getStatutColor(
                                                    commande.statut
                                                )}`}
                                            >
                                                <option value="en_attente">En attente</option>
                                                <option value="payee">Payée</option>
                                                <option value="preparee">En préparation</option>
                                                <option value="prete">Prête</option>
                                                <option value="livree">Livrée</option>
                                                <option value="annulee">Annulée</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link
                                                href={`/admin/commandes/${commande.id}`}
                                                className="text-[#24586f] hover:text-[#1a4557] font-medium"
                                            >
                                                Détails →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminCommandesPage() {
    return (
        <AdminGuard>
            <CommandesContent />
        </AdminGuard>
    )
}