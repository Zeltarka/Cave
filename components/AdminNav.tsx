"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { href: "/admin/commandes",   label: "Voir les commandes" },
    { href: "/admin/contenu",     label: "Modifier le contenu" },
    { href: "/admin/carte-cadeau", label: "Carte Cadeau" },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <div className="flex gap-3 flex-wrap">
            {NAV_LINKS.map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                                ? "bg-[#24586f] text-white"
                                : "bg-[#8ba9b7] text-white hover:bg-[#24586f]"
                        }`}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}