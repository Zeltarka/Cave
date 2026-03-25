# La Cave - La Garenne

## Présentation
Ce site web a été créé pour La Cave, caviste indépendant situé à la Garenne-Colombes (92250).
Ainsi, les fonctionnalités et designs de ce site ont été vus suite aux demandes du client.

## Fonctionnalités
La première fonction de ce site est une présentation (un site vitrine) de la boutique La Cave La Garenne. Dans un deuxième temps, le site web
permet à l'utilisateur de pouvoir commander du champagne ou du rosé, ainsi que des cartes cadeaux.

Les bouteilles proposées sont deux vins de la marque.

Le paiement s'effectue par virement, ou en boutique.

## Description du site
Le site web présente plusieurs pages :
+ Une présentation de l'histoire de la boutique (pas de fonctionnalité)
+ Les dates des prochaines dégustations
+ Une page contact permettant d'accéder aux différents réseaux sociaux de la boutique.
+ Une galerie photos


+ La page "La Cave" permet d'avoir une description de la boutique, et également d'accéder à la partie marchande du site web.
  Deux onglets y sont accessibles : l'achat des cartes cadeaux et les 2 bouteilles de vin.
+ Enfin, la page panier est directement liée aux ajouts au panier des pages de la partie marchande du site.

## Sécurité
Les commandes sont stockées en base de données. Aucun compte n'est créé.
Lorsque l'on passe une commande, la commande est stockée dans la partie admin, et un mail de confirmation est envoyé à l'admin et au client.
Concernant le paiement, il s'effectue par virement, ou par paiement en boutique.
Les bouteilles sont soit livrées, soit récupérées en boutique.

## Administration
Le site web est totalement administrable depuis une page admin. On peut ainsi :
+ Gérer les commandes (changer le statut de la commande, consulter les commandes, etc.)
+ Créer des cartes cadeaux depuis l'admin.
+ Modifier le contenu de toutes les pages. Le texte et les images sont stockés en base de données, et chargés à chaque fois.
+ Chaque page et API de l'administration sont sécurisées par token.

## Information concernant la deadline
Depuis le push du 17 décembre, j'ai eu de nombreuses demandes de modifications de la part du client, ce qui explique des pushs plus récents.
Le site est maintenant finalisé, toutes les commandes sont reçues par le client.