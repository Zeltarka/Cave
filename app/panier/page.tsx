"use client";
import { useState, useEffect } from "react";

type Produit = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
};

export default function PanierPage() {
    const [panier, setPanier] = useState<Produit[]>([]);

    // Charger le panier depuis l'API
    const fetchPanier = async () => {
        try {
            const res = await fetch("/api/commandes");
            const data: Produit[] = await res.json();
            setPanier(data);
        } catch (err) {
            console.error("Erreur récupération panier:", err);
        }
    };

    useEffect(() => {
        fetchPanier();
    }, []);

    // Sauvegarder le panier dans localStorage à chaque changement
    useEffect(() => {
        if (panier.length > 0) {
            localStorage.setItem("panier", JSON.stringify(panier));
        }
    }, [panier]);

    const maxQuantite = (produit: Produit) => {
        if (produit.produit === "Carte cadeau") return 10;
        if (produit.produit === "Champagne" || produit.produit === "Rosé") return 180;
        return 999;
    };

    const changerQuantite = async (id: string, nouvelleQuantite: number) => {
        const produit = panier.find((p) => p.id === id);
        if (!produit) return;

        const q = Math.max(0, Math.min(nouvelleQuantite, maxQuantite(produit)));
        const updatedPanier = panier.map((p) => (p.id === id ? { ...p, quantite: q } : p));
        setPanier(updatedPanier);

        try {
            await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...produit, quantite: q }),
            });
        } catch (err) {
            console.error("Erreur mise à jour API:", err);
        }
    };

    const supprimerProduit = async (id: string) => {
        const updatedPanier = panier.filter((p) => p.id !== id);
        setPanier(updatedPanier);

        try {
            await fetch("/api/commandes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (err) {
            console.error("Erreur suppression API:", err);
        }
    };

    const total = panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);

    return (
        <div style={{ padding: 50, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "800px" }}>
                <h1 style={{ fontSize: 24, color: "#24586f", textAlign: "center", marginBottom: 20 }}>
                    Panier
                </h1>

                {panier.length === 0 || panier.every((p) => p.quantite === 0) ? (
                    <p style={{ textAlign: "center", marginTop: 20 }}>Panier vide</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ borderBottom: "2px solid #ccc" }}>
                            <th style={{ textAlign: "left", padding: 8 }}>Produit</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Quantité</th>
                            <th style={{ textAlign: "right", padding: 8 }}>Prix unitaire</th>
                            <th style={{ textAlign: "right", padding: 8 }}>Total</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Supprimer</th>
                        </tr>
                        </thead>
                        <tbody>
                        {panier.map((produit) => (
                            <tr key={produit.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: 8 }}>
                                    {produit.produit}
                                    {produit.produit === "Carte cadeau" ? ` - ${produit.prix}€` : ""}
                                </td>
                                <td style={{ padding: 8, textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                        <button
                                            onClick={() => changerQuantite(produit.id, produit.quantite - 1)}
                                            style={{ width: 30, height: 30, fontSize: 18, cursor: "pointer" }}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={produit.quantite}
                                            min={0}
                                            max={maxQuantite(produit)}
                                            onChange={(e) => changerQuantite(produit.id, parseInt(e.target.value) || 0)}
                                            style={{ width: 50, textAlign: "center", fontSize: 16 }}
                                        />
                                        <button
                                            onClick={() => changerQuantite(produit.id, produit.quantite + 1)}
                                            style={{ width: 30, height: 30, fontSize: 18, cursor: "pointer" }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td style={{ padding: 8, textAlign: "right" }}>{produit.prix} €</td>
                                <td style={{ padding: 8, textAlign: "right" }}>{produit.prix * produit.quantite} €</td>
                                <td style={{ padding: 8, textAlign: "center" }}>
                                    <button
                                        onClick={() => supprimerProduit(produit.id)}
                                        style={{
                                            backgroundColor: "#24586f",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 10px",
                                            borderRadius: 5,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: 30, fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
                    Total : {total} €
                </div>
            </div>
        </div>
    );
}
