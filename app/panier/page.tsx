"use client";
import { useEffect, useState } from "react";
import { useMessages } from "@/hooks/useMessages"

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
    telephone: string;
    adresse: string;
    ville: string;
    codepostal: string;
    commentaires: string;
    modeLivraison: "livraison" | "retrait";
    modePaiement: "virement" | "boutique";
    datePassage: string;
};

export default function PanierPage() {
    const [panier, setPanier] = useState<Produit[]>([]);
    const [afficherCommande, setAfficherCommande] = useState(false);
    const [commande, setCommande] = useState<Commande>({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        adresse: "",
        ville: "",
        codepostal: "",
        commentaires: "",
        modeLivraison: "retrait",
        modePaiement: "virement",
        datePassage: "",
    });
    const [disabled, setDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState("");
    const [confirmation, setConfirmation] = useState(false);
    const { messages } = useMessages();

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

    const maxQuantite = (produit: Produit) => {
        if (produit.id.includes("carte-cadeau")) return 10;
        if (produit.id === "champagne" || produit.id === "rose") return 180;
        return 999;
    };

    // Fonction pour obtenir les quantités disponibles pour les bouteilles
    const getQuantitesDisponibles = (produit: Produit) => {
        if (produit.id.includes("carte-cadeau")) {
            return Array.from({ length: 10 }, (_, i) => i + 1);
        }
        if (produit.id === "champagne" || produit.id === "rose") {
            return [6, 12, 18, 24];
        }
        return [6, 12, 18, 24];
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
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setCommande((prev) => ({ ...prev, [name]: value }));
    };

    const validerCommande = async () => {
        // Validation des champs obligatoires selon le mode de livraison
        if (commande.modeLivraison === "livraison") {
            if (
                !commande.nom ||
                !commande.prenom ||
                !commande.email ||
                !commande.adresse ||
                !commande.codepostal ||
                !commande.ville
            ) {
                alert("Merci de remplir tous les champs obligatoires pour la livraison");
                return;
            }
        } else {
            // Pour le retrait en boutique, l'adresse n'est pas obligatoire
            if (!commande.nom || !commande.prenom || !commande.email) {
                alert("Merci de remplir le nom, prénom et email");
                return;
            }
        }

        // Validation de la date de passage si paiement en boutique
        if (commande.modePaiement === "boutique" && !commande.datePassage) {
            alert("Merci de sélectionner une date de passage en boutique pour le paiement");
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
                                            {produit.destinataire && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Pour : <span className="font-medium">{produit.destinataire}</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {produit.id.includes("carte-cadeau") ? (
                                                    <span className="text-base font-semibold">{produit.quantite}</span>
                                                ) : (
                                                    <select
                                                        value={produit.quantite}
                                                        onChange={(e) =>
                                                            changerQuantite(
                                                                produit.id,
                                                                parseInt(e.target.value)
                                                            )
                                                        }
                                                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                    >
                                                        {getQuantitesDisponibles(produit).map((qty) => (
                                                            <option key={qty} value={qty}>
                                                                {qty}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-3 text-right">
                                            {produit.id.includes("carte-cadeau") ? (
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
                                        {produit.destinataire && (
                                            <div className="text-sm text-gray-600 font-normal mt-1">
                                                Pour : <span className="font-medium">{produit.destinataire}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600">Quantité :</span>
                                        <div className="flex items-center gap-2">
                                            {produit.id.includes("carte-cadeau") ? (
                                                <span className="text-base font-semibold">{produit.quantite}</span>
                                            ) : (
                                                <select
                                                    value={produit.quantite}
                                                    onChange={(e) =>
                                                        changerQuantite(
                                                            produit.id,
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                >
                                                    {getQuantitesDisponibles(produit).map((qty) => (
                                                        <option key={qty} value={qty}>
                                                            {qty}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-600">Prix unitaire :</span>
                                        {produit.id.includes("carte-cadeau") ? (
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

                                {/* Choix du mode de livraison */}
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-semibold mb-3">
                                        Mode de récupération *
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="modeLivraison"
                                                value="retrait"
                                                checked={commande.modeLivraison === "retrait"}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-[#24586f] focus:ring-[#24586f]"
                                            />
                                            <span className="ml-3">
                                                <span className="font-semibold">Retrait en boutique</span>
                                                <span className="text-sm text-gray-600 block">3 rue Voltaire, 92250 La Garenne-Colombes</span>
                                            </span>
                                        </label>
                                        <label className="flex items-center p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="modeLivraison"
                                                value="livraison"
                                                checked={commande.modeLivraison === "livraison"}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-[#24586f] focus:ring-[#24586f]"
                                            />
                                            <span className="ml-3">
                                                <span className="font-semibold">Livraison à domicile</span>
                                                <span className="text-sm text-gray-600 block">Les frais de port seront calculés et communiqués ultérieurement</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            name="nom"
                                            placeholder="Nom *"
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                        />
                                        <input
                                            name="prenom"
                                            placeholder="Prénom *"
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                        />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Adresse email *"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="telephone"
                                        type="tel"
                                        placeholder="Numéro de téléphone (optionnel)"
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />

                                    {commande.modeLivraison === "livraison" && (
                                        <>
                                            <input
                                                name="adresse"
                                                placeholder="Adresse *"
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <input
                                                    name="codepostal"
                                                    placeholder="Code Postal *"
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                />
                                                <input
                                                    name="ville"
                                                    placeholder="Ville *"
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <textarea
                                        name="commentaires"
                                        placeholder="Commentaires (optionnel)"
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] resize-vertical"
                                    />
                                </div>

                                {commande.modeLivraison === "livraison" && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                                        <p className="text-sm text-amber-800">
                                            <strong>Note :</strong> Les frais de port seront calculés en fonction de votre adresse et vous seront communiqués par email. Le montant total de votre commande sera ajusté en conséquence.
                                        </p>
                                    </div>
                                )}

                                {/* Choix du mode de paiement */}
                                <div className="mt-6">
                                    <label className="block text-gray-700 font-semibold mb-3">
                                        Mode de paiement *
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-start p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="modePaiement"
                                                value="virement"
                                                checked={commande.modePaiement === "virement"}
                                                onChange={handleChange}
                                                className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]"
                                            />
                                            <span className="ml-3">
                                                <span className="font-semibold">Virement bancaire</span>
                                                <span className="text-sm text-gray-600 block">
                                                    Vous recevrez les informations bancaires par email. La commande sera traitée après réception du paiement.
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex items-start p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="modePaiement"
                                                value="boutique"
                                                checked={commande.modePaiement === "boutique"}
                                                onChange={handleChange}
                                                className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]"
                                            />
                                            <span className="ml-3">
                                                <span className="font-semibold">Paiement en boutique</span>
                                                <span className="text-sm text-gray-600 block">
                                                    Vous paierez directement en boutique lors de la récupération de votre commande.
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Date de passage si paiement en boutique */}
                                {commande.modePaiement === "boutique" && (
                                    <div className="mt-4">
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Date de passage en boutique *
                                        </label>
                                        <input
                                            type="date"
                                            name="datePassage"
                                            onChange={handleChange}
                                            min={(() => {
                                                const afterTomorrow = new Date();
                                                afterTomorrow.setDate(afterTomorrow.getDate() + 2);
                                                return afterTomorrow.toISOString().split('T')[0];
                                            })()}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                            Indiquez la date à laquelle vous prévoyez de passer en boutique pour récupérer et payer votre commande (à partir d'après-demain).
                                        </p>
                                    </div>
                                )}
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