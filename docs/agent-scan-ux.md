# Accueil, navigation et guide QR — #72 intégrée, #76 en revue

Base distante vérifiée le 6 novembre 2026 : `7967098b62114412bc69e6142399af5eead3b22f`,
avec [#71 Mes interventions](https://github.com/arthurb1348/terrimaint/pull/71) fusionnée.
Les adaptations ci-dessous sont demandées par Arthur et priment sur les anciens raccourcis.
Les adaptations #72 sont intégrées par #73 ; les compléments #76 restent en revue. Les résultats et preuves du dernier commit sont dans la PR.

## Accès Scanner finalisés (#76, en revue)

#72 est intégrée par #73 ; #76 part de `b6c322d…`, avec #75 également fusionnée.
Sous 761 px, les destinations principales Agent restent **Accueil — Matériel — Interventions — Plus**.
Plus propose Scanner, Incidents et Profil. État actif, Échap, clic extérieur, fermeture au
changement de page et focus sont conservés. De 761 à 1199 px, les six liens sont directs
et répartis dans la barre ; dès 1200 px, les cinq liens sans Scanner restent visibles.

La carte d’accueil est un seul lien natif nommé **Scanner**, avec son icône décorative
blanche et son style. Elle reste un raccourci en complément de Plus. Responsable possède
une entrée Scanner et `/responsable/scanner` ; `/agent/scanner` reste disponible.
Carte et liens Scanner sont présentés sous 1200 px seulement ; les routes directes et
la saisie restent utilisables à toute largeur. Ce seuil ne détecte pas la caméra.

Le même composant Scanner reçoit l’espace par les données de route. Retour, scan reconnu
et référence manuelle conservent l’espace : fiche `/agent/equipements/:id` ou
`/responsable/equipements/:id`. Le titre reste Scanner ; la rubrique active appartient
au bon espace, y compris en accès direct ou après changement de route. Responsable ne
bascule pas implicitement vers Agent. Les espaces restent sans authentification serveur.
Démarrer reste explicite, et le moteur caméra/décodeur est inchangé.

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
3. Accueil : vérifier le libellé Scanner, la carte et les liens Scanner sous 1200 px,
   leur absence à 1200 inclus et au-delà, aller-retour
   1199/1200/1201 sans recharge. Nom de Camille, aperçu et lien complet restent présents.
   Ouvrir la carte au clavier et dans un autre onglet ; aucune demande caméra avant Démarrer.
4. Dans Plus Agent et la navigation Responsable, ouvrir Scanner au clavier/toucher, vérifier
   l’état actif et le retour dans le bon espace. Saisir une référence connue : la fiche doit
   rester dans cet espace. Tester aussi accès direct et changement d’espace.
   Sur Pixel en HTTPS, démarrer explicitement. Vérifier coins, consigne et lisibilité en
   portrait/paysage ; scanner un QR connu au centre puis hors cadre. Tester inconnu, refus
   caméra, saisie manuelle, arrêt/reprise, départ pendant permission puis acceptation tardive.
   La caméra et le cadre doivent disparaître au départ/résultat/erreur.
5. Contrôler les contours de focus, textes longs, marges cliquables, hauteur des cibles,
   dégagement de la barre fixe et absence de débordement. Parcourir les créations partagées
   Responsable/Agent et les photos existantes. Ne pas cocher les validations sans essai réel.

6. Dans chaque espace, ouvrir une déclaration, saisir titre/description et sélectionner une
   photo. Vérifier Prendre une photo / Choisir des photos à 1199 px, puis Ajouter des photos
   seul et aide capture masquée à 1200/1201 px. Revenir sous le seuil pendant une préparation
   et au récapitulatif/Modifier : valeurs et médias conservés. Les associations aide/erreurs,
   le sélecteur multiple, l’annulation et les erreurs restent utilisables au clavier.

Les PNG décodés par jsQR sont réels dans Playwright ; le capteur `canvas.captureStream` et
les permissions sont simulés. Les scènes testent ratios, bandes, orientation, QR hors cadre,
arrêt/départ et permission tardive. Les mesures de contraste utilisent les styles rendus.
Cela ne valide pas caméra physique, lecteur d’écran ou navigateur Pixel ; ces essais restent à Arthur.
La santé HTTP des parcours navigateur est simulée, distincte des tests API.

Suite validée : **interventions sur fiche matériel → gestion des états → fonctionnalités prévues**
(GPS #45, audio #46, dashboard #47, stabilisation #48). Aucun changement métier, de traitement photo,
de logo ou de footer. Dépendances, npm/Node, workflows, protections et Firebase sont conservés.

Questions pédagogiques :

1. Pourquoi garder un libellé visible avec l’icône et un lien natif plutôt qu’un clic sur un bloc ?
2. Pourquoi le ratio vidéo change-t-il la présentation du cadre sans changer les pixels décodés ?
3. Pourquoi garder les champs photo montés lors du changement de présentation, et pourquoi conserver Démarrer ?
