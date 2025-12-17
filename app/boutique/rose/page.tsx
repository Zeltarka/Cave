"use client";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
    const MAX_QUANTITE = 180;
    const [quantitec, setQuantitec] = useState(1);
    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);
    const [underline, setUnderline] = useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = parseInt(event.target.value);
        if (isNaN(newValue) || newValue < 1) newValue = 1;
        if (newValue > MAX_QUANTITE) newValue = MAX_QUANTITE;
        setQuantitec(newValue);
    };

    const augmenter = () => setQuantitec((q) => Math.min(q + 1, MAX_QUANTITE));
    const diminuer = () => setQuantitec((q) => Math.max(1, q - 1));

    const ajouterAuPanier = async () => {
        if (disabled) return;
        setDisabled(true);

        try {
            const res = await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: "rose",
                    produit: "Rosé La Cave",
                    quantite: quantitec,
                    prix: 30,
                }),
            });

            await res.json();

            setMessage(
                quantitec === 1
                    ? `${quantitec} bouteille ajoutée au panier !`
                    : `${quantitec} bouteilles ajoutées au panier !`
            );

            setTimeout(() => setDisabled(false), 3000);
        } catch (err) {
            setMessage("Erreur : impossible d’ajouter le produit.");
            setTimeout(() => setDisabled(false), 3000);
        }
    };

    return (
        <div style={{ display: "flex", textAlign: "left" }}>
            {/* Retour boutique */}
            <Link href="/boutique">
                <p
                    style={{
                        color: "black",
                        fontSize: "17px",
                        position: "absolute",
                        top: "155px",
                        left: "30px",
                        textDecoration: underline ? "underline" : "none",
                        cursor: "pointer",
                    }}
                    onMouseEnter={() => setUnderline(true)}
                    onMouseLeave={() => setUnderline(false)}
                >
                    ← Nos Produits
                </p>
            </Link>

            {/* Image produit */}
            <div
                style={{
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundImage: 'url("/rose.jpg")',
                    border: "1px solid #24586f",
                    width: "400px",
                    height: "600px",
                    borderRadius: "20px",
                    position: "absolute",
                    left: "200px",
                    top: "200px",
                }}
            />

            {/* Bloc texte */}
            <div
                style={{
                    position: "absolute",
                    left: "750px",
                    top: "250px",
                    color: "#24586f",
                }}
            >
                <h1 style={{ fontSize: "30px" }}>Rosé La Cave</h1>

                <p
                    style={{
                        fontSize: "18px",
                        position: "absolute",
                        left: "25px",
                        top: "100px",
                        color: "black",
                    }}
                >
                    Description produit
                </p>

                {/* Bouton */}
                <button
                    onClick={ajouterAuPanier}
                    disabled={disabled}
                    style={{
                        width: "170px",
                        height: "70px",
                        left: "100px",
                        top: "400px",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: disabled ? "not-allowed" : "pointer",
                        display: "flex",
                        backgroundColor: "#8ba9b7",
                        border: "1px solid #24586f",
                        borderRadius: "20px",
                        position: "absolute",
                        color: "white",
                        opacity: disabled ? 0.6 : 1,
                    }}
                >
                    Ajouter au panier
                </button>

                {/* Message */}
                <div
                    style={{
                        position: "absolute",
                        top: "480px",
                        left: "100px",
                        maxWidth: "600px",
                        whiteSpace: "nowrap",
                    }}
                >
                    {message && (
                        <p
                            style={{
                                color: "#24586f",
                                fontSize: "16px",
                                margin: 0,
                            }}
                        >
                            {message}
                        </p>
                    )}
                </div>

                {/* Quantité */}
                <div
                    style={{
                        top: "300px",
                        width: "300px",
                        height: "70px",
                        display: "flex",
                        backgroundColor: "white",
                        border: "1px solid #24586f",
                        borderRadius: "20px",
                        position: "absolute",
                        left: "10px",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                    }}
                >
                    <button
                        onClick={diminuer}
                        style={{
                            width: 50,
                            height: 50,
                            fontSize: 24,
                            fontWeight: "bold",
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        −
                    </button>

                    <input
                        id="quantitec"
                        type="number"
                        value={quantitec}
                        onChange={handleChange}
                        min={1}
                        max={MAX_QUANTITE}
                        style={{
                            width: "70px",
                            height: "50px",
                            fontSize: "18px",
                            textAlign: "center",
                            borderRadius: "10px",
                            border: "1px solid #8ba9b7",
                        }}
                    />

                    <button
                        onClick={augmenter}
                        style={{
                            width: 50,
                            height: 50,
                            fontSize: 24,
                            fontWeight: "bold",
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
