# Accueil, navigation Agent et guide QR — #72 en revue

Base distante vérifiée le 6 novembre 2026 : `7967098b62114412bc69e6142399af5eead3b22f`,
avec [#71 Mes interventions](https://github.com/arthurb1348/terrimaint/pull/71) fusionnée.
Les adaptations ci-dessous sont demandées par Arthur et priment sur les anciens raccourcis.
Elles restent en revue jusqu’à fusion. Les résultats et preuves du dernier commit sont dans la PR.

## Navigation permanente et accueil contextuel

La navigation ouvre les grandes rubriques ; l’accueil sert au scan et aux affectations actives.
Sous 761 px : **Accueil — Matériel — Interventions — Plus**. Plus garde Incidents et Profil,
son état actif, Échap, appui extérieur, fermeture au changement de page et restitution du focus.
Au-delà, les cinq liens sont directement visibles. Scanner n’est plus dans la navbar,
Interventions reste visible à toute largeur et active sur liste/détail, même avec recherche.
La navigation Responsable est conservée.

Sur petit mobile, le lien Interventions dispose d’un peu plus de largeur pour garder son
libellé sur une ligne à 320 px, sans réduire la police ni les cibles tactiles. Les cinq liens
gardent une répartition égale sur tablette/ordinateur. Icônes SVG locales existantes.

Depuis une autre page, scanner demande désormais **Accueil → Scanner**, soit deux appuis.
Ce compromis garde une barre mobile de quatre destinations lisibles. À partir de 1200 px,
la carte disparaît comme l’ancien raccourci ; l’URL `/agent/scanner` reste accessible.
La largeur CSS est un choix de présentation, pas une détection d’appareil ou de caméra.
Sur la page Scanner, aucune rubrique principale n’est marquée active ; le retour à l’accueil
est explicite. Le bouton Démarrer reste nécessaire, même après navigation directe.

L’accueil retire toute la rangée de raccourcis. La carte vert foncé est un **seul lien natif** :
clavier, clic sur ses marges, nouvel onglet et menu du navigateur fonctionnent sans gestionnaire
JavaScript de carte. L’icône `scan.svg` est réutilisée en blanc et masquée aux technologies
d’assistance. Le texte visible « Scanner un matériel » fournit le nom accessible : la grande
icône ne remplace pas le libellé. Hauteur minimale 112 px, espacements limités pour laisser
l’aperçu proche du haut de page ; à 320 px, le texte peut occuper deux lignes.

Camille, les trois affectations actives au maximum, le tri stable, les dates passées, les liens,
l’état vide et « Voir toutes mes interventions » gardent le même `DemoData`. Aucune donnée,
affectation, transition d’état ou persistance n’est ajoutée.

## Un cadre visuel, une image analysée entière

`scanner.ts` observe seulement les dimensions intrinsèques du lecteur : `loadedmetadata`
puis `resize` (par exemple après rotation du capteur). Un signal contient le ratio largeur/hauteur.
Les dimensions nulles avant réception des métadonnées sont ignorées.

La surface `.camera-image` conserve ce ratio, tient dans la largeur disponible et dans les
360 px de hauteur maximale déjà utilisés. Le lecteur la remplit avec `object-fit: contain`.
Le fond sombre extérieur peut former des bandes ; le guide est positionné dans la surface
de l’image, pas dans ces bandes. CSS réévalue la taille après redimensionnement de la fenêtre.
Le carré central tient dans 70 % du petit côté, avec une limite de 240 px. Ses quatre coins
blancs ont une ombre sombre pour rester repérables sur une image claire. La consigne est
placée sous l’image sur fond opaque, sans masquer le QR. Aucune animation permanente.

Le guide et sa consigne visuelle sont décoratifs (`aria-hidden`), sans tabulation et sans
interception de clic (`pointer-events: none`). Le statut caméra accessible existant garde
la consigne équivalente. Le bloc n’est visible que dans l’état `scanning` : attente, arrêt,
erreur, résultat et départ le masquent ou détruisent le composant.

**Le cadre ne délimite pas la zone décodée.** `qr-camera.ts` et `qr-decoder.ts` sont inchangés :
le canvas reçoit toujours l’image entière, avec les limites/fréquence/générations existantes.
Un QR placé hors du cadre reste reconnu. Les flux et permissions tardives gardent leur
nettoyage ; aucune ouverture de page ne demande automatiquement la caméra.

## Revue PC/Pixel par Arthur

1. Ouvrir la preview liée en tête de PR ; comparer son `/deployment.json` au SHA publié.
2. À 320×568, 390×844, 768×1024 et 1440×1024 : lire toute la navigation, vérifier Interventions
   active sur liste et détail filtrés, Plus par toucher/Tab/Entrée, Échap, bouton Fermer,
   clic extérieur et départ vers une page. Sur PC, comparer aussi la navigation Responsable.
3. Accueil : vérifier carte sous 1200 px, absence à 1200 inclus et au-delà, aller-retour
   1199/1200/1201 sans recharge. Nom de Camille, aperçu et lien complet restent présents.
   Ouvrir la carte au clavier et dans un autre onglet ; aucune demande caméra avant Démarrer.
4. Sur Pixel en HTTPS, démarrer explicitement. Vérifier coins, consigne et lisibilité en
   portrait/paysage ; scanner un QR connu au centre puis hors cadre. Tester inconnu, refus
   caméra, saisie manuelle, arrêt/reprise, départ pendant permission puis acceptation tardive.
   La caméra et le cadre doivent disparaître au départ/résultat/erreur.
5. Contrôler les contours de focus, textes longs, marges cliquables, hauteur des cibles,
   dégagement de la barre fixe et absence de débordement. Parcourir les créations partagées
   Responsable/Agent et les photos existantes. Ne pas cocher les validations sans essai réel.

Les PNG décodés par jsQR sont réels dans Playwright ; le capteur `canvas.captureStream` et
les permissions sont simulés. Les scènes testent ratios, bandes, orientation, QR hors cadre,
arrêt/départ et permission tardive. Les mesures de contraste utilisent les styles rendus.
Cela ne valide pas caméra physique, lecteur d’écran ou navigateur Pixel ; ces essais restent à Arthur.
La santé HTTP des parcours navigateur est simulée, distincte des tests API.

Suite validée : **interventions sur fiche matériel → gestion des états → fonctionnalités prévues**
(GPS #45, audio #46, dashboard #47, stabilisation #48). Aucun changement métier, photo PC,
logo ou footer. Dépendances, npm/Node, workflows, protections et Firebase sont conservés.

Questions pédagogiques :

1. Pourquoi garder un libellé visible avec l’icône et un lien natif plutôt qu’un clic sur un bloc ?
2. Pourquoi le ratio vidéo change-t-il la présentation du cadre sans changer les pixels décodés ?
3. Pourquoi le scan demande-t-il deux appuis depuis une autre page, et pourquoi conserve-t-on Démarrer ?
