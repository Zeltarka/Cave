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
                    id: "champagne",
                    produit: "Champagne La Cave",
                    quantite: quantitec,
                    prix: 29.90,
                }),
            });

            await res.json();

            setMessage(
                quantitec === 1
                    ? `${quantitec} bouteille ajoutée au panier !`
                    : `${quantitec} bouteilles ajoutées au panier !`
            );

            setTimeout(() => setDisabled(false), 3000);
        } catch {
            setMessage("Erreur : impossible d'ajouter le produit.");
            setTimeout(() => setDisabled(false), 3000);
        }
    };

    return (
        <>

            <div style={{ display:'inline-block'}}>
                <Link href="/boutique">
                    <span
                        style={{
                            display:'inline-block',
                            position: "relative",
                            left: "30px",
                            top: "0px",
                            color: "black",
                            fontSize: "17px",
                            textDecoration: underline ? "underline" : "none",
                            cursor: "pointer",
                            zIndex: 10,
                        }}
                        onMouseEnter={() => setUnderline(true)}
                        onMouseLeave={() => setUnderline(false)}
                    >
                        ← Nos Produits
                    </span>
                </Link>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    gap: "50px",
                    paddingTop: "40px",

                }}
            >
                <div
                    style={{
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundImage: 'url("/champagne.jpg")',
                        border: "1px solid #24586f",
                        width: "400px",
                        height: "540px",
                        borderRadius: "20px",
                        flexShrink: 0,
                    }}
                />

                <div style={{ display: "flex", gap: "40px", maxWidth: "1000px" }}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px",
                            maxWidth: "600px",
                        }}
                    >
                        <h1 style={{ fontSize: "30px", color: "#24586f" }}>
                            Champagne La Cave
                        </h1>

                        <p style={{ fontSize: "18px", color: "black" }}>
                            Champagne Julien HERBERT sélectionné par LA CAVE LA GARENNE <br /><br />
                            Premier Cru <br />Signature Gilles POTTIER<br /><br />
                            6 ans de viellissement minimum <br />4.8 g/L - Brut <br /><br />
                            Cuvée assemblage de trois cépages : 50% Chardonnay - 30% Pinot Noir - 20% Pinot Meunier
                            <br /><br />
                            Ce champne est le fruit d'un partenariat entre deux indépendants, Julien Herbert et Gilles Pottier,
                            partageant des valeurs communes de l'exigence, de l'authenticité, du travail.
                            <br /><br />29,90€
                        </p>
                    </div>

                    <div
                        style={{
                            border: "1px solid #24586f",
                            borderRadius: "20px",
                            padding: "25px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            alignContent: "center",
                            justifyItems: "center",
                            gap: "25px",
                            height: "fit-content",
                        }}
                    >
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button onClick={diminuer} style={{ width: 50, height: 50, fontSize: 24, borderRadius: 10 }}>−</button>
                            <input
                                type="number"
                                value={quantitec}
                                onChange={handleChange}
                                min={1}
                                max={MAX_QUANTITE}
                                style={{ width: 70, height: 50, textAlign: "center", fontSize: 18, borderRadius: 10 }}
                            />
                            <button onClick={augmenter} style={{ width: 50, height: 50, fontSize: 24, borderRadius: 10 }}>+</button>
                        </div>

                        <button
                            onClick={ajouterAuPanier}
                            disabled={disabled}
                            style={{
                                width: 170,
                                height: 70,
                                backgroundColor: "#8ba9b7",
                                border: "1px solid #24586f",
                                borderRadius: 20,
                                color: "white",
                                cursor: disabled ? "not-allowed" : "pointer",
                                opacity: disabled ? 0.6 : 1,
                            }}
                        >
                            Ajouter au panier
                        </button>

                        {message && <p style={{ color: "#24586f", fontSize: 16 }}>{message}</p>}
                    </div>
                </div>
            </div>
        </>
    );
}
