"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: "/histoire", label: "Histoire" },
        { href: "/la-cave", label: "La Cave" },
        { href: "/rencontres-vignerons", label: "Rencontres Vignerons" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <nav className="relative bg-[rgba(250,245,241,0.4)] text-[#24586f] px-4 py-4 lg:py-6">
            <div className="max-w-7xl mx-auto">
                {/* Container principal - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-3 items-center gap-8">
                    {/* Liens gauche */}
                    <div className="flex gap-8 xl:gap-12 text-lg items-center justify-start">
                        {navLinks.slice(0, 3).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:underline transition-all whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        ))}
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

                    {/* Contact + Panier droite */}
                    <div className="flex gap-8 xl:gap-12 text-lg items-center justify-end">
                        <Link
                            href="/contact"
                            className="hover:underline transition-all whitespace-nowrap"
                        >
                            Contact
                        </Link>
                        <Link
                            href="/panier"
                            className="hover:scale-110 transition-transform"
                            aria-label="Panier"
                        >
                            <Image
                                src="/market-icon.png"
                                alt="Panier"
                                width={56}
                                height={56}
                                className="w-12 h-12 xl:w-14 xl:h-14"
                            />
                        </Link>
                    </div>
                </div>

                {/* Container principal - Mobile/Tablet */}
                <div className="flex lg:hidden items-center justify-between">
                    {/* Menu burger pour mobile */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="z-20 p-2 hover:bg-[rgba(250,245,241,0.6)] rounded transition-colors"
                        aria-label="Menu"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <span className={`block h-0.5 w-full bg-[#24586f] transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                            <span className={`block h-0.5 w-full bg-[#24586f] transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
                            <span className={`block h-0.5 w-full bg-[#24586f] transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                        </div>
                    </button>

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

                    {/* Panier (toujours visible) */}
                    <Link
                        href="/panier"
                        className="z-20 hover:scale-110 transition-transform"
                        aria-label="Panier"
                    >
                        <Image
                            src="/market-icon.png"
                            alt="Panier"
                            width={48}
                            height={48}
                            className="w-10 h-10 sm:w-12 sm:h-12"
                        />
                    </Link>
                </div>

                {/* Menu mobile (overlay) */}
                {isMenuOpen && (
                    <>
                        {/* Overlay sombre */}
                        <div
                            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                            onClick={() => setIsMenuOpen(false)}
                        />

                        {/* Menu mobile */}
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