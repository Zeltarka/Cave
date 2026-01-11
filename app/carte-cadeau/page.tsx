"use client";
import Image from "next/image";
import { useState } from "react";

const PRIX_CARTES = [25, 50, 75, 100];

export default function CarteCadeauPage() {
    const [quantites, setQuantites] = useState<Record<number, number>>({
        25: 0,
        50: 0,
        75: 0,
        100: 0,
    });

    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleQuantiteChange = (prix: number, value: number) => {
        setQuantites((prev) => ({ ...prev, [prix]: Math.max(0, value) }));
    };

    const ajouterAuPanier = async () => {
        if (disabled) return;

        const selections = PRIX_CARTES.map((p) => ({ prix: p, quantite: quantites[p] }))
            .filter((item) => item.quantite > 0);

        if (selections.length === 0) {
            setMessage("Sélectionnez au moins une carte avec quantité > 0.");
            return;
        }

        setDisabled(true);

        try {
            for (const item of selections) {
                const res = await fetch("/api/commandes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: `CarteCadeau-${item.prix}`,
                        produit: "Carte cadeau",
                        description: `Carte Cadeau de ${item.prix} €`,
                        quantite: item.quantite,
                        prix: item.prix,
                    }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    setMessage(data.message || "Erreur serveur !");
                    return;
                }
            }

            const totalCartes = selections.reduce((sum, item) => sum + item.quantite, 0);

            setMessage(
                totalCartes === 1
                    ? "1 carte cadeau ajoutée au panier !"
                    : `${totalCartes} cartes cadeaux ajoutées au panier !`
            );

            setQuantites({ 25: 0, 50: 0, 75: 0, 100: 0 });
        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur !");
        } finally {
            setTimeout(() => setDisabled(false), 2000);
        }
    };

    const totalQuantite = Object.values(quantites).reduce((sum, q) => sum + q, 0);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl text-[#24586f] font-semibold mb-8 sm:mb-12">
                Offrez une carte cadeau La Cave
            </h1>

            <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start gap-8 lg:gap-16 xl:gap-24 max-w-6xl mx-auto">
                {/* Image de la carte cadeau */}
                <div className="w-full max-w-[300px] sm:max-w-[400px] lg:w-[450px] xl:w-[500px] flex-shrink-0">
                    <Image
                        src="/cartecadeau.png"
                        alt="Carte cadeau La Cave"
                        width={500}
                        height={500}
                        className="w-full h-auto"
                    />
                </div>

                {/* Sélection des cartes */}
                <div className="flex flex-col gap-6 w-full max-w-md">
                    <div className="space-y-4">
                        {PRIX_CARTES.map((prix) => (
                            <div
                                key={prix}
                                className="flex items-center gap-3 sm:gap-4 bg-white/50 p-3 sm:p-4 rounded-xl"
                            >
                                <span className="font-bold text-lg sm:text-xl text-[#24586f] w-16 sm:w-20">
                                    {prix} €
                                </span>
                                <button
                                    onClick={() => handleQuantiteChange(prix, quantites[prix] - 1)}
                                    className="w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-[#24586f] bg-transparent border-none cursor-pointer"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={quantites[prix]}
                                    min={0}
                                    onChange={(e) => handleQuantiteChange(prix, parseInt(e.target.value) || 0)}
                                    className="w-14 sm:w-16 h-10 sm:h-12 text-center text-lg bg-transparent border-none rounded-xl font-semibold text-[#24586f] focus:outline-none"
                                />
                                <button
                                    onClick={() => handleQuantiteChange(prix, quantites[prix] + 1)}
                                    className="w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-[#24586f] bg-transparent border-none cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={ajouterAuPanier}
                        disabled={disabled || totalQuantite === 0}
                        className="w-full sm:w-64 h-14 sm:h-16 bg-[#8ba9b7] text-white border border-[#24586f] rounded-xl font-medium text-base sm:text-lg hover:bg-[#24586f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                        Ajouter au panier
                    </button>

                    {message && (
                        <p className="text-[#24586f] text-sm sm:text-base text-center mt-2">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}