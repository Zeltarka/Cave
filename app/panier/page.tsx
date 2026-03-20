"use client";
import { useEffect, useRef, useState } from "react";
import { useMessages } from "@/hooks/useMessages";
import ConfirmationModal from "@/components/ConfirmationModal";
import Link from "next/link";
import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr";
import "flatpickr/dist/flatpickr.min.css";

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

function getDateMin(joursAvant = 2): string {
    const d = new Date();
    d.setDate(d.getDate() + joursAvant);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${j}`;
}

export default function PanierPage() {
    const datePickerRef = useRef<HTMLInputElement>(null);
    const fpInstanceRef = useRef<flatpickr.Instance | null>(null);
    const [panier, setPanier] = useState<Produit[]>([]);
    const [afficherCommande, setAfficherCommande] = useState(false);
    const [commande, setCommande] = useState<Commande>({
        nom: "", prenom: "", email: "", telephone: "", adresse: "", ville: "",
        codepostal: "", commentaires: "", modeLivraison: "retrait", modePaiement: "virement", datePassage: "",
    });
    const [disabled, setDisabled] = useState(false);
    const [fraisPort, setFraisPort] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error" | "info">("success");
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [commandeValidee, setCommandeValidee] = useState(false);
    const [certifieMajeur, setCertifieMajeur] = useState(false);
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

    useEffect(() => { fetchPanier(); }, []);

    const seulementCartesCadeaux = panier.length > 0 && panier.every(p => p.id.includes("carte-cadeau"));

    const afficherDate = !(seulementCartesCadeaux && commande.modePaiement === "virement") &&
        (commande.modeLivraison === "retrait" || commande.modePaiement === "boutique");

    useEffect(() => {
        if (!afficherCommande || !afficherDate || !datePickerRef.current) return;

        fpInstanceRef.current = flatpickr(datePickerRef.current, {
            locale: French,
            dateFormat: "Y-m-d",
            altInput: true,
            altInputClass: "w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] bg-white text-black placeholder:text-gray-400 cursor-pointer pr-12",
            altFormat: "d/m/Y",
            minDate: getDateMin(2),
            disable: [(date) => date.getDay() === 0],
            disableMobile: true,
            defaultDate: commande.datePassage || undefined,
            onChange: ([selected]) => {
                if (!selected) return;
                const y = selected.getFullYear();
                const m = String(selected.getMonth() + 1).padStart(2, "0");
                const j = String(selected.getDate()).padStart(2, "0");
                setCommande(prev => ({ ...prev, datePassage: `${y}-${m}-${j}` }));
            },
            onReady: (_dates, _str, instance) => {
                const altInput = instance.altInput;
                if (altInput) altInput.placeholder = "Sélectionner une date";
            },
        }) as flatpickr.Instance;

        return () => {
            fpInstanceRef.current?.destroy();
            fpInstanceRef.current = null;
        };
    }, [afficherCommande, afficherDate]);

    const nombreBouteilles = panier.filter(p => !p.id.includes("carte-cadeau")).reduce((sum, p) => sum + p.quantite, 0);
    const totalBouteilles  = panier.filter(p => p.id === "champagne" || p.id === "rose").reduce((sum, p) => sum + p.quantite, 0);

    useEffect(() => {
        if (seulementCartesCadeaux && commande.modeLivraison === "livraison") {
            setCommande(prev => ({ ...prev, modeLivraison: "retrait" }));
        }
    }, [seulementCartesCadeaux]);

    useEffect(() => {
        const fetchFraisPort = async () => {
            if (commande.modeLivraison === "livraison" && nombreBouteilles > 0) {
                try {
                    const res  = await fetch(`/api/frais-port?nombre=${nombreBouteilles}`);
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
        if (produit.id.includes("carte-cadeau")) return Array.from({ length: 10 }, (_, i) => i + 1);
        if (produit.id === "champagne" || produit.id === "rose") {
            const autresBouteilles = panier.filter(p => (p.id === "champagne" || p.id === "rose") && p.id !== produit.id).reduce((sum, p) => sum + p.quantite, 0);
            return [6, 12, 18, 24].filter(qty => qty <= 24 - autresBouteilles);
        }
        return [6, 12, 18, 24];
    };

    const total         = panier.reduce((sum, p) => sum + p.prix * p.quantite, 0);
    const totalAvecPort = total + fraisPort;
    const panierVide    = panier.length === 0 || panier.every((p) => p.quantite === 0);

    const changerQuantite = async (id: string, nouvelleQuantite: number) => {
        const produit = panier.find((p) => p.id === id);
        if (!produit) return;
        if (id === "champagne" || id === "rose") {
            const autresBouteilles = panier.filter(p => (p.id === "champagne" || p.id === "rose") && p.id !== id).reduce((sum, p) => sum + p.quantite, 0);
            const nouveauTotal = autresBouteilles + nouvelleQuantite;
            if (nouveauTotal > 24) nouvelleQuantite = Math.max(0, 24 - autresBouteilles);
        }
        const quantite = Math.max(0, Math.min(nouvelleQuantite, maxQuantite(produit)));
        setPanier((prev) => prev.map((p) => (p.id === id ? { ...p, quantite } : p)));
        try {
            await fetch("/api/commandes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...produit, quantite }) });
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (err) { console.error("Erreur mise à jour quantité :", err); }
    };

    const supprimerProduit = async (id: string) => {
        setPanier((prev) => prev.filter((p) => p.id !== id));
        try {
            await fetch("/api/commandes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (err) { console.error("Erreur suppression produit :", err); }
    };

    const viderPanierBDD = async () => {
        try {
            await Promise.all(panier.map(produit =>
                fetch("/api/commandes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: produit.id }) })
            ));
        } catch (err) { console.error("Erreur vidage panier en BDD :", err); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCommande((prev) => ({ ...prev, [name]: value }));
    };

    const validerCommande = async () => {
        if (!certifieMajeur) {
            setModalType("error"); setModalTitle("Erreur");
            setModalMessage("Vous devez certifier être majeur pour passer commande.");
            setModalOpen(true); return;
        }
        if (!commande.nom || !commande.prenom || !commande.email || !commande.telephone) {
            setModalType("error"); setModalTitle("Erreur");
            setModalMessage("Merci de remplir tous les champs obligatoires (nom, prénom, email, téléphone)");
            setModalOpen(true); return;
        }
        if (commande.modeLivraison === "livraison") {
            if (!commande.adresse || !commande.codepostal || !commande.ville) {
                setModalType("error"); setModalTitle("Erreur");
                setModalMessage("Merci de remplir tous les champs obligatoires pour la livraison");
                setModalOpen(true); return;
            }
        }
        if (afficherDate && (commande.modeLivraison === "retrait" || commande.modePaiement === "boutique") && !commande.datePassage) {
            setModalType("error"); setModalTitle("Erreur");
            setModalMessage("Merci de sélectionner une date de passage en boutique");
            setModalOpen(true); return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(commande.email)) {
            setModalType("error"); setModalTitle("Erreur");
            setModalMessage("Veuillez entrer une adresse email valide");
            setModalOpen(true); return;
        }
        setDisabled(true);
        try {
            const res  = await fetch("/api/commandes/valider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client: commande, panier, total: totalAvecPort, fraisPort }) });
            const data = await res.json();
            if (data.success) {
                await viderPanierBDD();
                setPanier([]);
                setAfficherCommande(false);
                setCertifieMajeur(false);
                setCommande({ nom: "", prenom: "", email: "", telephone: "", adresse: "", ville: "", codepostal: "", commentaires: "", modeLivraison: "retrait", modePaiement: "virement", datePassage: "" });
                setCommandeValidee(true);
                setModalType("success"); setModalTitle("Commande validée !");
                setModalMessage("Votre commande a été validée avec succès ! Vous allez recevoir un email de confirmation.");
                setModalOpen(true);
            } else {
                setModalType("error"); setModalTitle("Erreur");
                setModalMessage(data.message || "Erreur lors de la validation de la commande.");
                setModalOpen(true);
            }
        } catch (err) {
            console.error("Erreur validation commande :", err);
            setModalType("error"); setModalTitle("Erreur serveur");
            setModalMessage("Une erreur est survenue. Veuillez réessayer.");
            setModalOpen(true);
        } finally { setDisabled(false); }
    };

    const inputClass      = "w-full p-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] bg-white dark:bg-[#1a1d27] text-black dark:text-[#faf5f1] placeholder:text-gray-400 dark:placeholder:text-gray-500";
    const radioLabelClass = "flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1d27] transition-colors";

    return (
        <div className="p-4 sm:p-8 lg:p-12 flex justify-center">
            <div className="w-full max-w-5xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#24586f] dark:text-[#3a8fa8] text-center mb-6 sm:mb-8 font-semibold">
                    Panier
                </h1>

                {panierVide ? (
                    <div className="text-center mt-8">
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Votre panier est vide</p>
                        <button
                            onClick={() => window.location.href = "/la-cave"}
                            className="bg-[#24586f] text-white px-6 py-3 rounded-lg hover:bg-[#1a4557] transition-colors cursor-pointer"
                        >
                            Le remplir
                        </button>
                    </div>
                ) : (
                    <>
                        {totalBouteilles >= 24 && (
                            <div className="mb-6 p-4 bg-[#f1f5ff] dark:bg-[#1a1d27] border-2 border-[#24586f] dark:border-[#3a8fa8] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <p className="text-[#24586f] dark:text-[#3a8fa8] font-medium">
                                    Vous avez atteint le maximum de 24 bouteilles. Pour une commande plus importante, contactez-nous.
                                </p>
                                <Link href="/contact" className="flex-shrink-0 px-4 py-2 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors font-medium text-sm">
                                    Nous contacter
                                </Link>
                            </div>
                        )}

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                    <th className="text-left p-3 dark:text-[#faf5f1]">Produit</th>
                                    <th className="text-center p-3 dark:text-[#faf5f1]">Quantité</th>
                                    <th className="text-right p-3 dark:text-[#faf5f1]">Prix unitaire</th>
                                    <th className="text-right p-3 dark:text-[#faf5f1]">Total</th>
                                    <th className="text-center p-3 dark:text-[#faf5f1]">Supprimer</th>
                                </tr>
                                </thead>
                                <tbody>
                                {panier.map((produit) => (
                                    <tr key={produit.id} className="border-b border-gray-200 dark:border-gray-700 dark:text-[#faf5f1]">
                                        <td className="p-3">
                                            {produit.produit}
                                            {produit.destinataire && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] bg-transparent dark:text-[#faf5f1]"
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
                                                    type="number" min={10} step={10} value={produit.prix}
                                                    onChange={async (e) => {
                                                        const prix = parseFloat(e.target.value) || 0;
                                                        setPanier(prev => prev.map(p => p.id === produit.id ? { ...p, prix, quantite: 1 } : p));
                                                        await fetch("/api/commandes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...produit, prix, quantite: 1 }) });
                                                    }}
                                                    className="w-24 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent dark:text-[#faf5f1]"
                                                />
                                            ) : (
                                                <span>{produit.prix.toFixed(2)} €</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right font-semibold">{(produit.prix * produit.quantite).toFixed(2)} €</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => supprimerProduit(produit.id)} className="bg-[#24586f] text-white border-none px-4 py-2 rounded hover:bg-[#1a4557] transition-colors cursor-pointer">
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
                                <div key={produit.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-[#1a1d27] shadow-sm">
                                    <div className="font-semibold text-lg mb-3 text-[#24586f] dark:text-[#3a8fa8]">
                                        {produit.produit}
                                        {produit.destinataire && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                                                Pour : <span className="font-medium">{produit.destinataire}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600 dark:text-gray-400">Quantité :</span>
                                        {produit.id.includes("carte-cadeau") ? (
                                            <span className="text-base font-semibold dark:text-[#faf5f1]">{produit.quantite}</span>
                                        ) : (
                                            <select
                                                value={produit.quantite}
                                                onChange={(e) => changerQuantite(produit.id, parseInt(e.target.value))}
                                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#24586f] bg-transparent dark:text-[#faf5f1]"
                                            >
                                                {getQuantitesDisponibles(produit).map((qty) => (
                                                    <option key={qty} value={qty}>{qty}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mb-3 dark:text-[#faf5f1]">
                                        <span className="text-gray-600 dark:text-gray-400">Prix unitaire :</span>
                                        {produit.id.includes("carte-cadeau") ? (
                                            <input
                                                type="number" min={10} step={10} value={produit.prix}
                                                onChange={async (e) => {
                                                    const prix = parseFloat(e.target.value) || 0;
                                                    setPanier(prev => prev.map(p => p.id === produit.id ? { ...p, prix, quantite: 1 } : p));
                                                    await fetch("/api/commandes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...produit, prix, quantite: 1 }) });
                                                }}
                                                className="w-24 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-transparent dark:text-[#faf5f1]"
                                            />
                                        ) : (
                                            <span>{produit.prix.toFixed(2)} €</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mb-3 dark:text-[#faf5f1]">
                                        <span className="text-gray-600 dark:text-gray-400 font-semibold">Total :</span>
                                        <span className="font-bold text-lg">{(produit.prix * produit.quantite).toFixed(2)} €</span>
                                    </div>
                                    <button onClick={() => supprimerProduit(produit.id)} className="w-full bg-[#24586f] text-white border-none px-4 py-2 rounded hover:bg-[#1a4557] transition-colors cursor-pointer">
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                        </div>

                        {!panierVide && (
                            <>
                                <div className="mt-8 bg-[#f1f5ff] dark:bg-[#1a1d27] border-2 border-[#24586f] dark:border-[#3a8fa8] rounded-lg p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-gray-700 dark:text-[#faf5f1]">Sous-total produits</span>
                                            <span className="text-xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">{total.toFixed(2)} €</span>
                                        </div>
                                        {commande.modeLivraison === "livraison" && nombreBouteilles > 0 && (
                                            <div className="flex justify-between items-center border-t dark:border-gray-600 pt-3">
                                                <span className="text-lg text-gray-700 dark:text-[#faf5f1]">Frais de port ({nombreBouteilles} bouteille{nombreBouteilles > 1 ? "s" : ""})</span>
                                                <span className="text-xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">{fraisPort.toFixed(2)} €</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-t-2 border-[#24586f] dark:border-[#3a8fa8] pt-3">
                                            <span className="text-2xl font-bold text-[#24586f] dark:text-[#3a8fa8]">Total</span>
                                            <span className="text-3xl font-bold text-[#24586f] dark:text-[#3a8fa8]">{totalAvecPort.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mt-6">
                                    <Link href="/la-cave" className="inline-block mr-4 px-6 py-3 border-2 border-[#24586f] text-[#24586f] dark:text-[#3a8fa8] dark:border-[#3a8fa8] rounded-lg hover:bg-[#24586f] dark:hover:bg-[#3a8fa8] hover:text-white transition-colors font-medium">
                                        Continuer mes achats
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setAfficherCommande(true);
                                            setTimeout(() => { document.getElementById("formulaire-commande")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
                                        }}
                                        className="inline-block px-6 py-3 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors font-medium cursor-pointer"
                                    >
                                        Poursuivre ma commande
                                    </button>
                                </div>
                            </>
                        )}

                        {afficherCommande && !panierVide && (
                            <div id="formulaire-commande" className="mt-8 p-4 sm:p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1d27] shadow-md">
                                <h2 className="mb-6 text-xl sm:text-2xl font-semibold text-[#24586f] dark:text-[#3a8fa8]">Informations de commande</h2>

                                {!seulementCartesCadeaux && (
                                    <div className="mb-6">
                                        <label className="block text-gray-700 dark:text-[#faf5f1] font-semibold mb-3">Mode de récupération *</label>
                                        <div className="space-y-3">
                                            <label className={radioLabelClass}>
                                                <input type="radio" name="modeLivraison" value="retrait" checked={commande.modeLivraison === "retrait"} onChange={handleChange} className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]" />
                                                <span className="ml-3">
                                                    <span className="font-semibold dark:text-[#faf5f1]">Retrait en boutique</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 block">3 rue Voltaire, 92250 La Garenne-Colombes</span>
                                                </span>
                                            </label>
                                            <label className={radioLabelClass}>
                                                <input type="radio" name="modeLivraison" value="livraison" checked={commande.modeLivraison === "livraison"} onChange={handleChange} className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]" />
                                                <span className="ml-3">
                                                    <span className="font-semibold dark:text-[#faf5f1]">Livraison à domicile</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 block">Les frais de port sont ajustés automatiquement</span>
                                                    {nombreBouteilles > 0 && fraisPort > 0 && (
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 block">Frais de port : {fraisPort.toFixed(2)} € pour {nombreBouteilles} bouteille{nombreBouteilles > 1 ? "s" : ""}</span>
                                                    )}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <p className="block text-gray-700 dark:text-[#faf5f1] font-semibold mb-3">Coordonnées de l'acheteur *</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input name="nom" placeholder="Nom *" value={commande.nom} onChange={handleChange} className={inputClass} />
                                        <input name="prenom" placeholder="Prénom *" value={commande.prenom} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <input name="email" type="email" placeholder="Adresse email *" value={commande.email} onChange={handleChange} className={inputClass} />
                                    <input name="telephone" type="tel" placeholder="Numéro de téléphone *" value={commande.telephone} onChange={handleChange} className={inputClass} />
                                    {commande.modeLivraison === "livraison" && (
                                        <>
                                            <input name="adresse" placeholder="Adresse *" value={commande.adresse} onChange={handleChange} className={inputClass} />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <input name="codepostal" placeholder="Code Postal *" value={commande.codepostal} onChange={handleChange} className={inputClass} />
                                                <input name="ville" placeholder="Ville *" value={commande.ville} onChange={handleChange} className={inputClass} />
                                            </div>
                                        </>
                                    )}
                                    <textarea name="commentaires" placeholder="Commentaires (optionnel)" value={commande.commentaires} onChange={handleChange} rows={4} className={inputClass + " resize-vertical"} />
                                </div>

                                <div className="mt-6">
                                    <label className="block text-gray-700 dark:text-[#faf5f1] font-semibold mb-3">Mode de paiement *</label>
                                    <div className="space-y-3">
                                        <label className={radioLabelClass}>
                                            <input type="radio" name="modePaiement" value="virement" checked={commande.modePaiement === "virement"} onChange={handleChange} className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]" />
                                            <span className="ml-3">
                                                <span className="font-semibold dark:text-[#faf5f1]">Virement bancaire</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Vous recevrez les informations bancaires par email. La commande sera traitée après réception du paiement.</span>
                                            </span>
                                        </label>
                                        <label className={radioLabelClass}>
                                            <input type="radio" name="modePaiement" value="boutique" checked={commande.modePaiement === "boutique"} onChange={handleChange} className="w-4 h-4 mt-1 text-[#24586f] focus:ring-[#24586f]" />
                                            <span className="ml-3">
                                                <span className="font-semibold dark:text-[#faf5f1]">Paiement en boutique</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Vous paierez directement en boutique lors de la récupération de votre commande.</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {afficherDate && (
                                    <div className="mt-4">
                                        <label className="block text-gray-700 dark:text-[#faf5f1] font-semibold mb-2">
                                            Date de passage en boutique souhaitée *
                                        </label>
                                        <div className="relative">
                                            <input ref={datePickerRef} type="hidden" />
                                            <button
                                                type="button"
                                                onClick={() => fpInstanceRef.current?.open()}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#24586f] hover:text-[#1a4557] transition-colors z-10"
                                                aria-label="Ouvrir le calendrier"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {seulementCartesCadeaux
                                                ? "Indiquez la date à laquelle vous prévoyez de passer en boutique récupérer votre carte cadeau (à partir d'après-demain, fermé le dimanche)."
                                                : `Indiquez la date à laquelle vous prévoyez de passer en boutique${
                                                    commande.modeLivraison === "retrait" && commande.modePaiement === "boutique"
                                                        ? " pour récupérer et payer votre commande"
                                                        : commande.modeLivraison === "retrait"
                                                            ? " pour récupérer votre commande"
                                                            : " pour payer votre commande"
                                                } (à partir d'après-demain, fermé le dimanche).`
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Certification majorité */}
                                <label className={`mt-6 flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                    certifieMajeur
                                        ? "border-[#24586f] bg-[#f1f5ff] dark:bg-[#1a2a35] dark:border-[#3a8fa8]"
                                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#1a1d27]"
                                }`}>
                                    <input
                                        type="checkbox"
                                        checked={certifieMajeur}
                                        onChange={(e) => setCertifieMajeur(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-[#24586f] focus:ring-[#24586f] rounded flex-shrink-0"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-[#faf5f1]">
                                        Je certifie être âgé(e) de 18 ans ou plus. La vente d'alcool est strictement réservée aux majeurs.
                                        <span className="text-[#24586f] dark:text-[#3a8fa8] font-medium"> *</span>
                                    </span>
                                </label>

                                <button
                                    onClick={() => { if (disabled) return; validerCommande(); }}
                                    disabled={disabled || !certifieMajeur}
                                    className={`mt-4 w-full px-6 py-3 rounded-lg text-base sm:text-lg font-medium transition-colors border-none ${
                                        disabled || !certifieMajeur
                                            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            : "bg-[#24586f] hover:bg-[#1a4457] text-white cursor-pointer"
                                    }`}
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
                onClose={() => { setModalOpen(false); if (commandeValidee) window.location.href = "/"; }}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    );
}