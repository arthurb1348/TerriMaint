# Carte sur la fiche d’un signalement — #93, en revue

## Parcours de revue

Ouvrir **INC-2026-045 — Moteur qui cale à l’accélération** dans Signalements,
en Agent ou Responsable. La position **48.25, −1.5**, précision de démonstration **12 m**,
est un point fictif fixe ajouté à cet exemple existant, sans acquisition sur un téléphone.
Les créations locales conservent leur propre position lorsqu’elle a été jointe au formulaire.
La position jointe ne prouve ni le lieu du matériel ni celui de l’événement.

1. Avant toute action : coordonnées lisibles et information sur le fournisseur sous Localisation.
   La description, le matériel, les interventions et les actions de la fiche restent disponibles.
2. Activer **Afficher la carte** avec Entrée, Espace ou au toucher : vue fixe centrée au
   zoom 16, pointe du marqueur sur la position jointe. Aucune nouvelle demande GPS.
3. Tab quitte le bouton pour l’attribution, puis pour Voir le matériel. La carte est une
   image nommée, sans manipulation ni piège clavier ; Masquer la carte referme la vue.
4. Bloquer `https://tile.openstreetmap.org/*` dans les outils réseau puis ouvrir la carte :
   message d’indisponibilité, coordonnées conservées, bouton Réessayer la carte.
   Une attente sans réponse est bornée à dix secondes. Les autres actions restent possibles.
5. Ouvrir **INC-2026-046** : « Aucune localisation ajoutée. », aucune action cartographique.
   Revenir sur 045 : la carte est à nouveau fermée. Le changement d’identifiant réinitialise
   également une instance réutilisée par Angular et invalide les événements tardifs.

Vérifier sur téléphone et PC le texte, le marqueur, l’attribution, le focus et le défilement.
Les contrôles automatisés à 320/390/768/1440 px émulent les formats, pas un Pixel physique.
Le lien Firebase et le SHA publié sont relevés dans la PR après le job Hosting ; comparer
`/deployment.json` selon le [guide Hosting](firebase-hosting.md).

## Fournisseur et dépendances

