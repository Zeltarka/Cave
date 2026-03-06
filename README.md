# La Cave - La Garenne

## Présentation  
Ce site web a été créé pour La Cave, caviste indépendant situé à la Garenne-Colombes (92250).
Ainsi, les fonctionalités et designs de ce site ont étés vu suites aux demandes du client. 

## Fonctionalités
La première fonction de ce site est une présentation (un site vitrine) de la boutique La Cave La Garenne. Dans un deuxième temps, le site web
permet à l'utilisateur de pouvoir commander du champagne ou du rosé, ainsi que des cartes cadeaux.

Les bouteilles proposés sont deux vins de la marque.

Le payement s'effectue par virement, ou en boutique.

## Description du site
Le site web présente plusieurs page :
+ Une présentation de l'histoire de la boutique (pas de fonctionalité)
+ Les dates des prochaines dégustations 
+ Une page contact permettant d'acceder aux différents réseaux sociaux de la boutique.
+ Une galerie photos


+ La page "La Cave" permet d'avoir une description de la boutique, et également d'accéder à la partie marchande du site web.
Deux onglets y sont accessibles : l'achat des cartes cadeaux et les 2 bouteilles de vin.
+ Enfin la page panier est directement liée aux ajouts de panier des pages de la partie marchante du site.

## Sécurité
Les commandes sont sotckées en base de données. Aucun comptre n'est créé. 
Lorsque l'ont passe une commande, La commande est stockée dans la partie admin, et un mail de confirmation pour l'admin et le client sont envoyés.
Concernant le payement, il s'effectue par virement, ou par paiement en boutique.
Les bouteilles sont soient livrées soit récupérées en boutique.

## Administration
Le site web est totalement administrable depuis une page admin. On peut ainsi : 
+ Gérer les commandes (Changer le statut de la commande, consulter les commandes etc. )
+ Créer des cartes cadeaux depuis l'admin.
+ Modifier le contenu de toutes les pages. Le texte et les images sont stockées en base de données, et chargé à chaque fois.
+ Chaque page et api de l'administration sont sécurisées par token.

## Information concernant la deadline
Depuis le push du 17 décembre, j'ai eu de nombreuses demandes de modifications de la part du client, ce qui explique des pushs plus récents.
