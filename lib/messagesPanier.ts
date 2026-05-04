// lib/messagesPanier.ts

/**
 * Construit le message affiché dans la modale après ajout au panier.
 *
 * Ligne 1 : nom du produit (en gras via la mise en page du modal)
 * Ligne 2 : message de confirmation avec la quantité et le max
 *
 * Le template `ajout_succes` peut contenir {quantite} et {produit}.
 * Si le template ne les contient pas, on construit le message manuellement.
 */
export function construireMessageAjout({
                                           template,
                                           nomProduit,
                                           quantite,
                                           maxBouteilles,
                                           estBouteille,
                                       }: {
    template: string;
    nomProduit: string;
    quantite: number;
    maxBouteilles: number;
    estBouteille: boolean;
}): string {
    const ligneQuantite = template
        .replace("{quantite}", String(quantite))
        .replace("{produit}", nomProduit);

    const ligneMax = estBouteille
        ? `(maximum : ${maxBouteilles} bouteille${maxBouteilles > 1 ? "s" : ""} par commande)`
        : "";

    return [nomProduit, ligneQuantite, ligneMax].filter(Boolean).join("\n");
}