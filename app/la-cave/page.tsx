"use client";
import Link from "next/link";

export default function Page() {
    return (
        <div className="flex flex-col justify-start px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-8 sm:py-12 lg:py-16 max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[#24586f] font-semibold mb-6 sm:mb-8 text-center lg:text-left">
                La Cave
            </h1>

            <div className="text-black text-base sm:text-lg leading-relaxed space-y-4">
                <p>
                    La Cave La Garenne vous propose 800 références disponibles en boutique
                    (plus de 6000 sur commandes), dont :
                </p>

                <ul className="list-none space-y-2 ml-4">
                    <li>• 450 vins français et étrangers, plus de 200 issus de l&apos;AB, biodynamie ou HVE</li>
                    <li>• 60 Champagnes de récoltants</li>
                    <li>• 200 Whiskies (plus de 1000 références sur commande)</li>
                    <li>• 120 Rhums (plus de 600 rhums sur commande)</li>
                    <li>• 30 Cognac et Armagnac, bières, cidres</li>
                </ul>

                <p>
                    Cadeaux d&apos;entreprise (magnums, caisses bois, grands crus, vins d&apos;exception ...)
                </p>

                <p>
                    Mise à disposition de Tonneaux de 5 ou 10 litres pour vos réceptions.
                </p>

                <p>
                    En lien direct avec nos vignerons partenaires, afin de maîtriser nos
                    gammes de produits, nous proposons des dégustations une fois par mois
                    durant l&apos;année, animées par les producteurs vignerons, et tous les
                    samedis de novembre à décembre.
                </p>

                <p>
                    <span className="font-semibold">Philosophie :</span> « que du bon » nos vins commencent à des prix de 4 à 5 € /
                    unité, passant par une gamme de vin plaisir du we, aux grands crus. Sur
                    commande, nous travaillons sur des demandes personnalisées.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-6 sm:gap-12 lg:gap-20 mt-8 sm:mt-12 text-[#24586f] text-xl sm:text-2xl lg:text-3xl font-semibold">
                <Link
                    href="/carte-cadeau"
                    className="text-center hover:underline transition-all"
                >
                    Carte Cadeau
                </Link>

                <Link
                    href="/boutique"
                    className="text-center hover:underline transition-all"
                >
                    Boutique en ligne
                </Link>
            </div>
        </div>
    );
}