# Marque vectorielle — issue #78

## Source et fichiers

Pack `TerriMaint-logo-A-vectoriel.zip`, concept A affiné validé par Arthur le
6 novembre 2026. Les fichiers retenus sont copiés à l’identique ; la planche de
présentation, les exports PNG et les variantes inutilisées ne sont pas intégrés.

| Fichier dans `frontend/public/` | Usage |
| --- | --- |
| `brand/terrimaint-symbol.svg` | Variante compacte conservée pour le bandeau desktop étroit ; cible minimale 44 × 44 px |
| `brand/terrimaint-logo-horizontal.svg` | En-tête mobile à 32 px ; Responsable tablette/desktop à 38 px ; ailleurs desktop à 38 px dès 640 px de contenu |
| `brand/terrimaint-mark-white.svg` | T seul, 28 × 28 px dans la sidebar Responsable verte |
| `favicon.svg`, `favicon.ico` | Icône navigateur, avec repli ICO 16/32/48 px dans `src/index.html` |
| `brand/README.md`, `brand/Inter-OFL.txt` | Provenance originale et licence Inter du pack |

Vert **#234E3F**, blanc **#FFFFFF**, nom anthracite **#18211E** ; aplats sans effet
ajouté. Le nom Inter SemiBold (axe optique 24) est converti en tracés : aucun
chargement de police ni ressource distante. Les proportions, marges internes et
deux découpes restent celles des SVG fournis. Le logo horizontal conserve son
`viewBox` 581 × 128 : environ 145 × 32 px sur mobile, et 172 × 38 px sur desktop.

## Présence discrète et accessible

`app.html` conserve un seul lien natif `routerLink="/"`, nommé
« TerriMaint — Accueil général ». Ses deux images ont `alt=""` ; CSS n’en affiche
qu’une. Le titre visible de l’accueil général décrit la destination plutôt que de
répéter TerriMaint ; le titre du document et les libellés des pages métier sont conservés.

`app.css` affiche le logo horizontal jusqu’à 760 px de fenêtre, dans les deux
espaces. Le changement d’espace garde son nom accessible avec une icône visible.
Sur desktop Agent/accueil général, une container query choisit la variante selon la largeur
disponible. Depuis #48, Responsable garde toujours le logo horizontal dans le bandeau,
aligné avec le menu de changement d’espace. Les cibles restent sur la même ligne ; le titre de page
figure uniquement dans le contenu. Les dimensions des images sont réservées pour éviter
un décalage à leur chargement. Les contours de focus existants sont conservés.

Dès 761 px de fenêtre, la sidebar Responsable porte également l’identité : T blanc sans
cercle, texte TerriMaint / Espace Responsable et lien `/responsable` conservés.
Sous ce seuil, la marque de sidebar disparaît ; celle de l’en-tête reste visible. Les
icônes métier, cartes, formulaires, scanner et footer ne reçoivent aucun logo.
Aucun comportement métier, stockage, manifeste PWA ou service worker n’est ajouté.

## Captures de référence de la PR

Captures historiques de la PR #79 (avant le logo horizontal mobile et le retrait du titre commun),
avec Chromium système, données fictives et santé HTTP simulée :
[Agent mobile 390 × 844](images/brand/agent-mobile.png),
[Agent ordinateur 1440 × 1024](images/brand/agent-desktop.png),
[Responsable ordinateur 1440 × 1024](images/brand/responsable-desktop.png).
Les quatre formats et les titres longs figurent aussi dans les pièces jointes des tests.

## Revue courte

1. Ouvrir la preview indiquée en tête de PR et comparer `/deployment.json` au SHA annoncé.
2. Accueil général, Agent et Responsable : comparer 320 × 568, 390 × 844,
   768 × 1024 et 1440 × 1024. Vérifier la marque de l’en-tête et, côté Responsable dès
   761 px, celle de la sidebar ; proportions, absence
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
