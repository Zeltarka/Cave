// app/admin/commandes/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateCarteCadeauId } from "@/lib/carte-cadeau-utils";

type ProduitPanier = {
    id: string;
    produit: string;
    quantite: number;
    prix: number;
    destinataire?: string;
    carteCadeauId?: string;
    ligneId?: number;
    carteEnvoyee?: boolean;
};

type Commande = {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    codepostal?: string;
    commentaires?: string;
    modeLivraison: "livraison" | "retrait";
    modePaiement: "virement" | "boutique";
    datePassage?: string;
    total: number;
    fraisPort: number;
    statut: string;
    createdAt: string;
    panier: ProduitPanier[];
    source?: string;
};

// Génération PDF carte cadeau (pour affichage uniquement)
async function generateCarteCadeauPDF(
    destinataire: string,
    montant: number,
    quantite: number,
    idUnique: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica      = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const now = new Date();
    const bleuPrincipal = rgb(0.14, 0.35, 0.44);
    const bleuClair     = rgb(0.95, 0.96, 1);
    const grisClaire    = rgb(0.6, 0.6, 0.6);

    for (let i = 1; i <= quantite; i++) {
        const page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();

        page.drawRectangle({ x: 0, y: 0, width, height, color: bleuClair });
        page.drawRectangle({ x: 50, y: 50, width: width - 100, height: height - 100, borderColor: bleuPrincipal, borderWidth: 3 });

        page.drawText("La Cave La Garenne", { x: width / 2 - 160, y: height - 120, size: 32, font: helveticaBold, color: bleuPrincipal });
        page.drawText("Carte Cadeau", { x: width / 2 - 100, y: height - 200, size: 28, font: timesRomanBold, color: rgb(0.55, 0.66, 0.72) });

        const montantText = `${montant.toFixed(2)} €`;
        page.drawText(montantText, { x: (width - helveticaBold.widthOfTextAtSize(montantText, 60)) / 2, y: height - 300, size: 60, font: helveticaBold, color: bleuPrincipal });

        const benefText = `Offerte à : ${destinataire}`;
        page.drawText(benefText, { x: (width - helvetica.widthOfTextAtSize(benefText, 18)) / 2, y: height - 400, size: 18, font: helvetica, color: rgb(0, 0, 0) });

        const codeText = `Code : ${idUnique}`;
        page.drawText(codeText, { x: (width - helvetica.widthOfTextAtSize(codeText, 10)) / 2, y: height - 470, size: 10, font: helvetica, color: grisClaire });

        const dateText = `Émise le : ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
        page.drawText(dateText, { x: (width - helvetica.widthOfTextAtSize(dateText, 12)) / 2, y: height - 500, size: 12, font: helvetica, color: grisClaire });

        if (quantite > 1) {
            const numText = `Carte ${i} / ${quantite}`;
            page.drawText(numText, { x: (width - helveticaBold.widthOfTextAtSize(numText, 14)) / 2, y: height - 530, size: 14, font: helveticaBold, color: bleuPrincipal });
        }

        const infos = ["La Cave La Garenne", "3 rue Voltaire, 92250 La Garenne-Colombes", "Tél : 01 47 84 57 63", "boutique@lacavelagarenne.fr"];
        let yPos = 200;
        infos.forEach(info => {
            page.drawText(info, { x: (width - helvetica.widthOfTextAtSize(info, 10)) / 2, y: yPos, size: 10, font: helvetica, color: grisClaire });
            yPos -= 20;
        });

        const conditions = "Cette carte cadeau est valable en boutique. Non remboursable, non échangeable contre des espèces.";
        let condY = 90;
        let currentLine = "";
        conditions.split(" ").forEach(word => {
            const test = currentLine + (currentLine ? " " : "") + word;
            if (helvetica.widthOfTextAtSize(test, 8) > width - 200) {
                page.drawText(currentLine, { x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2, y: condY, size: 8, font: helvetica, color: grisClaire });
                condY -= 12;
                currentLine = word;
            } else {
                currentLine = test;
            }
        });
        if (currentLine) {
            page.drawText(currentLine, { x: (width - helvetica.widthOfTextAtSize(currentLine, 8)) / 2, y: condY, size: 8, font: helvetica, color: grisClaire });
        }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

function CommandeDetailContent() {
    const params = useParams();
    const [commande, setCommande] = useState<Commande | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
    const [changingStatus, setChangingStatus] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<number | null>(null);

    // Modal de confirmation
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<"success" | "error">("success");
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        if (params.id) {
            fetchCommande();
        }
    }, [params.id]);

    const fetchCommande = async () => {
        try {
            const res = await fetch(`/api/admin/commandes/${params.id}`);

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Commande non trouvée");
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log("📦 Commande reçue:", data);
            setCommande(data);
            setError("");
        } catch (err) {
            console.error("Erreur chargement commande:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    const changerStatut = async (nouveauStatut: string) => {
        if (!commande || changingStatus) return;

        setChangingStatus(true);
        console.log(`🔄 Changement statut: ${commande.statut} → ${nouveauStatut}`);

        try {
            const res = await fetch(`/api/admin/commandes/${commande.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statut: nouveauStatut }),
            });

            if (res.ok) {
                const updatedCommande = await res.json();
                console.log("✅ Statut mis à jour:", updatedCommande.statut);
                setCommande(updatedCommande);
            } else {
                const errorData = await res.json();
                console.error("❌ Erreur:", errorData);
                setModalMessage(`Erreur lors du changement de statut: ${errorData.error}`);
                setModalType("error");
                setShowModal(true);
            }
        } catch (err) {
            console.error("❌ Erreur changement statut:", err);
            setModalMessage("Erreur de connexion au serveur");
            setModalType("error");
            setShowModal(true);
        } finally {
            setChangingStatus(false);
        }
    };

    const envoyerCarte = async (ligneId: number, email: string) => {
        if (!commande || sendingEmail) return;

        if (!confirm(`Envoyer cette carte cadeau à ${email} ?`)) return;

        setSendingEmail(ligneId);

        try {
            const res = await fetch(`/api/admin/commandes/${commande.id}/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ligneId,
                    emailDestinataire: email,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setModalMessage(data.message || `Carte envoyée à ${email}`);
                setModalType("success");
                setShowModal(true);
                fetchCommande(); // Recharger pour mettre à jour l'état
            } else {
                setModalMessage(data.error || "Erreur lors de l'envoi de la carte");
                setModalType("error");
                setShowModal(true);
            }
        } catch (err) {
            console.error("Erreur envoi carte:", err);
            setModalMessage("Erreur lors de l'envoi de la carte");
            setModalType("error");
            setShowModal(true);
        } finally {
            setSendingEmail(null);
        }
    };

    const afficherCarteCadeau = async (produit: ProduitPanier) => {
        if (!commande) return;

        const carteId = `${produit.id}-${produit.destinataire || 'default'}`;
        setGeneratingPDF(carteId);

        try {
            const destinataire = produit.destinataire || `${commande.prenom} ${commande.nom}`;
            const idUnique = produit.carteCadeauId || generateCarteCadeauId(destinataire, produit.prix);

            console.log(`🔄 Génération PDF pour: ${destinataire}, montant: ${produit.prix}€, quantité: ${produit.quantite}, ID de la carte: ${idUnique}`);

            const pdfBytes = await generateCarteCadeauPDF(destinataire, produit.prix, produit.quantite, idUnique);

            const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            const url = URL.createObjectURL(pdfBlob);

            setPdfUrl(url);
            setPdfModalOpen(true);

            console.log("✅ PDF généré et affiché");
        } catch (err) {
            console.error("❌ Erreur génération PDF:", err);
            setModalMessage("Erreur lors de la génération du PDF");
            setModalType("error");
            setShowModal(true);
        } finally {
            setGeneratingPDF(null);
        }
    };

    const fermerPdfModal = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        setPdfModalOpen(false);
    };

    const getStatutColor = (statut: string) => {
        const statutLower = statut.toLowerCase();
        const colors: Record<string, string> = {
            en_attente: "bg-yellow-100 text-yellow-800 border-yellow-300",
            payee: "bg-green-100 text-green-800 border-green-300",
            preparee: "bg-blue-100 text-blue-800 border-blue-300",
            prete: "bg-purple-100 text-purple-800 border-purple-300",
            livree: "bg-gray-100 text-gray-800 border-gray-300",
            annulee: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[statutLower] || "bg-gray-100 text-gray-800 border-gray-300";
    };

    const getStatutLabel = (statut: string) => {
        const statutLower = statut.toLowerCase();
        const labels: Record<string, string> = {
            en_attente: "En attente",
            payee: "Payée",
            preparee: "En préparation",
            prete: "Prête",
            livree: "Livrée",
            annulee: "Annulée",
        };
        return labels[statutLower] || statut;
    };

    const statuts = [
        "en_attente",
        "payee",
        "preparee",
        "prete",
        "livree",
        "annulee",
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Chargement de la commande...</div>
            </div>
        );
    }

    if (error || !commande) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">{error || "Commande non trouvée"}</div>
                    <Link
                        href="/admin/commandes"
                        className="text-[#24586f] hover:text-[#1a4557]"
                    >
                        ← Retour aux commandes
                    </Link>
                </div>
            </div>
        );
    }

    // Détecter les cartes cadeaux
    const cartesCadeaux = commande.panier.filter(p =>
        p.id.toLowerCase().includes("carte") ||
        p.id.toLowerCase().includes("cadeau") ||
        p.produit.toLowerCase().includes("carte cadeau")
    );

    const totalAvecPort = commande.total + commande.fraisPort;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modal PDF */}
            {pdfModalOpen && pdfUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Aperçu de la carte cadeau</h3>
                            <button
                                onClick={fermerPdfModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full"
                                title="Carte cadeau PDF"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation */}
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                type={modalType}
                message={modalMessage}
            />

            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/admin/commandes"
                                className="text-[#24586f] hover:text-[#1a4557] text-sm mb-2 inline-block"
                            >
                                ← Retour aux commandes
                            </Link>
                            <h1 className="text-2xl font-bold text-[#24586f]">
                                Commande #{commande.id}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Passée le{" "}
                                {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>

                        {/* Changement de statut */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut de la commande
                            </label>
                            <select
                                value={commande.statut}
                                onChange={(e) => changerStatut(e.target.value)}
                                disabled={changingStatus}
                                className={`text-sm font-semibold rounded-lg px-4 py-2 border ${getStatutColor(
                                    commande.statut
                                )} ${changingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {statuts.map((statut) => (
                                    <option key={statut} value={statut}>
                                        {getStatutLabel(statut)}
                                    </option>
                                ))}
                            </select>
                            {changingStatus && (
                                <p className="text-xs text-gray-500 mt-1">Mise à jour...</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenu */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cartes cadeaux */}
                        {cartesCadeaux.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Cartes cadeaux ({cartesCadeaux.length})
                                </h2>
                                <div className="space-y-3">
                                    {cartesCadeaux.map((carte, index) => {
                                        const carteId = `${carte.id}-${carte.destinataire || 'default'}`;
                                        const isGenerating = generatingPDF === carteId;
                                        const isSending = sendingEmail === carte.ligneId;
                                        const destinataire = carte.destinataire || `${commande.prenom} ${commande.nom}`;
                                        const idUnique = carte.carteCadeauId || "ID non disponible";
                                        const carteEnvoyee = carte.carteEnvoyee || false;

                                        return (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border-2 ${carteEnvoyee ? 'bg-green-50 border-green-300' : 'bg-white border-green-200'}`}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 text-lg">
                                                            Carte cadeau de {Math.round(carte.prix)} €
                                                        </p>
                                                        {carte.destinataire && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                <span className="font-medium">Pour :</span> {carte.destinataire}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            <span className="font-medium">Quantité :</span> {carte.quantite} {carte.quantite > 1 ? 'cartes' : 'carte'}
                                                        </p>
                                                        <p className="text-xs text-black mt-2 font-mono bg-gray-50 p-2 rounded border border-gray-200 break-all">
                                                            <span className="font-semibold">ID :</span> {idUnique}
                                                        </p>
                                                        {carteEnvoyee && (
                                                            <div className="mt-2 flex items-center gap-2 text-green-700 text-sm font-medium">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Carte envoyée à {commande.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => afficherCarteCadeau(carte)}
                                                            disabled={isGenerating}
                                                            className="px-4 py-2 bg-[#24586f] text-white rounded-lg hover:bg-[#1a4557] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            {isGenerating ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Génération...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    Afficher PDF
                                                                </>
                                                            )}
                                                        </button>

                                                        {carte.ligneId && (
                                                            <button
                                                                onClick={() => envoyerCarte(carte.ligneId!, commande.email)}
                                                                disabled={isSending}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                                                title={carteEnvoyee ? "Renvoyer la carte par email" : "Envoyer la carte par email"}
                                                            >
                                                                {isSending ? (
                                                                    <>
                                                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Envoi...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                        {carteEnvoyee ? "Renvoyer" : "Envoyer carte"}
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Informations client */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Informations client
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Nom complet</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {commande.prenom} {commande.nom}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-base text-gray-900">{commande.email}</p>
                                </div>
                                {commande.telephone && (
                                    <div>
                                        <p className="text-sm text-gray-500">Téléphone</p>
                                        <p className="text-base text-gray-900">{commande.telephone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {commande.source === "boutique_admin" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-amber-800">
                                    Commande créée en boutique par un administrateur
                                </p>
                            </div>
                        )}

                        {/* Mode de livraison */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Mode de récupération
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {commande.modeLivraison === "livraison"
                                            ? "Livraison à domicile"
                                            : "Retrait en boutique"}
                                    </p>
                                </div>

                                {commande.modeLivraison === "livraison" && commande.adresse && (
                                    <div>
                                        <p className="text-sm text-gray-500">Adresse de livraison</p>
                                        <p className="text-base text-gray-900">
                                            {commande.adresse}
                                            <br />
                                            {commande.codepostal} {commande.ville}
                                        </p>
                                        {commande.fraisPort > 0 && (
                                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    <strong>Frais de port :</strong> {commande.fraisPort.toFixed(2)} €
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode de paiement */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Paiement
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Mode de paiement</p>
                                    <p className="text-base font-medium text-gray-900">
                                        {commande.modePaiement === "boutique"
                                            ? "Paiement en boutique"
                                            : "Virement bancaire"}
                                    </p>
                                </div>

                                {commande.modePaiement === "boutique" && commande.datePassage && (
                                    <div>
                                        <p className="text-sm text-gray-500">Date de passage prévue</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {new Date(commande.datePassage + "T00:00:00").toLocaleDateString(
                                                "fr-FR",
                                                {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                }
                                            )}
                                        </p>
                                    </div>
                                )}

                                {commande.modePaiement === "virement" && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            Attendre la réception du virement avant de préparer la commande.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Commentaires */}
                        {commande.commentaires && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Commentaires du client
                                </h2>
                                <p className="text-base text-gray-700 whitespace-pre-wrap">
                                    {commande.commentaires}
                                </p>
                            </div>
                        )}

                        {/* Produits commandés */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Produits commandés
                            </h2>
                            <div className="space-y-3">
                                {commande.panier.map((produit, index) => {
                                    const isCarteCadeau = produit.id.toLowerCase().includes("carte-cadeau");
                                    const nomAffiche = isCarteCadeau && produit.destinataire
                                        ? `Carte cadeau ${Math.round(produit.prix)}€ - ${produit.destinataire}`
                                        : produit.produit;

                                    return (
                                        <div
                                            key={index}
                                            className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {nomAffiche}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Quantité : {produit.quantite}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    {produit.prix.toFixed(2)} € / unité
                                                </p>
                                                <p className="font-semibold text-gray-900 mt-1">
                                                    {(produit.prix * produit.quantite).toFixed(2)} €
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Récapitulatif */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Récapitulatif
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Sous-total produits</span>
                                    <span className="text-gray-900">
                                        {commande.total.toFixed(2)} €
                                    </span>
                                </div>

                                {commande.fraisPort > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Frais de port</span>
                                        <span className="text-gray-900 font-medium">
                                            {commande.fraisPort.toFixed(2)} €
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold text-gray-900">
                                        Total
                                    </span>
                                    <span className="text-xl font-bold text-[#24586f]">
                                        {totalAvecPort.toFixed(2)} €
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Statut actuel</span>
                                    <span
                                        className={`text-xs font-semibold rounded-full px-3 py-1 border ${getStatutColor(
                                            commande.statut
                                        )}`}
                                    >
                                        {getStatutLabel(commande.statut)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Modifiez le statut en haut de la page
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CommandeDetailPage() {
    return (
        <AdminGuard>
            <CommandeDetailContent />
        </AdminGuard>
    );
}