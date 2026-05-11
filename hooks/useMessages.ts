// hooks/useMessages.ts
import { useEffect, useState } from "react";

type Messages = {
    panier: {
        ajout_succes_bouteille: string;
        ajout_succes_bag_in_box: string;
        ajout_succes_libre: string;
        ajout_erreur: string;
        panier_vide: string;
        bouton_remplir: string;
    };
    commande: {
        validation_succes: string;
        validation_email: string;
        champs_obligatoires: string;
        email_invalide: string;
        date_passage_requise: string;
        erreur_serveur: string;
    };
    carte_cadeau: {
        nom_requis: string;
        montant_minimum: string;
        ajout_succes: string;
        ajout_erreur: string;
    };
    email: {
        client_titre: string;
        client_merci: string;
        vendeur_titre: string;
    };
};

const defaultMessages: Messages = {
    panier: {
        ajout_succes_bouteille: "{quantite} bouteille(s) de {produit} ajoutée(s) au panier !",
        ajout_succes_bag_in_box: "{quantite} L de {produit} ajouté(s) au panier !",
        ajout_succes_libre: "{quantite} × {produit} ajouté(s) au panier !",
        ajout_erreur: "Erreur : impossible d'ajouter le produit.",
        panier_vide: "Votre panier est vide",
        bouton_remplir: "Le remplir",
    },
    commande: {
        validation_succes: "Commande validée avec succès !",
        validation_email: "Vous allez recevoir un email",
        champs_obligatoires: "Merci de remplir tous les champs obligatoires",
        email_invalide: "Veuillez entrer une adresse email valide",
        date_passage_requise: "Merci de sélectionner une date de passage en boutique",
        erreur_serveur: "Erreur serveur"
    },
    carte_cadeau: {
        nom_requis: "Veuillez saisir le nom du destinataire",
        montant_minimum: "Le montant minimum est de 10€",
        ajout_succes: "Carte cadeau ajoutée au panier !",
        ajout_erreur: "Erreur lors de l'ajout de la carte cadeau"
    },
    email: {
        client_titre: "Merci pour votre commande !",
        client_merci: "Votre commande a bien été enregistrée",
        vendeur_titre: "Nouvelle commande"
    }
};

export function useMessages() {
    const [messages, setMessages] = useState<Messages>(defaultMessages);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/admin/contenu/messages");
            if (res.ok) {
                const data = await res.json();
                setMessages(data.contenu || defaultMessages);
            }
        } catch (err) {
            console.error("Erreur chargement messages:", err);
            // Garde les messages par défaut en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    return { messages, loading };
}