"use client";
import Image from "next/image";
import { useState } from "react";

const PRIX_CARTES = [25, 50, 75, 100];

export default function CarteCadeauPage() {
    // Quantité pour chaque prix
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

        // Filtrer les prix avec quantité > 0
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

            setMessage("Cartes cadeaux ajoutées au panier !");
            setQuantites({ 25: 0, 50: 0, 75: 0, 100: 0 });
        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur !");
        } finally {
            setTimeout(() => setDisabled(false), 2000);
        }
    };

    return (
        <div>
            <h1
                style={{
                    textAlign: "center",
                    fontSize: "4vh",
                    color: "#24586f",
                    paddingTop: "5vh",
                }}
            >
                Offrez une carte cadeau La Cave
            </h1>

            <div style={{ display: "flex", gap: "10vh" }}>
                <Image
                    src="/cartecadeau.png"
                    alt="carte cadeau"
                    width={500}
                    height={500}
                    style={{ marginTop: "10vh", marginLeft: "20vh" }}
                />

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5vh",
                        paddingTop: "5vh",
                        marginTop: "10vh",
                    }}
                >
                    {PRIX_CARTES.map((prix) => (
                        <div key={prix} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontWeight: "bold", width: 80 }}>{prix} €</span>
                            <button
                                onClick={() => handleQuantiteChange(prix, quantites[prix] - 1)}
                                style={{ width: 30, height: 30, fontSize: 20, cursor: "pointer" }}
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={quantites[prix]}
                                min={0}
                                onChange={(e) => handleQuantiteChange(prix, parseInt(e.target.value) || 0)}
                                style={{ width: 50, textAlign: "center" }}
                            />
                            <button
                                onClick={() => handleQuantiteChange(prix, quantites[prix] + 1)}
                                style={{ width: 30, height: 30, fontSize: 20, cursor: "pointer" }}
                            >
                                +
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={ajouterAuPanier}
                        disabled={disabled || Object.values(quantites).every((q) => q === 0)}
                        style={{
                            backgroundColor: "#8ba9b7",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px",
                            width: "250px",
                            marginTop: "1vh",
                            cursor:
                                disabled || Object.values(quantites).every((q) => q === 0)
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        Ajouter au panier
                    </button>

                    {message && (
                        <p style={{ marginTop: "2vh", color: "#24586f", whiteSpace: "nowrap" }}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
