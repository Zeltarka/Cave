"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminNav from "@/components/AdminNav";

type PageItem = { nom: string; url: string };
type ProduitBoutique = { nom: string; lien: string; disponible?: boolean };

// Pages statiques — Champagne et Rosé sont maintenant dans la section Produits
const PAGES: PageItem[] = [
    { nom: "Rencontres Vignerons",   url: "/admin/contenu/rencontres-vignerons" },
    { nom: "Histoire",               url: "/admin/contenu/histoire" },
    { nom: "La Cave",                url: "/admin/contenu/la-cave" },
    { nom: "Contact",                url: "/admin/contenu/contact" },
    { nom: "Galerie Photos",                url: "/admin/contenu/galerie" },
    { nom: "Boutique",               url: "/admin/contenu/boutique" },
    { nom: "Carte Cadeau",           url: "/admin/contenu/carte-cadeau" },
    { nom: "Accueil",                url: "/admin/contenu/home" },
    { nom: "Messages Système",       url: "/admin/contenu/messages" },
    { nom: "Frais de Port",          url: "/admin/contenu/frais-port" },
];

function ContenuIndex() {
    const [produits, setProduits] = useState<ProduitBoutique[]>([]);
    const [loadingProduits, setLoadingProduits] = useState(true);

    useEffect(() => {
        fetch("/api/admin/contenu/boutique")
            .then(r => r.json())
            .then(data => setProduits(data.contenu?.produits || []))
            .catch(() => {})
            .finally(() => setLoadingProduits(false));
    }, []);

    const getAdminUrl = (lien: string) => {
        const slug = lien.split("/").pop();
        return `/admin/contenu/produits/${slug}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/admin/dashboard" className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium">
                                ← Retour au dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">Éditeur de contenu</h1>
                            <p className="text-sm text-gray-600 mt-1">Gérez le contenu de toutes les pages de votre site</p>
                        </div>
                        <AdminNav />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                {/* ─── Section Produits ─── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#24586f]">Produits</h2>
                        <Link href="/admin/contenu/produits/nouveau" className="px-4 py-2 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors text-sm font-medium">
                            + Nouveau produit
                        </Link>
                    </div>

                    {loadingProduits ? (
                        <div className="text-sm text-gray-500">Chargement des produits...</div>
                    ) : produits.length === 0 ? (
                        <div className="text-sm text-gray-500">Aucun produit pour l'instant.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {produits.map(produit => (
                                <Link key={produit.lien} href={getAdminUrl(produit.lien)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#24586f] transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-[#24586f] group-hover:text-[#1a4557] mb-1">{produit.nom}</h3>
                                            <p className="text-xs text-gray-400 font-mono">{produit.lien}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-2">
                                            {produit.disponible === false && (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Indisponible</span>
                                            )}
                                            <span className="text-[#24586f] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ─── Section Pages ─── */}
                <section>
                    <h2 className="text-lg font-semibold text-[#24586f] mb-4">Pages</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PAGES.map(page => (
                            <Link key={page.url} href={page.url} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#24586f] transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-[#24586f] group-hover:text-[#1a4557] mb-1">{page.nom}</h3>
                                    </div>
                                    <div className="text-[#24586f] opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default function AdminContenuPage() {
    return <AdminGuard><ContenuIndex /></AdminGuard>;
}