"use client";
import { useEffect, useState } from "react";
import { useMessages } from "@/hooks/useMessages";
import ConfirmationModal from "@/components/ConfirmationModal";
import Link from "next/link";

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
    const [fraisPort, setFraisPort] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [commandeValidee, setCommandeValidee] = useState(false);

    const { messages } = useMessages();

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

    const nombreBouteilles = panier
        .filter(p => !p.id.includes("carte-cadeau"))
        .reduce((sum, p) => sum + p.quantite, 0);

    useEffect(() => {
        const fetchFraisPort = async () => {
            if (commande.modeLivraison === "livraison" && nombreBouteilles > 0) {
                try {
                    const res = await fetch(`/api/frais-port?nombre=${nombreBouteilles}`);
                    const data = await res.json();
                    setFraisPort(data.frais || 0);
                } catch (err) {
                    console.error("Erreur récupération frais de port:", err);
                    setFraisPort(0);
                }
            } else {
                setFraisPort(0);
            }
        };

        fetchFraisPort();
    }, [commande.modeLivraison, nombreBouteilles]);

    const maxQuantite = (produit: Produit) => {
        if (produit.id.includes("carte-cadeau")) return 10;
        if (produit.id === "champagne" || produit.id === "rose") return 180;
        return 999;
    };

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
    const totalAvecPort = total + fraisPort;
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
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (err) {
            console.error("Erreur suppression produit :", err);
        }
    };

    const viderPanierBDD = async () => {
        try {
            await Promise.all(
                panier.map(produit =>
                    fetch("/api/commandes", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: produit.id }),
                    })
                )
            );
        } catch (err) {
            console.error("Erreur vidage panier en BDD :", err);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setCommande((prev) => ({ ...prev, [name]: value }));
    };

    const validerCommande = async () => {
        if (commande.modeLivraison === "livraison") {
            if (
                !commande.nom ||
                !commande.prenom ||
                !commande.email ||
                !commande.adresse ||
                !commande.codepostal ||
                !commande.ville
            ) {
                setModalType("error");
                setModalTitle("Erreur");
                setModalMessage("Merci de remplir tous les champs obligatoires pour la livraison");
                setModalOpen(true);
                return;
            }
        } else {
            if (!commande.nom || !commande.prenom || !commande.email) {
                setModalType("error");
                setModalTitle("Erreur");
                setModalMessage("Merci de remplir le nom, prénom et email");
                setModalOpen(true);
                return;
            }
        }

        if ((commande.modeLivraison === "retrait" || commande.modePaiement === "boutique") && !commande.datePassage) {
            setModalType("error");
            setModalTitle("Erreur");
            setModalMessage("Merci de sélectionner une date de passage en boutique");
            setModalOpen(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(commande.email)) {
            setModalType("error");
            setModalTitle("Erreur");
            setModalMessage("Veuillez entrer une adresse email valide");
            setModalOpen(true);
            return;
        }

        setDisabled(true);

        try {
            const res = await fetch("/api/commandes/valider", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client: commande,
                    panier,
                    total: totalAvecPort,
                    fraisPort
                }),
            });

            const data = await res.json();

            if (data.success) {
                await viderPanierBDD();
                setPanier([]);
                setAfficherCommande(false);
                setCommande({
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

                setCommandeValidee(true);
                setModalType("success");
                setModalTitle("Commande validée !");
                setModalMessage("Votre commande a été validée avec succès ! Vous allez recevoir un email de confirmation.");
                setModalOpen(true);
            } else {
                setModalType("error");
                setModalTitle("Erreur");
                setModalMessage(data.message || "Erreur lors de la validation de la commande.");
                setModalOpen(true);
            }
        } catch (err) {
            console.error("Erreur validation commande :", err);
            setModalType("error");
            setModalTitle("Erreur serveur");
            setModalMessage("Une erreur est survenue. Veuillez réessayer.");
            setModalOpen(true);
        } finally {
            setDisabled(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 lg:p-12 flex justify-center">
            <div className="w-full max-w-5xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#24586f] text-center mb-6 sm:mb-8 font-semibold">
                    Panier
                </h1>

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
                        {/* Desktop Table */}
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
                                                        onChange={(e) => changerQuantite(produit.id, parseInt(e.target.value))}
                                                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                    >
                                                        {getQuantitesDisponibles(produit).map((qty) => (
                                                            <option key={qty} value={qty}>{qty}</option>
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
                                                        setPanier(prev => prev.map(p => p.id === produit.id ? { ...p, prix, quantite: 1 } : p));
                                                        await fetch("/api/commandes", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ ...produit, prix, quantite: 1 }),
                                                        });
                                                    }}
                                                    className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                                                />
                                            ) : (
                                                <span>{Math.round(produit.prix)} €</span>
                                            )}
                                        </td>

                                        <td className="p-3 text-right font-semibold">
                                            {Math.round(produit.prix * produit.quantite)} €
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

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {panier.map((produit) => (
                                <div key={produit.id} className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
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
                                                    onChange={(e) => changerQuantite(produit.id, parseInt(e.target.value))}
                                                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                >
                                                    {getQuantitesDisponibles(produit).map((qty) => (
                                                        <option key={qty} value={qty}>{qty}</option>
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
                                                    setPanier(prev => prev.map(p => p.id === produit.id ? { ...p, prix, quantite: 1 } : p));
                                                    await fetch("/api/commandes", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ ...produit, prix, quantite: 1 }),
                                                    });
                                                }}
                                                className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                                            />
                                        ) : (
                                            <span>{Math.round(produit.prix)} €</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-gray-600 font-semibold">Total :</span>
                                        <span className="font-bold text-lg">{Math.round(produit.prix * produit.quantite)} €</span>
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
                                <div className="mt-8 bg-[#f1f5ff] border-2 border-[#24586f] rounded-lg p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-gray-700">Sous-total produits</span>
                                            <span className="text-xl font-semibold text-[#24586f]">{total.toFixed(2)} €</span>
                                        </div>

                                        {commande.modeLivraison === "livraison" && nombreBouteilles > 0 && (
                                            <div className="flex justify-between items-center border-t pt-3">
                                                <span className="text-lg text-gray-700">
                                                    Frais de port ({nombreBouteilles} bouteille{nombreBouteilles > 1 ? 's' : ''})
                                                </span>
                                                <span className="text-xl font-semibold text-[#24586f]">{fraisPort.toFixed(2)} €</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center border-t-2 border-[#24586f] pt-3">
                                            <span className="text-2xl font-bold text-[#24586f]">Total</span>
                                            <span className="text-3xl font-bold text-[#24586f]">{totalAvecPort.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mt-6">
                                    <Link
                                        href="/la-cave"
                                        className="inline-block mr-4 px-6 py-3 border-2 border-[#24586f] text-[#24586f] rounded-lg hover:bg-[#24586f] hover:text-white transition-colors font-medium"
                                    >
                                        Continuer mes achats
                                    </Link>
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
                                        className="inline-block px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors font-medium cursor-pointer"
                                    >
                                        Valider ma commande
                                    </button>
                                </div>
                            </>
                        )}

                        {afficherCommande && !panierVide && (
                            <div id="formulaire-commande" className="mt-8 p-4 sm:p-6 border border-gray-300 rounded-lg bg-white shadow-md">
                                <h2 className="mb-6 text-xl sm:text-2xl font-semibold text-[#24586f]">
                                    Informations de commande
                                </h2>

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
                                                <span className='text-sm text-gray-600 block'>Les frais de port sont ajustés automatiquement</span>
                                                {nombreBouteilles > 0 && fraisPort > 0 && (
                                                    <span className="text-sm text-gray-600 block">
                                                        Frais de port : {fraisPort.toFixed(2)} € pour {nombreBouteilles} bouteille{nombreBouteilles > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="block text-gray-700 font-semibold mb-3">Coordonnées de l'acheteur * </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            name="nom"
                                            placeholder="Nom *"
                                            value={commande.nom}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                        />
                                        <input
                                            name="prenom"
                                            placeholder="Prénom *"
                                            value={commande.prenom}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                        />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Adresse email *"
                                        value={commande.email}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />
                                    <input
                                        name="telephone"
                                        type="tel"
                                        placeholder="Numéro de téléphone (optionnel)"
                                        value={commande.telephone}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                    />

                                    {commande.modeLivraison === "livraison" && (
                                        <>
                                            <input
                                                name="adresse"
                                                placeholder="Adresse *"
                                                value={commande.adresse}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <input
                                                    name="codepostal"
                                                    placeholder="Code Postal *"
                                                    value={commande.codepostal}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                />
                                                <input
                                                    name="ville"
                                                    placeholder="Ville *"
                                                    value={commande.ville}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <textarea
                                        name="commentaires"
                                        placeholder="Commentaires (optionnel)"
                                        value={commande.commentaires}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] resize-vertical"
                                    />
                                </div>

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

                                {(commande.modeLivraison === "retrait" || commande.modePaiement === "boutique") && (
                                    <div className="mt-4">
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Date de passage en boutique souhaitée *
                                        </label>
                                        <input
                                            type="date"
                                            name="datePassage"
                                            value={commande.datePassage}
                                            onClick={(e) => {
                                                e.currentTarget.showPicker?.();
                                            }}
                                            onChange={(e) => {
                                                const selectedDate = new Date(e.target.value + 'T00:00:00');
                                                const dayOfWeek = selectedDate.getDay();

                                                if (dayOfWeek === 0) {
                                                    setModalType("error");
                                                    setModalTitle("Date invalide");
                                                    setModalMessage("La boutique est fermée le dimanche. Veuillez choisir un autre jour.");
                                                    setModalOpen(true);
                                                    return;
                                                }

                                                handleChange(e);
                                            }}
                                            min={(() => {
                                                const afterTomorrow = new Date();
                                                afterTomorrow.setDate(afterTomorrow.getDate() + 2);
                                                return afterTomorrow.toISOString().split('T')[0];
                                            })()}
                                            onKeyDown={(e) => e.preventDefault()}
                                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] cursor-pointer"
                                        />
                                        <p className="text-sm text-gray-600 mt-2">
                                            Indiquez la date à laquelle vous prévoyez de passer en boutique
                                            {commande.modeLivraison === "retrait" && commande.modePaiement === "boutique"
                                                ? " pour récupérer et payer votre commande"
                                                : commande.modeLivraison === "retrait"
                                                    ? " pour récupérer votre commande"
                                                    : " pour payer votre commande"}
                                            {" "}(à partir d'après-demain, fermé le dimanche).
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
                                    {disabled ? "Traitement en cours..." : "Valider la commande"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    if (commandeValidee) {
                        window.location.href = "/";
                    }
                }}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    );
}