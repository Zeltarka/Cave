"use client";
import { useEffect, useState } from "react";

type Produit = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
};

type Commande = {
    nom: string;
    prenom: string;
    email: string;
    adresse: string;
    ville: string;
    codepostal: string;
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
    const [disabled, setDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState("");
    const [confirmation, setConfirmation] = useState(false);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        if (countdown === 0) setDisabled(false);
    }, [countdown]);

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

    const maxQuantite = (produit: Produit) => {
        if (produit.produit === "Carte cadeau") return 10;
        if (produit.id === "champagne" || produit.id === "rose") return 180;
        return 999;
    };

    const total = panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
    const panierVide = panier.length === 0 || panier.every((p) => p.quantite === 0);

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

        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(commande.email)) {
            alert("Veuillez entrer une adresse email valide");
            return;
        }

        setDisabled(true);
        setCountdown(15);

        try {
            const res = await fetch("/api/commandes/valider", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ client: commande, panier, total }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage("Commande validée avec succès !");
                setPanier([]);
                localStorage.removeItem("panier");
                setConfirmation(true);

                setTimeout(() => {
                    setConfirmation(false);
                    window.location.href = "/";
                }, 10000);
            } else {
                setMessage(data.message || "Erreur lors de la commande.");
                setDisabled(false);
                setCountdown(0);
            }
        } catch (err) {
            console.error("Erreur validation commande :", err);
            setMessage("Erreur serveur.");
            setDisabled(false);
            setCountdown(0);
        }
    };

    return (
        <div className="p-4 sm:p-8 lg:p-12 flex justify-center">
            <div className="w-full max-w-5xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#24586f] text-center mb-6 sm:mb-8 font-semibold">
                    Panier
                </h1>

                {confirmation && (
                    <p className="text-center text-[#24586f] font-bold mb-6 text-base sm:text-lg">
                        Votre commande a été traitée ! <br /> Vous allez recevoir un email
                    </p>
                )}

                {panierVide ? (
                    <div className="text-center mt-8">
                        <p className="text-lg text-gray-600 mb-6">Votre panier est vide</p>
                        <button
                            onClick={() => window.location.href = "/la-cave"}
                            className="bg-[#24586f] text-white px-6 py-3 rounded-lg hover:bg-[#1a4557] transition-colors cursor-pointer"
                        >
                            Le remplir
                        </button>
                    </div>
                ) : (
                    <>
                        {/* === Desktop === */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left p-3">Produit</th>
                                    <th className="text-center p-3">Quantité</th>
                                    <th className="text-right p-3">Prix unitaire</th>
                                    <th className="text-right p-3">Total</th>
                                    <th className="text-center p-3">Supprimer</th>
                                </tr>
                                </thead>
                                <tbody>
                                {panier.map((produit) => (
                                    <tr key={produit.id} className="border-b border-gray-200">
                                        <td className="p-3">
                                            {produit.produit}
                                            {produit.produit === "Carte cadeau" && produit.destinataire && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Pour : <span className="font-medium">{produit.destinataire}</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => changerQuantite(produit.id, produit.quantite - 1)}
                                                    className="w-8 h-8 text-lg text-[#24586f] cursor-pointer hover:bg-gray-100 rounded"
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
                                                    className="w-14 text-center text-base border border-gray-300 rounded px-2 py-1"
                                                />

                                                <button
                                                    onClick={() => changerQuantite(produit.id, produit.quantite + 1)}
                                                    className="w-8 h-8 text-lg text-[#24586f] cursor-pointer hover:bg-gray-100 rounded"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>

                                        <td className="p-3 text-right">
                                            {produit.produit === "Carte cadeau" ? (
                                                <input
                                                    type="number"
                                                    min={10}
                                                    step={10}
                                                    value={produit.prix}
                                                    onChange={async (e) => {
                                                        const prix = parseFloat(e.target.value) || 0;

                                                        setPanier(prev =>
                                                            prev.map(p =>
                                                                p.id === produit.id
                                                                    ? { ...p, prix, quantite: 1 }
                                                                    : p
                                                            )
                                                        );

                                                        await fetch("/api/commandes", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                ...produit,
                                                                prix,
                                                                quantite: 1,
                                                            }),
                                                        });
                                                    }}
                                                    className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                                                />
                                            ) : (
                                                <span>{produit.prix.toFixed(2)} €</span>
                                            )}
                                        </td>

                                        <td className="p-3 text-right font-semibold">
                                            {(produit.prix * produit.quantite).toFixed(2)} €
                                        </td>

                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => supprimerProduit(produit.id)}
                                                className="bg-[#24586f] text-white border-none px-4 py-2 rounded hover:bg-[#1a4557] transition-colors cursor-pointer"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* === Mobile === */}
                        <div className="md:hidden space-y-4">
                            {panier.map((produit) => (
                                <div
                                    key={produit.id}
                                    className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
                                >
                                    <div className="font-semibold text-lg mb-3 text-[#24586f]">
                                        {produit.produit}
                                        {produit.produit === "Carte cadeau" && produit.destinataire && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                Pour : <span className="font-medium">{produit.destinataire}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600">Quantité :</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => changerQuantite(produit.id, produit.quantite - 1)}
                                                className="w-8 h-8 text-lg text-[#24586f] cursor-pointer border border-gray-300 rounded"
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
                                                className="w-14 text-center text-base border border-gray-300 rounded px-2 py-1"
                                            />
                                            <button
                                                onClick={() => changerQuantite(produit.id, produit.quantite + 1)}
                                                className="w-8 h-8 text-lg text-[#24586f] cursor-pointer border border-gray-300 rounded"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-600">Prix unitaire :</span>
                                        {produit.produit === "Carte cadeau" ? (
                                            <input
                                                type="number"
                                                min={10}
                                                step={10}
                                                value={produit.prix}
                                                onChange={async (e) => {
                                                    const prix = parseFloat(e.target.value) || 0;

                                                    setPanier((prev) =>
                                                        prev.map((p) =>
                                                            p.id === produit.id
                                                                ? { ...p, prix, quantite: 1 }
                                                                : p
                                                        )
                                                    );

                                                    await fetch("/api/commandes", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            ...produit,
                                                            prix,
                                                            quantite: 1,
                                                        }),
                                                    });
                                                }}
                                                className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                                            />
                                        ) : (
                                            <span>{produit.prix.toFixed(2)} €</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-600 font-semibold">Total :</span>
                                        <span className="font-bold text-lg">
                                            {(produit.prix * produit.quantite).toFixed(2)} €
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => supprimerProduit(produit.id)}
                                        className="w-full bg-[#24586f] text-white border-none px-4 py-2 rounded hover:bg-[#1a4557] transition-colors cursor-pointer"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                        </div>

                        {!panierVide && (
                            <>
                                <div className="mt-8 text-xl sm:text-2xl font-bold text-center text-[#24586f]">
                                    Total : {total.toFixed(2)} €
                                </div>
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => {
                                            setAfficherCommande(true);
                                            setTimeout(() => {
                                                const formulaire = document.getElementById('formulaire-commande');
                                                if (formulaire) {
                                                    formulaire.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        }}
                                        className="bg-[#24586f] text-white border-none px-8 py-3 rounded-lg text-base sm:text-lg cursor-pointer hover:bg-[#1a4557] transition-colors"
                                    >
                                        Commander
                                    </button>
                                </div>
                            </>
                        )}

                        {afficherCommande && !panierVide && (
                            <div id="formulaire-commande" className="mt-8 p-4 sm:p-6 border border-gray-300 rounded-lg bg-white shadow-md">
                                <h2 className="mb-6 text-xl sm:text-2xl font-semibold text-[#24586f]">
                                    Informations de commande
                                </h2>
                                <div className="space-y-4">
                                    <input
                                        name="nom"
                                        placeholder="Nom"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="prenom"
                                        placeholder="Prénom"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Adresse email"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="adresse"
                                        placeholder="Adresse"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="codepostal"
                                        placeholder="Code Postal"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="ville"
                                        placeholder="Ville"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                </div>
                                <p className="mt-4 text-gray-700">
                                    Paiement par virement bancaire, vous recevrez les informations nécessaires dans le mail de confirmation.
                                </p>
                                <button
                                    onClick={() => {
                                        if (disabled) return;
                                        validerCommande();
                                    }}
                                    disabled={disabled}
                                    className={`mt-6 w-full px-6 py-3 rounded-lg text-base sm:text-lg font-medium transition-colors ${
                                        disabled
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-[#24586f] hover:bg-[#1a4457] cursor-pointer"
                                    } text-white border-none`}
                                >
                                    {disabled ? `Patientez... ${countdown}s` : "Valider la commande"}
                                </button>
                                {message && (
                                    <p className="text-[#24586f] font-bold mt-4 text-center">
                                        {message}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}