Documentation officielle consultée le **8 novembre 2026** :
[politique des tuiles OSM](https://operations.osmfoundation.org/policies/tiles/),
[confidentialité OSMF](https://osmfoundation.org/wiki/Privacy_Policy#Personal_data_we_receive_automatically),
[API stable Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html).

Le fond raster standard d’**OpenStreetMap**, exploité par l’OpenStreetMap Foundation,
convient à cette démonstration ponctuelle sans clé ni compte. Son service est fourni sans
garantie de disponibilité. L’intégration utilise son URL HTTPS officielle, affiche
« © OpenStreetMap contributors » avec lien de licence à côté du fond et garde le cache
HTTP normal du navigateur. Aucun préchargement, téléchargement massif ou cache hors ligne.
La politique exige notamment un Referer de page web : `strict-origin` transmet l’origine
du site, sans chemin de fiche ni recherche. Une autre volumétrie demandera de réévaluer
le fournisseur ; cette PR ne promet pas un service cartographique de production.

**Leaflet 1.9.4** (BSD-2-Clause) fournit projection, centrage et assemblage des tuiles :
cela évite de maintenir un moteur de cartographie maison. Son JavaScript est importé
dynamiquement au clic depuis le build TerriMaint ; sa feuille CSS est incluse dans les
styles locaux, sans CDN. Le marqueur SVG est local, sans appel supplémentaire.
`@types/leaflet 1.9.21` et son type transitif `@types/geojson` sont uniquement de développement.
Les versions et intégrités sont verrouillées. Aucun nouveau script d’installation autorisé.
L’import cible le module ESM officiel distribué par Leaflet, avec une déclaration
TypeScript qui réexporte ses types ; cela conserve les exports dans le build de production.
Le moteur reste dans un chunk différé. Aucun wrapper Angular ajouté.

## Réseau et coordonnées

| Moment | Échanges liés à cette fonctionnalité |
| --- | --- |
| Ouverture de fiche, avant clic | Ressources locales de l’application ; aucun fond, CDN cartographique, géocodage ou demande de position. |
| Clic sur Afficher la carte | Chunk JavaScript local puis images `GET https://tile.openstreetmap.org/16/{x}/{y}.png` limitées à la vue. |
| Fiche sans position | Aucun moteur ni fond cartographique chargé. |

OSM reçoit l’IP et les informations HTTP du navigateur, l’origine du site et les indices des
tuiles. Ces indices révèlent **la zone affichée** : l’absence de latitude/longitude explicites
dans l’URL ne rend pas le chargement anonyme. Cette implication est indiquée **avant le clic**.
Les nombres précis servent au centrage et au marqueur en mémoire dans le navigateur ;
aucun paramètre `lat`/`lon`, URL de navigation/partage, géocodeur ou journal applicatif ajouté.
Les erreurs ne journalisent ni événement fournisseur ni objet de coordonnées.

### Requêtes observées dans Chromium

Les tests `e2e/incident-map.pw.ts` enregistrent les requêtes réellement initiées par le
navigateur, leur méthode, leur type et leur Referer. Ils joignent le relevé JSON et les
captures au rapport Responsive. **Les réponses de tuiles y sont interceptées** : image SVG
locale décodable pour le succès, abandon réseau pour la panne. Ces relevés valident le
contrat réseau de l’application, pas une réponse distante ni la disponibilité d’OSM.

Relevé local du 8 novembre, Chromium **151.0.7922.173**, sur les deux espaces :

- Avant clic : **0 requête externe**, **0 chargement JavaScript Leaflet**.
- Après clic sur 045 : **4 images** à 320 et 390 px ; **8 Agent / 4 Responsable** à 768 px ;
  **8 Agent / 10 Responsable** à 1440 px, selon la largeur réelle de la fiche.
- Exemple : `GET https://tile.openstreetmap.org/16/32494/22712.png`, type `image`,
  Referer `http://127.0.0.1:4173/`, sans query string. Les autres indices observés vont de
  `x=32492` à `32496` et `y=22712` à `22713` selon le format.
- Aucun appel GPS, latitude/longitude précise dans les URL observées ou la console
  applicative ; aucune requête cartographique après passage à la fiche sans position.

Les domaines OSM sont refusés par la politique réseau de cet environnement cloud ; la
documentation officielle a été consultée via l’outil web. Un affichage réel du fond sur
la preview reste à revoir depuis un navigateur qui peut joindre le fournisseur.

## Contrôles reproductibles

Depuis `frontend/`, avec les prérequis du README :

```sh
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:responsive -- incident-map.pw.ts location.pw.ts
```

Les dix nouveaux tests unitaires couvrent l’action explicite, le marqueur, les coordonnées,
la fermeture, la panne, la relance, le délai, une erreur moteur, la destruction et les
changements de fiche avec réponses tardives. Les 24 cas navigateur couvrent succès,
panne et absence de position dans les deux espaces aux quatre formats, avec Entrée/Espace,
ordre de tabulation, focus, absence de débordement et preuves de réutilisation du DOM.
Les parcours de localisation existants vérifient aussi le formulaire et la consultation
d’une position jointe à une nouvelle déclaration. Les résultats précis et la CI du dernier
commit proposé figurent dans la PR ; santé Django et appareil physique restent distincts.

Pour modifier le comportement : `incident-map.ts` porte la source, le zoom, le délai et
le cycle de vie ; `.html` porte le message préalable, le repli et l’attribution ; `.css`
porte les dimensions. `LocationSummary` demeure responsable des coordonnées textuelles.
La [décision](decisions.md) conserve le périmètre : aucune carte d’ensemble ou de matériel.
