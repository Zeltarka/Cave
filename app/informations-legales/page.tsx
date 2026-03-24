// app/mentions-legales/page.tsx
"use client";
import { useState } from "react";

const sections = [
    { id: "mentions", label: "Mentions légales" },
    { id: "cgv", label: "CGV" },
    { id: "confidentialite", label: "Confidentialité" },
];

export default function MentionsLegalesPage() {
    const [active, setActive] = useState("mentions");

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Titre */}
                <h1 className="text-3xl sm:text-4xl font-semibold text-[#24586f] dark:text-[#3a8fa8] mb-2">
                    Informations légales
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    LA CAVE DE LA GARENNE — SIRET 830 461 612 00012
                </p>

                {/* Onglets navigation — scrollbar masquée */}
                <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-10 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActive(s.id)}
                            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                                active === s.id
                                    ? "border-[#24586f] text-[#24586f] dark:border-[#3a8fa8] dark:text-[#3a8fa8]"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Contenu */}
                <div className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 leading-relaxed">

                    {/* ── MENTIONS LÉGALES ── */}
                    {active === "mentions" && (
                        <div className="space-y-8">
                            <Section titre="Éditeur du site">
                                <InfoTable rows={[
                                    ["Dénomination", "LA CAVE DE LA GARENNE"],
                                    ["Forme juridique", "Société à Responsabilité Limitée (SARL)"],
                                    ["Capital social", "5000€"],
                                    ["SIRET", "830 461 612 00012"],
                                    ["N° TVA", "FR85 830 461 612"],
                                    ["RCS", "Nanterre 830 461 612"],
                                    ["Code NAF/APE", "47.25Z — Commerce de détail de boissons"],
                                    ["Adresse", "3 rue Voltaire, 92250 La Garenne-Colombes"],
                                    ["Téléphone", "01 47 84 57 63"],
                                    ["Email", "boutique@lacavelagarenne.fr"],
                                    ["Directeur de la publication", "Gilles Pottier"],
                                ]} />
                            </Section>

                            <Section titre="Activité réglementée">
                                <p>La vente de boissons alcoolisées est une activité réglementée soumise à autorisation.</p>
                                <InfoTable rows={[
                                    ["Licence", "Licence de débit de boissons à emporter"],
                                    ["Autorité", "Mairie de La Garenne-Colombes"],
                                ]} />
                            </Section>

                            <Section titre="Hébergeur">
                                <InfoTable rows={[
                                    ["Société", "Vercel Inc."],
                                    ["Adresse", "440 N Barranca Ave #4133, Covina, CA 91723 — États-Unis"],
                                    ["Site", "https://vercel.com"],
                                ]} />
                            </Section>

                            <Section titre="Propriété intellectuelle">
                                <p>L'ensemble du contenu de ce site (textes, photographies, logos, images) est la propriété exclusive de LA CAVE DE LA GARENNE ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation préalable écrite, est strictement interdite.</p>
                            </Section>

                            <Section titre="Avertissement légal — Alcool">
                                <p>La vente d'alcool est strictement réservée aux personnes majeures (18 ans et plus). En passant commande sur ce site, vous certifiez sur l'honneur être âgé(e) d'au moins 18 ans.</p>
                                <p className="mt-3">Conformément à la loi Évin (loi n° 91-32 du 10 janvier 1991), la publicité en faveur des boissons alcoolisées est réglementée.</p>
                                <Encart>L'abus d'alcool est dangereux pour la santé. À consommer avec modération.</Encart>
                            </Section>

                            <Section titre="Médiation de la consommation">
                                <p>Conformément aux articles L. 612-1 et suivants du Code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige. Contactez-nous d'abord à <a href="mailto:boutique@lacavelagarenne.fr" className="text-[#24586f] dark:text-[#3a8fa8] underline">boutique@lacavelagarenne.fr</a>, puis en cas d'échec, vous pouvez saisir un médiateur agréé via <a href="https://www.economie.gouv.fr/mediation-conso" target="_blank" rel="noopener noreferrer" className="text-[#24586f] dark:text-[#3a8fa8] underline">economie.gouv.fr/mediation-conso</a>.</p>
                            </Section>
                        </div>
                    )}

                    {/* ── CGV ── */}
                    {active === "cgv" && (
                        <div className="space-y-8">
                            <p className="text-xs text-gray-400">En vigueur au 20 mars 2026</p>

                            <Section titre="Article 1 — Objet et champ d'application">
                                <p>Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits effectuées par LA CAVE DE LA GARENNE, SARL immatriculée au RCS de Nanterre sous le numéro 830 461 612, dont le siège social est situé 3 rue Voltaire, 92250 La Garenne-Colombes (ci-après « le Vendeur »), auprès de consommateurs particuliers (ci-après « l'Acheteur ») via le site lacavelagarenne.fr.</p>
                                <p className="mt-3">Toute commande passée sur ce site implique l'acceptation pleine et entière des présentes CGV.</p>
                            </Section>

                            <Section titre="Article 2 — Produits">
                                <p>Les produits proposés à la vente sont des boissons alcoolisées et accessoires de caviste. Leur vente est strictement réservée aux personnes majeures (18 ans et plus). En passant commande, l'Acheteur certifie sur l'honneur être âgé(e) d'au moins 18 ans.</p>
                                <p className="mt-3">Les caractéristiques essentielles des produits sont présentées sur le site dans la limite du possible. Les photographies sont fournies à titre illustratif et ne sont pas contractuelles.</p>
                            </Section>

                            <Section titre="Article 3 — Prix">
                                <p>Les prix sont indiqués en euros (€), toutes taxes comprises (TTC). Le Vendeur se réserve le droit de modifier ses prix à tout moment, mais les produits sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.</p>
                                <p className="mt-3">Les frais de livraison, s'ils s'appliquent, sont calculés en fonction du nombre de bouteilles commandées et sont affichés avant la validation définitive de la commande.</p>
                            </Section>

                            <Section titre="Article 4 — Commande">
                                <p>La commande est effectuée en ligne via le site lacavelagarenne.fr. Un email de confirmation est envoyé à l'Acheteur après validation. La vente est réputée conclue à réception de cet email.</p>
                                <p className="mt-3">Le Vendeur se réserve le droit de refuser ou d'annuler toute commande pour un motif légitime, notamment en cas de litige antérieur avec un client.</p>
                            </Section>

                            <Section titre="Article 5 — Paiement">
                                <p><strong>Virement bancaire :</strong> Les coordonnées bancaires (IBAN) sont communiquées par email après validation de la commande. La commande est traitée uniquement après réception effective du virement. L'Acheteur s'engage à indiquer son nom dans le libellé.</p>
                                <p className="mt-3"><strong>Paiement en boutique :</strong> Le paiement est effectué directement en boutique lors du retrait. Moyens acceptés : espèces et carte bancaire.</p>
                                <p className="mt-3">Le Vendeur ne collecte aucune donnée bancaire via le site.</p>
                            </Section>

                            <Section titre="Article 6 — Livraison">
                                <InfoTable rows={[
                                    ["Zone", "France métropolitaine uniquement"],
                                    ["Délai", "Entre 3 et 10 jours ouvrés à compter de la confirmation de commande"],
                                    ["Retrait boutique", "Gratuit — 3 rue Voltaire, 92250 La Garenne-Colombes"],
                                    ["Frais de port", "Calculés selon le nombre de bouteilles, affichés lors de la commande"],
                                ]} />
                                <p className="mt-4">En fonction de la valeur de la commande, le Vendeur contracte une assurance de transport dédiée à chaque envoi.</p>
                            </Section>

                            <Section titre="Article 7 — Droit de rétractation">
                                <p>Conformément à l'article L. 221-28 12° du Code de la consommation, <strong>le droit de rétractation est exclu</strong> pour les boissons alcoolisées scellées, dont la nature exclut le retour pour des raisons d'hygiène et de protection de la santé.</p>
                                <p className="mt-3">Aucun retour ni remboursement ne pourra être accepté après remise ou expédition, sauf en cas de produit défectueux ou d'erreur de notre part.</p>
                            </Section>

                            <Section titre="Article 8 — Garanties légales">
                                <p>En cas de produit défectueux ou d'erreur de livraison, l'Acheteur bénéficie de la garantie légale de conformité (articles L. 217-4 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil).</p>
                                <p className="mt-3">Pour faire valoir ces garanties, contacter le Vendeur à <a href="mailto:boutique@lacavelagarenne.fr" className="text-[#24586f] dark:text-[#3a8fa8] underline">boutique@lacavelagarenne.fr</a> dans les 48 heures suivant la réception, avec photos à l'appui. L'Acheteur devra également effectuer le retour du produit défaillant ou bouché, accompagné impérativement du bouchon d'origine.</p>
                            </Section>

                            <Section titre="Article 9 — Responsabilité">
                                <Encart>L'abus d'alcool est dangereux pour la santé. À consommer avec modération.</Encart>
                            </Section>

                            <Section titre="Article 10 — Litiges">
                                <p>En cas de litige non résolu à l'amiable, l'Acheteur peut recourir gratuitement à la médiation de la consommation (articles L. 612-1 et suivants du Code de la consommation). À défaut, les tribunaux du ressort du RCS de Nanterre seront compétents. Les présentes CGV sont soumises au droit français.</p>
                            </Section>
                        </div>
                    )}

                    {/* ── CONFIDENTIALITÉ ── */}
                    {active === "confidentialite" && (
                        <div className="space-y-8">
                            <p className="text-xs text-gray-400">En vigueur au 20 mars 2026</p>

                            <Section titre="1 — Responsable du traitement">
                                <InfoTable rows={[
                                    ["Société", "LA CAVE DE LA GARENNE — SARL"],
                                    ["Gérant", "Gilles Pottier"],
                                    ["SIRET", "830 461 612 00012"],
                                    ["Adresse", "3 rue Voltaire, 92250 La Garenne-Colombes"],
                                    ["Contact", "boutique@lacavelagarenne.fr — 01 47 84 57 63"],
                                ]} />
                            </Section>

                            <Section titre="2 — Données collectées">
                                <p>Dans le cadre des commandes passées sur ce site, nous collectons :</p>
                                <InfoTable rows={[
                                    ["Nom et prénom", "Obligatoire — nécessaire au traitement de la commande"],
                                    ["Adresse email", "Obligatoire — envoi de la confirmation de commande"],
                                    ["Numéro de téléphone", "Obligatoire — contact en cas de problème sur la commande"],
                                    ["Adresse postale", "Obligatoire uniquement en cas de livraison à domicile"],
                                    ["Date de passage en boutique", "Obligatoire pour retrait ou paiement en boutique"],
                                    ["Commentaires", "Facultatif — à votre convenance"],
                                ]} />
                                <p className="mt-4 font-medium">Aucune donnée bancaire n'est collectée ou stockée par notre site.</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Le refus de fournir les données obligatoires rend impossible la finalisation de votre commande.</p>
                            </Section>

                            <Section titre="3 — Finalités et base légale">
                                <InfoTable rows={[
                                    ["Traitement de commande", "Exécution du contrat — art. 6.1.b RGPD"],
                                    ["Confirmation par email", "Exécution du contrat — art. 6.1.b RGPD"],
                                    ["Cartes cadeaux par email", "Exécution du contrat — art. 6.1.b RGPD"],
                                    ["Archivage comptable", "Obligation légale — art. 6.1.c RGPD"],
                                ]} />
                            </Section>

                            <Section titre="4 — Durée de conservation">
                                <p>Vos données sont conservées pendant <strong>3 ans</strong> à compter de votre dernière commande, conformément aux recommandations de la CNIL et aux obligations du Code de commerce (art. L. 123-22).</p>
                            </Section>

                            <Section titre="5 — Destinataires des données">
                                <p>Vos données ne sont pas vendues ni transmises à des tiers à des fins commerciales. Elles peuvent être partagées avec :</p>
                                <ul className="mt-3 space-y-1 list-disc list-inside">
                                    <li><strong>Vercel Inc.</strong> — hébergeur du site</li>
                                    <li><strong>Supabase</strong> — base de données sécurisée</li>
                                    <li><strong>Notre transporteur</strong> — uniquement nom et adresse de livraison, si applicable</li>
                                </ul>
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Vercel et Supabase disposent de garanties appropriées pour les transferts hors Union Européenne (clauses contractuelles types).</p>
                            </Section>

                            <Section titre="6 — Cookies">
                                <p>Ce site utilise uniquement un <strong>cookie de session technique</strong> permettant de conserver votre panier pendant votre navigation. Ce cookie expire automatiquement à la fin de votre session ou lors de la validation de votre commande.</p>
                                <p className="mt-3">Conformément à l'article 82 de la loi Informatique et Libertés et aux lignes directrices de la CNIL, ce cookie étant strictement nécessaire au fonctionnement du service, il <strong>ne nécessite pas votre consentement préalable</strong>.</p>
                                <Encart>Aucun cookie publicitaire, de tracking ou d'analyse comportementale n'est utilisé sur ce site.</Encart>
                            </Section>

                            <Section titre="7 — Vos droits">
                                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                                <InfoTable rows={[
                                    ["Accès (art. 15)", "Obtenir une copie de vos données"],
                                    ["Rectification (art. 16)", "Corriger des données inexactes"],
                                    ["Effacement (art. 17)", "Demander la suppression de vos données"],
                                    ["Limitation (art. 18)", "Limiter le traitement"],
                                    ["Portabilité (art. 20)", "Recevoir vos données dans un format lisible"],
                                    ["Opposition (art. 21)", "S'opposer au traitement"],
                                ]} />
                                <p className="mt-4">Pour exercer vos droits : <a href="mailto:boutique@lacavelagarenne.fr" className="text-[#24586f] dark:text-[#3a8fa8] underline">boutique@lacavelagarenne.fr</a>. Réponse sous 1 mois maximum.</p>
                                <p className="mt-3">En cas de réclamation : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#24586f] dark:text-[#3a8fa8] underline">CNIL — www.cnil.fr</a></p>
                            </Section>

                            <Section titre="8 — Sécurité">
                                <p>Le site utilise le protocole HTTPS pour chiffrer les échanges. L'accès à la base de données est restreint au seul personnel autorisé. Vos données sont stockées sur des infrastructures sécurisées.</p>
                            </Section>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// ── Composants internes ──────────────────────────────────

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-base font-semibold text-[#24586f] dark:text-[#3a8fa8] mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                {titre}
            </h2>
            <div className="text-sm">{children}</div>
        </div>
    );
}

function InfoTable({ rows }: { rows: [string, string][] }) {
    return (
        <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {rows.map(([label, value]) => (
                <>
                    <dt key={`dt-${label}`} className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{label}</dt>
                    <dd key={`dd-${label}`} className="text-gray-700 dark:text-gray-300">{value}</dd>
                </>
            ))}
        </dl>
    );
}

function Encart({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-4 border-l-4 border-[#24586f] dark:border-[#3a8fa8] pl-4 py-2 text-sm text-gray-600 dark:text-gray-400 italic">
            {children}
        </div>
    );
}