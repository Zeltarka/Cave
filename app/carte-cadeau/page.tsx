"use client";
import Image from "next/image";
import { useState } from "react";

export default function CarteCadeauPage() {
    const [montant, setMontant] = useState<string>("");
    const [quantite, setQuantite] = useState(1);
    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleMontantChange = (value: string) => {
        // Accepter seulement les nombres et le point décimal
        const regex = /^\d*\.?\d{0,2}$/;
        if (regex.test(value) || value === "") {
            setMontant(value);
        }
    };

    const handleQuantiteChange = (value: number) => {
        setQuantite(Math.max(1, Math.min(value, 50)));
    };

    const montantNum = parseFloat(montant) || 0;
    const totalPrix = montantNum * quantite;

    const ajouterAuPanier = async () => {
        if (disabled || montantNum < 1 || quantite < 1) {
            setMessage("Veuillez entrer un montant valide (minimum 1€)");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        setDisabled(true);

        try {
            const res = await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: `carte-cadeau-${montantNum}`,
                    produit: `Carte cadeau ${montantNum}€`,
                    quantite: quantite,
                    prix: montantNum,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setMessage(data.message || "Erreur lors de l'ajout au panier");
                setTimeout(() => setDisabled(false), 2000);
                return;
            }

            setMessage(
                quantite === 1
                    ? `1 carte cadeau de ${montantNum.toFixed(2)}€ ajoutée au panier !`
                    : `${quantite} cartes cadeaux de ${montantNum.toFixed(2)}€ ajoutées au panier !`
            );

            // Réinitialiser
            setMontant("");
            setQuantite(1);
            setTimeout(() => {
                setMessage("");
                setDisabled(false);
            }, 3000);
        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur !");
            setTimeout(() => setDisabled(false), 2000);
        }
    };

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

                {/* Sélection de la carte */}
                <div className="flex flex-col gap-6 w-full max-w-md">
                    {/* Saisie du montant */}
                    <div className="space-y-3">
                        <label className="block text-lg font-semibold text-[#24586f]">
                            Choisissez le montant de votre carte cadeau :
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={montant}
                                onChange={(e) => handleMontantChange(e.target.value)}
                                placeholder="Ex: 50"
                                className="w-full h-16 text-center text-2xl font-semibold text-[#24586f] bg-white border-2 border-[#24586f] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[#24586f]">
                                €
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Montant minimum : 1€
                        </p>
                    </div>

                    {/* Sélection de la quantité */}
                    <div className="space-y-3">
                        <label className="block text-lg font-semibold text-[#24586f]">
                            Quantité :
                        </label>
                        <div className="flex items-center justify-center gap-4 bg-[#f1f5ff] p-4 rounded-xl">
                            <button
                                onClick={() => handleQuantiteChange(quantite - 1)}
                                className="w-12 h-12 text-2xl text-[#24586f] bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={quantite}
                                min={1}
                                max={50}
                                onChange={(e) => handleQuantiteChange(parseInt(e.target.value) || 1)}
                                className="w-16 h-12 text-center text-lg bg-transparent border-none rounded-xl font-semibold text-[#24586f] focus:outline-none"
                            />
                            <button
                                onClick={() => handleQuantiteChange(quantite + 1)}
                                className="w-12 h-12 text-2xl text-[#24586f] bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Prix total */}
                    {montantNum > 0 && (
                        <div className="text-center py-4 bg-white rounded-xl border-2 border-[#24586f]">
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-[#24586f]">
                                {totalPrix.toFixed(2)} €
                            </p>
                        </div>
                    )}

                    {/* Bouton ajouter */}
                    <button
                        onClick={ajouterAuPanier}
                        disabled={disabled || montantNum < 1}
                        className="w-full h-16 bg-[#8ba9b7] text-white border border-[#24586f] rounded-xl font-medium text-lg hover:bg-[#24586f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Ajouter au panier
                    </button>

                    {/* Message de confirmation */}
                    {message && (
                        <p className={`text-base text-center font-semibold ${
                            message.includes("Erreur") || message.includes("Veuillez")
                                ? "text-red-600"
                                : "text-[#24586f]"
                        }`}>
                            {message}
                        </p>
                    )}

                    {/* Suggestions de montants */}
                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-600 mb-3">Suggestions :</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[25, 50, 75, 100, 150].map((prix) => (
                                <button
                                    key={prix}
                                    onClick={() => setMontant(prix.toString())}
                                    className="px-4 py-2 bg-[#f1f5ff] text-[#24586f] rounded-lg text-sm hover:bg-[#24586f] hover:text-white transition-colors"
                                >
                                    {prix}€
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}