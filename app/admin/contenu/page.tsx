// app/admin/contenu/page.tsx
"use client";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

type PageItem = {
    nom: string;
    url: string;

};

const PAGES: PageItem[] = [
    {
        nom: "Histoire",
        url: "/admin/contenu/histoire",

    },
    {
        nom: "La Cave",
        url: "/admin/contenu/la-cave",

    },
    {
        nom: "Contact",
        url: "/admin/contenu/contact",

    },
    {
        nom: "Galerie",
        url: "/admin/contenu/galerie",

    },
    {
        nom: "Champagne",
        url: "/admin/contenu/champagne",

    },
    {
        nom: "Rosé",
        url: "/admin/contenu/rose",

    },
    {
        nom: "Boutique",
        url: "/admin/contenu/boutique",

    },
    {
        nom: "Carte Cadeau",
        url: "/admin/contenu/carte-cadeau",

    },
    {
        nom: "Accueil",
        url: "/admin/contenu/home",

    },
    {
        nom: "Rencontres Vignerons",
        url: "/admin/contenu/rencontres-vignerons",

    },
    {
        nom: "Messages Système",
        url: "/admin/contenu/messages",

    },
    {
        nom: "Frais de Port",
        url: "/admin/contenu/frais-port",

    }
];

function ContenuIndex() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/admin/dashboard"
                                className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block font-medium"
                            >
                                ← Retour au dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">
                                Éditeur de contenu
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Gérez le contenu de toutes les pages de votre site
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PAGES.map((page) => (
                        <Link
                            key={page.url}
                            href={page.url}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#24586f] transition-all group"
                        >
                            <div className="flex items-start gap-4">

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#24586f] group-hover:text-[#1a4557] mb-1">
                                        {page.nom}
                                    </h3>

                                </div>
                                <div className="text-[#24586f] opacity-0 group-hover:opacity-100 transition-opacity">
                                    →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>


            </main>
        </div>
    );
}

export default function AdminContenuPage() {
    return (
        <AdminGuard>
            <ContenuIndex />
        </AdminGuard>
    );
}