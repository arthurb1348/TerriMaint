# Marque vectorielle — issue #78

## Source et fichiers

Pack `TerriMaint-logo-A-vectoriel.zip`, concept A affiné validé par Arthur le
6 novembre 2026. Les fichiers retenus sont copiés à l’identique ; la planche de
présentation, les exports PNG et les variantes inutilisées ne sont pas intégrés.

| Fichier dans `frontend/public/` | Usage |
| --- | --- |
| `brand/terrimaint-symbol.svg` | En-tête compact : symbole 28 × 28 px, cible minimale 44 × 44 px |
| `brand/terrimaint-logo-horizontal.svg` | En-tête sur fond clair lorsque le bandeau dispose d’au moins 640 px de contenu |
| `brand/terrimaint-mark-white.svg` | T seul, 28 × 28 px dans la sidebar Responsable verte |
| `favicon.svg`, `favicon.ico` | Icône navigateur, avec repli ICO 16/32/48 px dans `src/index.html` |
| `brand/README.md`, `brand/Inter-OFL.txt` | Provenance originale et licence Inter du pack |

Vert **#234E3F**, blanc **#FFFFFF**, nom anthracite **#18211E** ; aplats sans effet
ajouté. Le nom Inter SemiBold (axe optique 24) est converti en tracés : aucun
chargement de police ni ressource distante. Les proportions, marges internes et
deux découpes restent celles des SVG fournis. Le logo horizontal conserve son
`viewBox` 581 × 128, affiché sur 38 px de haut : son carré mesure environ 28,5 px.

## Présence discrète et accessible

`app.html` conserve un seul lien natif `routerLink="/"`, nommé
« TerriMaint — Accueil général ». Ses deux images ont `alt=""` ; CSS n’en affiche
qu’une. Le titre visible de l’accueil général décrit la destination plutôt que de
répéter TerriMaint ; le titre du document et les libellés des pages métier sont conservés.

`app.css` utilise la largeur disponible **du bandeau**, via une container query,
plutôt qu’un seuil d’appareil. Sous 640 px disponibles, le symbole compact prévaut
et le changement d’espace garde son nom accessible avec une icône visible. Les
cibles restent sur la même ligne ; le titre peut se replier dans l’espace restant
sans masquer les contrôles. Les dimensions des images sont réservées pour éviter
un décalage à leur chargement. Les contours de focus existants sont conservés.

Dès 761 px de fenêtre, la sidebar Responsable porte seule l’identité : T blanc sans
cercle, texte TerriMaint / Espace Responsable et lien `/responsable` conservés.
Sous ce seuil, cette marque disparaît et celle de l’en-tête devient visible. Les
icônes métier, cartes, formulaires, scanner et footer ne reçoivent aucun logo.
Aucun comportement métier, stockage, manifeste PWA ou service worker n’est ajouté.

## Captures de référence de la PR

Captures du build local avec Chromium système, données fictives, santé HTTP simulée :
[Agent mobile 390 × 844](images/brand/agent-mobile.png),
[Agent ordinateur 1440 × 1024](images/brand/agent-desktop.png),
[Responsable ordinateur 1440 × 1024](images/brand/responsable-desktop.png).
Les quatre formats et les titres longs figurent aussi dans les pièces jointes des tests.

## Revue courte

1. Ouvrir la preview indiquée en tête de PR et comparer `/deployment.json` au SHA annoncé.
2. Accueil général, Agent et Responsable : comparer 320 × 568, 390 × 844,
   768 × 1024 et 1440 × 1024. Vérifier une marque visible, proportions, absence
   de débordement, titres longs et passage 760/761 px sans recharge.
3. Utiliser Tab/Entrée : lien d’évitement, marque, changement d’espace et menu
   Responsable. Le lien de marque de l’en-tête retourne à l’accueil général ;
   le lien de sidebar reste dans Responsable. Vérifier aussi Ctrl/Cmd-clic.
4. Examiner les captures `marque` / `titre-long` du rapport Responsive et les
   ressources `/brand/…`, `/favicon.svg`, `/favicon.ico` servies par le build.
   Les résultats réels et limites datés sont consignés dans la PR.

Les tests `e2e/brand.pw.ts` couvrent les quatre formats, le clavier, le nom accessible,
les dimensions, le chargement, les titres longs et les changements de largeur.
La santé HTTP est simulée ; cela ne valide ni un appareil Pixel ni un lecteur d’écran réel.
`app.spec.ts` protège le retour natif et l’absence de texte alternatif redondant.
Pour modifier la présentation, intervenir dans `app.css` et le CSS de
`shared/main-navigation/` ; les dessins source restent intacts.

1. Pourquoi conserver le `viewBox` et le rapport largeur/hauteur d’un SVG ?
2. Pourquoi une image avec `alt=""` reste-t-elle accessible dans un lien déjà nommé ?
