"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const pathname = usePathname();
    const isHomePage = pathname === "/";

    const navLinks = [
        { href: "/histoire", label: "Histoire" },
        { href: "/la-cave", label: "La Cave" },
        { href: "/rencontres-vignerons", label: "Rencontres Vignerons" },
        { href: "/galerie", label: "Galerie Photos" },
        { href: "/contact", label: "Contact" },
    ];

    useEffect(() => {
        const fetchCartCount = async () => {
            try {
                const res = await fetch("/api/commandes");
                const data = await res.json();
                const count = data.filter((item: any) => item.quantite > 0).length;
                setCartItemCount(count);
            } catch (error) {
                console.error("Erreur récupération panier:", error);
            }
        };

        fetchCartCount();

        const handleCartUpdate = () => fetchCartCount();
        window.addEventListener("cartUpdated", handleCartUpdate);
        const interval = setInterval(fetchCartCount, 30000);

        return () => {
            window.removeEventListener("cartUpdated", handleCartUpdate);
            clearInterval(interval);
        };
    }, []);

    // Icône burger (3 traits) - identique partout
    const BurgerIcon = () => (
        <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="z-20 p-2 hover:bg-[rgba(250,245,241,0.6)] rounded transition-colors"
            aria-label="Menu"
        >
            <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-[#24586f] transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 w-full bg-[#24586f] transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-full bg-[#24586f] transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
        </button>
    );

    return (
        <nav className="relative bg-[rgba(250,245,241,0.4)] text-[#24586f] px-4 py-4 lg:py-6">
            <div className="max-w-7xl mx-auto">

                {/* ===== DESKTOP ===== */}
                <div className="hidden lg:grid lg:grid-cols-3 items-center gap-8">
                    {/* Liens gauche */}
                    <div className="flex gap-8 xl:gap-12 text-lg items-center justify-start">
                        <Link href="/histoire" className="hover:underline transition-all whitespace-nowrap">Histoire</Link>
                        <Link href="/la-cave" className="hover:underline transition-all whitespace-nowrap">La Cave</Link>
                        <Link href="/rencontres-vignerons" className="hover:underline transition-all whitespace-nowrap">Rencontres Vignerons</Link>
                    </div>

                    {/* Logo centré */}
                    <div className="flex justify-center">
                        <Link href="/" className="block">
                            <Image
                                src="/boutique.png"
                                alt="La Cave - La Garenne"
                                width={250}
                                height={250}
                                className="w-56 xl:w-64 h-auto"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Liens droite */}
                    <div className="flex gap-8 xl:gap-12 text-lg items-center justify-end">
                        <Link href="/galerie" className="hover:underline transition-all whitespace-nowrap">Galerie Photos</Link>
                        <Link href="/contact" className="hover:underline transition-all whitespace-nowrap">Contact</Link>
                        <Link href="/panier" className="relative hover:scale-110 transition-transform" aria-label="Panier">
                            <Image src="/market-icon.png" alt="Panier" width={56} height={56} className="w-12 h-12 xl:w-14 xl:h-14" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#24586f] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* ===== MOBILE / TABLET ===== */}
                <div className="lg:hidden">
                    <div className="flex items-center justify-between">
                        {/* Burger - toujours présent */}
                        <BurgerIcon />

                        {/* Logo centré */}
                        <div className="flex-1 flex justify-center">
                            <Link href="/" className="block">
                                <Image
                                    src="/boutique.png"
                                    alt="La Cave - La Garenne"
                                    width={250}
                                    height={250}
                                    className="w-32 h-auto sm:w-40 md:w-48"
                                    priority
                                />
                            </Link>
                        </div>

                        {/* Panier */}
                        <Link href="/panier" className="relative z-20 hover:scale-110 transition-transform" aria-label="Panier">
                            <Image src="/market-icon.png" alt="Panier" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#24586f] text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Liens visibles sur page d'accueil sous la navbar */}
                    {isHomePage && (
                        <div className="mt-5 flex flex-col items-center gap-4 text-base sm:text-lg font-medium">
                            <div className="flex justify-center gap-8 sm:gap-14">
                                <Link href="/histoire" className="hover:underline transition-all">Histoire</Link>
                                <Link href="/la-cave" className="hover:underline transition-all">La Cave</Link>
                            </div>
                            <div className="flex justify-center gap-6 sm:gap-10 flex-wrap">
                                <Link href="/rencontres-vignerons" className="hover:underline transition-all">Rencontres Vignerons</Link>
                                <Link href="/galerie" className="hover:underline transition-all">Galerie Photos</Link>
                                <Link href="/contact" className="hover:underline transition-all">Contact</Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== MENU BURGER OUVERT ===== */}
                {isMenuOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Panel */}
                        <div className="fixed top-0 left-0 w-64 sm:w-80 h-full bg-[#faf5f1] z-40 lg:hidden shadow-2xl">
                            <div className="p-6 pt-20">
                                <div className="flex flex-col gap-6 text-lg">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="py-3 px-4 hover:bg-[rgba(36,88,111,0.1)] rounded transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
}