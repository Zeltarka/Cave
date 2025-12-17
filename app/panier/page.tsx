"use client";
import { useEffect, useState } from "react";

type Produit = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
};

type Commande = {
    nom: string;
    prenom: string;
    email: string;
    adresse: string;
    ville: string;
    codeposta: string;
};

export default function PanierPage() {
    const [panier, setPanier] = useState<Produit[]>([]);
    const [afficherCommande, setAfficherCommande] = useState(false);
    const [commande, setCommande] = useState<Commande>({
        nom: "",
        prenom: "",
        email: "",
        adresse: "",
        ville: "",
        codepostal: "",

    });

    /* =====================
       Chargement panier
    ====================== */
    const fetchPanier = async () => {
        try {
            const res = await fetch("/api/commandes");
            const data: Produit[] = await res.json();
            setPanier(data);
        } catch (err) {
            console.error("Erreur récupération panier :", err);
        }
    };

    useEffect(() => {
        fetchPanier();
    }, []);

    useEffect(() => {
        localStorage.setItem("panier", JSON.stringify(panier));
    }, [panier]);

    /* =====================
       Utilitaires
    ====================== */
    const maxQuantite = (produit: Produit) => {
        if (produit.produit === "Carte cadeau") return 10;
        if (produit.produit === "Champagne" || produit.produit === "Rosé") return 180;
        return 999;
    };

    const total = panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
    const panierVide = panier.length === 0 || panier.every((p) => p.quantite === 0);

    /* =====================
       Actions panier
    ====================== */
    const changerQuantite = async (id: string, nouvelleQuantite: number) => {
        const produit = panier.find((p) => p.id === id);
        if (!produit) return;

        const quantite = Math.max(0, Math.min(nouvelleQuantite, maxQuantite(produit)));

        setPanier((prev) =>
            prev.map((p) => (p.id === id ? { ...p, quantite } : p))
        );

        try {
            await fetch("/api/commandes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...produit, quantite }),
            });
        } catch (err) {
            console.error("Erreur mise à jour quantité :", err);
        }
    };

    const supprimerProduit = async (id: string) => {
        setPanier((prev) => prev.filter((p) => p.id !== id));

        try {
            await fetch("/api/commandes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch (err) {
            console.error("Erreur suppression produit :", err);
        }
    };

    /* =====================
       Formulaire commande
    ====================== */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setCommande((prev) => ({ ...prev, [name]: value }));
    };

    const validerCommande = async () => {
        if (
            !commande.nom ||
            !commande.prenom ||
            !commande.email ||
            !commande.adresse ||
            !commande.codepostal ||
            !commande.ville
        ) {
            alert("Merci de remplir tous les champs");
            return;
        }

        try {
            await fetch("/api/commandes/valider", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client: commande,
                    panier,
                    total,
                }),
            });

            alert("Commande validée !");
        } catch (err) {
            console.error("Erreur validation commande :", err);
        }
    };

    /* =====================
       RENDER
    ====================== */
    return (
        <div style={{ padding: 50, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "800px" }}>
                <h1
                    style={{
                        fontSize: 24,
                        color: "#24586f",
                        textAlign: "center",
                        marginBottom: 20,
                    }}
                >
                    Panier
                </h1>

                {panierVide ? (
                    <p style={{ textAlign: "center", marginTop: 20 }}>Panier vide</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ borderBottom: "2px solid #ccc" }}>
                            <th style={{ textAlign: "left", padding: 8 }}>Produit</th>
                            <th style={{ textAlign: "center", padding: 8 }}>Quantité</th>
                            <th style={{ textAlign: "right", padding: 8 }}>
                                Prix unitaire
                            </th>
                            <th style={{ textAlign: "right", padding: 8 }}>Total</th>
                            <th style={{ textAlign: "center", padding: 8 }}>
                                Supprimer
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {panier.map((produit) => (
                            <tr
                                key={produit.id}
                                style={{ borderBottom: "1px solid #eee" }}
                            >
                                <td style={{ padding: 8 }}>
                                    {produit.produit}
                                    {produit.produit === "Carte cadeau"
                                        ? ` - ${produit.prix}€`
                                        : ""}
                                </td>
                                <td style={{ padding: 8, textAlign: "center" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 5,
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                changerQuantite(
                                                    produit.id,
                                                    produit.quantite - 1
                                                )
                                            }
                                            style={{
                                                width: 30,
                                                height: 30,
                                                fontSize: 18,
                                                cursor: "pointer",
                                            }}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            value={produit.quantite}
                                            min={0}
                                            max={maxQuantite(produit)}
                                            onChange={(e) =>
                                                changerQuantite(
                                                    produit.id,
                                                    parseInt(e.target.value) || 0
                                                )
                                            }
                                            style={{
                                                width: 50,
                                                textAlign: "center",
                                                fontSize: 16,
                                            }}
                                        />
                                        <button
                                            onClick={() =>
                                                changerQuantite(
                                                    produit.id,
                                                    produit.quantite + 1
                                                )
                                            }
                                            style={{
                                                width: 30,
                                                height: 30,
                                                fontSize: 18,
                                                cursor: "pointer",
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td style={{ padding: 8, textAlign: "right" }}>
                                    {produit.prix} €
                                </td>
                                <td style={{ padding: 8, textAlign: "right" }}>
                                    {produit.prix * produit.quantite} €
                                </td>
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

                {!panierVide && (
                    <>
                        <div
                            style={{
                                marginTop: 30,
                                fontSize: 20,
                                fontWeight: "bold",
                                textAlign: "center",
                            }}
                        >
                            Total : {total} €
                        </div>

                        <div style={{ textAlign: "center", marginTop: 20 }}>
                            <button
                                onClick={() => setAfficherCommande(true)}
                                style={{
                                    backgroundColor: "#24586f",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: 5,
                                    fontSize: 16,
                                    cursor: "pointer",
                                }}
                            >
                                Commander
                            </button>
                        </div>
                    </>
                )}

                {afficherCommande && !panierVide && (
                    <div
                        style={{
                            marginTop: 30,
                            padding: 20,
                            border: "1px solid #ccc",
                            borderRadius: 8,
                        }}
                    >
                        <h2 style={{ marginBottom: 15 }}>
                            Informations de commande
                        </h2>

                        <input
                            name="nom"
                            placeholder="Nom"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />
                        <input
                            name="prenom"
                            placeholder="Prénom"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />
                        <input
                            name="email"
                            type="email"
                            placeholder="Adresse email"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />
                        <input
                            name="adresse"
                            placeholder="Adresse"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />
                        <input
                            name="codepostal"
                            placeholder="Code Postal"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />
                        <input
                            name="ville"
                            placeholder="Ville"
                            onChange={handleChange}
                            style={{ width: "100%", padding: 8, marginBottom: 10 }}
                        />

                        <p>Paiement par virement bancaire</p>


                        <button
                            onClick={validerCommande}
                            style={{
                                backgroundColor: "#24586f",
                                color: "white",
                                border: "none",
                                padding: "10px 20px",
                                borderRadius: 5,
                                fontSize: 16,
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            Valider la commande
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
