# Revue Pixel — issue #58 intégrée par #60

## Adaptation Agent #72 — en revue

#71 est fusionnée ; le [guide UX actuel](agent-scan-ux.md) décrit navigation Interventions,
carte Scanner et cadre décoratif. Sa procédure PC/Pixel complète les contrôles historiques
ci-dessous. #57/#63 et #59/#69 sont intégrées ; les anciens passages sur listes fixes et
formulaires sans création décrivent seulement l’état à la fusion de #60.

## Périmètre et ordre

#58 est intégrée par la PR #60 fusionnée le 1er novembre 2026 (`73889125a5683af04d7360423d53e16802e73be7`).
#57 est en revue ; la procédure photos détaillée est dans [le guide](photos-demo.md).

La PR Scanner #56 est intégrée à `main` au commit
`5d1867a17a993f1005c87276665b29004787eab6`, vérifié sur GitHub et par Git distant.
#58 applique les décisions d’Arthur après revue Pixel, avant les photos #57 puis la
mémoire partagée #59. #47/#48 gardent leur périmètre futur. Aucun changement de dépendance,
backend, permission, dashboard calculé, déploiement Firebase ou traitement photo.
Django/DRF/PostgreSQL reste la cible backend.

Figma consulté en lecture seule : Scanner `188:17`, signalements `188:10487`/`188:10497`,
intervention `188:11306`, dans le fichier TerriMaint `0DOu4j0TnWj5wOHKkzTTI8`.
Les décisions d’Arthur priment ; aucun état Synchronisé, notification ou historique inventé.

## Fonctionnement et limites

Le lien Matériel englobe le contenu de la carte et garde un nom accessible limité au titre.
Sur les cartes de signalements/interventions, `::after` étend le lien aux marges ; les autres
cellules restent sélectionnables. Leur texte n’ouvre donc pas une fiche au simple clic.
À 960 px disponibles, le tableau garde ses liens textuels. Aucun clic de ligne JavaScript,
bouton imbriqué ou rôle simulé. Les cartes de contexte Matériel/Signalement d’origine étendent leur unique lien
avec `single-destination` dans les styles communs. Les résumés sans destination et les
actions multiples restent indépendants. Les liens transmettent les paramètres existants ; `q` garde ses espaces exacts.

Le dashboard Responsable garde Matériel, Incidents et Interventions. Changer d’espace reste
dans le shell. Aucun accès Scanner Responsable. Les écrans métier retirent les explications
de développement répétées, en conservant champs facultatifs, priorités Basse/Haute/Urgente,
formats, erreurs, permissions caméra et confidentialité utile. Le risque ne change pas le
statut du matériel ; l’immobilisation officielle relève du Responsable.

Les données sont **locales et fictives**. Déclaration et programmation changent seulement
l’étape du composant ; les libellés de fin n’attestent ni envoi, ni création, ni notification.
Les listes restent fixes jusqu’à #59. Aucun nouvel identifiant, lien vers une création,
stockage distant ou synchronisation. Quitter/recharger perd saisie et photos choisies.
À la fusion de #60, les photos conservaient le comportement #55 : 3 fichiers de 5 Mio.
La PR #57 en revue remplace cette limite par une préparation bornée et deux entrées natives ;
voir [les mesures et la revue Pixel photos](photos-demo.md). Les routes restent publiques sans permissions serveur.
Le contrôle HTTP réel Django reste sur l’accueil général, indépendant des parcours locaux.

Le bloc Scanner, juste au-dessus du champ d’identification, distingue référence invalide et inconnue avec texte et bordure.
Le champ conserve association, focus et saisie ; correction et reprise restent disponibles.
Une seule région `alert` annonce l’erreur QR, sans répétition par le statut caméra.

## Vérifications et limites des preuves

Depuis `frontend/` : `npm run lint`, `npm test`, `npm run build`, puis `npm run test`
et `npm run test:responsive`. Les tests navigateur couvrent 320 × 568, 390 × 844,
768 × 1024 et 1440 × 1024 dans les deux espaces, menu Plus, seuil 1200 px,
accès direct/rechargement, filtres et retours. Les erreurs, photos, ressources caméra et
contrastes restent testés. Le Ctrl/Cmd-clic ouvre un nouvel onglet via le navigateur.
Les résultats et liens CI du **dernier commit** figurent dans la PR, avec les blocages réels.

La santé HTTP des tests navigateur est simulée ; les tests API restent distincts. Un capteur
simulé avec vrai décodage des PNG ne prouve pas la caméra physique. Android/Pixel réel,
lecteur d’écran et ergonomie terrain restent à Arthur. Aucune conformité WCAG globale
ni fidélité pixel par pixel revendiquée.

## Procédure courte sur Pixel

Utiliser la branche de revue par une URL HTTPS avec certificat reconnu pour la caméra ;
aucun déploiement n’est réalisé par #58. Sans cette URL, tester la saisie et reporter la caméra.

1. Dans Agent, chercher `  tONDeUSE  `, toucher l’image et une marge de carte, revenir :
   recherche exacte conservée. Dans Incidents, combiner recherche/priorité/statut, ouvrir
   une marge de carte, revenir puis recharger : mêmes critères. Tester appui long → nouvel onglet.
2. Changer d’espace par le shell. Vérifier les trois raccourcis Responsable et l’absence
   de raccourci Agent/Scanner. Parcourir les interventions filtrées ; les actions Voir le
   signalement / Voir le matériel restent indépendantes.
3. Déclarer avec description vide, choisir Basse/Haute/Urgente, vérifier/modifier/terminer.
   Essayer les photos existantes ; listes inchangées après le parcours, aucun nouveau lien.
4. Scanner : saisir `https://example.org` puis `EQ-OUT-9999` : messages distincts et bloc
   lisible, saisie conservée, correction possible. Corriger avec `EQ-OUT-0001`. Avec caméra,
   lire le QR inconnu puis reprendre avec un connu ; caméra coupée au départ.
5. Vérifier toucher, Tab/Entrée si clavier disponible, menu Plus, retour/rechargement,
   focus et actions dégagés de la navigation fixe ; noter appareil, Android, navigateur,
   URL et limites. Les quatre dimensions CSS se contrôlent aussi depuis l’émulation desktop.

## Validation humaine — Arthur

- [ ] Les critères d’acceptation et les quatre formats sont validés.
- [ ] J’ai vérifié les messages et la caméra sur Pixel, avec navigateur/version notés.
- [ ] J’ai relu les résultats CI du dernier commit, le diff et les captures.
- [ ] Je comprends les choix et décide de la fusion ; aucune fusion automatique.

1. Pourquoi un vrai lien permet-il nouvel onglet et clavier sans gestionnaire de clic de carte ?
2. Où sont conservés `q` et les filtres, et pourquoi les listes ne changent-elles pas après un formulaire ?
3. Pourquoi le bloc d’erreur garde-t-il `aria-describedby` et une seule région d’annonce ?

La procédure photos #57 complète la revue ci-dessus ; Hosting existant reste utilisé sans
changement de configuration. Comparer le SHA du résumé de cette exécution et `/deployment.json`.
