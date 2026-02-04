"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

export default function Boutique() {
    const [hoverChampagne, setHoverChampagne] = useState(false);
    const [hoverRose, setHoverRose] = useState(false);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {/* Lien retour */}
            <Link
                href="/la-cave"
                className="absolute top-0 left-15 inline-flex items-center gap-2 text-black text-base sm:text-lg hover:underline mb-6 sm:mb-8"
            >
                ← La Cave
            </Link>
        <div className="flex flex-col items-center justify-start text-center text-[#24586f] px-4 sm:px-6 lg:px-8 py-0 sm:py-0">
            <h1 className="mt-0 text-3xl sm:text-4xl lg:text-[40px] mb-2 sm:mb-3 font-semibold">
                Nos Produits
            </h1>

            <p className="text-base sm:text-lg text-black mb-8 sm:mb-12 max-w-3xl">
                Tout se passe au 3 rue Voltaire à La Garenne ! Nous avons cependant 2 produits de notre propre marque que nous vendons en ligne.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 lg:gap-20 xl:gap-32 w-full max-w-7xl mx-auto">
                {/* Champagne */}
                <Link href="/boutique/champagne" className="w-full sm:w-auto flex justify-center">
                    <div
                        className="relative w-full max-w-[280px] sm:max-w-[320px] lg:w-[350px] xl:w-[400px] h-[380px] sm:h-[420px] lg:h-[480px] xl:h-[550px] border border-[#24586f] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-400 hover:shadow-[0_10px_20px_rgba(36,88,111,0.3)]"
                        onMouseEnter={() => setHoverChampagne(true)}
                        onMouseLeave={() => setHoverChampagne(false)}
                    >
                        <Image
                            src="/champagne.jpg"
                            alt="Champagne La Cave"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, (max-width: 1280px) 350px, 400px"
                        />

                        <div
                            className={`absolute inset-0 flex justify-center items-end pb-4 rounded-b-[19px] bg-white/90 transition-opacity duration-700 ${
                                hoverChampagne ? "opacity-90" : "opacity-0"
                            }`}
                        >
                            <span className="font-bold text-lg sm:text-xl text-black text-center px-4">
                                Champagne <br /> 29,90€
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Rosé */}
                <Link href="/boutique/rose" className="w-full sm:w-auto flex justify-center">
                    <div
                        className="relative w-full max-w-[280px] sm:max-w-[320px] lg:w-[350px] xl:w-[400px] h-[380px] sm:h-[420px] lg:h-[480px] xl:h-[550px] border border-[#24586f] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-400 hover:shadow-[0_10px_20px_rgba(36,88,111,0.3)]"
                        onMouseEnter={() => setHoverRose(true)}
                        onMouseLeave={() => setHoverRose(false)}
                    >
                        <Image
                            src="/rose.jpg"
                            alt="Rosé La Cave"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, (max-width: 1280px) 350px, 400px"
                        />

                        <div
                            className={`absolute inset-0 flex justify-center items-end pb-4 rounded-b-[19px] bg-gray-500/90 transition-opacity duration-700 ${
                                hoverRose ? "opacity-90" : "opacity-0"
                            }`}
                        >
                            <span className="font-bold text-lg sm:text-xl text-black text-center px-4">
                                Rosé <br /> 9,90€
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
        </div>
    );
}