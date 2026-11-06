# Décisions techniques et métier

## 2026-11-06 — Consultation des affectations Agent (#70, en revue)

Base `8415eb7…`, #69 fusionnée. À la demande d’Arthur, Camille Durand est l’identité
locale de présentation, référencée une fois dans `core/presented-agent.ts`. Cela précise
la restriction historique de #47 sur « Mes interventions » : afficher ce nom est désormais
possible avec une identité présentée et un filtrage explicites, sans dashboard ni connexion.
Le backend devra fournir identité et autorisations ; filtrer dans Angular ne les remplace pas.

Liste/détail sont partagés avec Responsable ; le contexte de route fixe la sélection Agent,
ignore `assignee`, garde recherche/statut et adapte les liens. L’aperçu affiche au plus trois
affectations actives, En cours puis Planifiée, date prévue croissante, égalités stables,
sans exclure les dates passées. Le même `DemoData` sert les deux espaces sans persistance.
Voir le [guide et la procédure de revue](agent-interventions.md).

Suite validée : Mes interventions → interventions sur fiche matériel → gestion des états
→ GPS #45 → audio #46 → dashboard #47 → stabilisation #48. Aucune transition ajoutée ici.

## 2026-11-06 — Données partagées dans l’onglet (issue #59, intégrée par #69)

Base distante `0567919…`, photos #63 et Responsive #68 fusionnés. Un service Angular
`DemoData`, fourni à l’application, expose deux collections réactives en lecture seule et
des méthodes explicites de création/consultation. Les jeux typés restent un amorçage
immuable ; listes, fiches, filtres, relations et effectifs lisent les mêmes données.
Pas de NgRx, dépendance, faux serveur, repository générique ou dashboard anticipé.

Les confirmations créent exactement un signalement Ouvert ou une intervention Planifiée,
avec références validées, sans autre transition de statut. Un UUID d’application et des
compteurs produisent les routes temporaires ; une recharge ne réattribue pas une ancienne
route à un autre objet. Navigation et changement d’espace conservent l’état du même onglet ;
recharge/fermeture le perdent. Aucun stockage persistant, écriture métier ou synchronisation.

Les brouillons gardent leur cycle de vie ; après confirmation acceptée, leurs URL de photos
préparées sont transférées au service. Pas de réencodage, copie des originaux ou révocation
par le formulaire détruit. Le service libère les URL confirmées à sa destruction ; le
navigateur libère les URL du document à sa fermeture. Annulation/file et résultats tardifs
restent protégés. Le [guide de #59](shared-memory.md) décrit propriété, tests et revue.
La cible reste Django/DRF/PostgreSQL ; Firebase Hosting ne reçoit que le frontend.

## 2026-11-06 — Fin d’intervention et clôture du signalement (validé, futur incrément de gestion des états)

Décision d’Arthur, documentée sans implémentation dans #59 :

- L’agent termine son intervention : elle passe à Terminée, sans validation intermédiaire.
- Cela ne clôture pas automatiquement le signalement ; une intervention terminée reste consultable.
- Le responsable choisit de clôturer le signalement ou de le garder En cours et de créer
  une nouvelle intervention si le problème persiste.
- La clôture est empêchée tant qu’une intervention liée reste active.

#59 conserve uniquement les statuts initiaux Ouvert / Planifiée des créations. Aucune action
« Mes interventions », transition d’état, GPS, audio, logo, footer ou ajustement photo PC ajouté
dans #59. La consultation est traitée séparément dans #70, décrite plus haut.

## 2026-11-06 — Deux lots Responsive parallèles (issue #67, intégrée par #68)

Préalables #64/#65/#66 fusionnés ; base distante vérifiée `8b9318b…`.
Répartir les 376 scénarios intégrés après #63 avec le sharding natif Playwright en deux
lots complémentaires, deux workers chacun, `fullyParallel: true` et `retries: 0` conservés.
La matrice désactive `fail-fast` ; les deux installations Chromium restent identiques.
Les reporters `list,blob` sont sélectionnés seulement par le workflow ; les commandes
locales et leur rapport HTML restent inchangés. Les actions déjà épinglées sont réutilisées.

Fusionner les deux blobs avec `playwright merge-reports --reporter html`, exiger leur présence
et conserver rapport et diagnostics sept jours. Le contrôle final `Responsive` exige à la
fois le succès de la matrice et celui du rapport : un HTML disponible ne prouve pas que
les tests ont réussi. Annulation, échec ou étape ignorée ne peut devenir un succès global.
Backend/Frontend, ruleset et Hosting restent inchangés. Le gain attendu concerne le temps
écoulé ; préparer trois environnements npm peut augmenter le calcul cumulé. Le
[guide de mesure et de revue](responsive-ci.md) distingue aussi l'incident réseau Ubuntu de #66.

## 2026-11-01 — Photos de terrain bornées (issue #57, intégrée par #63)

Préalable vérifié : #60 fusionnée, dernier `origin/main` à `73889125a5683af04d7360423d53e16802e73be7`.
Branche dédiée `feat/57-prepare-report-photos`, états locaux précédents préservés par nouveau clone.
Deux entrées natives : capture arrière demandée par `capture="environment"` (comportement
selon navigateur), galerie multiple sans capture. Pas de lecteur caméra ni de dépendance.

Choix initiaux : 3 photos facultatives, 24 Mio/24 MP/8 192 px par axe, en-tête ≤ 256 Kio
lu avant décodage, JPEG/PNG/WebP statique vérifié et réellement décodé. Préparer un JPEG
orienté sans agrandir, côté long ≤ 1 920 px, qualités 0,86/0,78/0,70 ; repli ≤ 1 600 px,
six essais maximum, puis refus clair. Sortie ≤ 1,5 Mio **mesurée**, dimensions et contenu
relus/redécodés. Ratio conservé à l’arrondi, transparence sur blanc. Voir [le tableau
complet et les mesures](photos-demo.md) ; ces choix restent à évaluer sur Pixel physique.

File séquentielle conservée après remise à zéro, annulation des lectures et invalidation
des continuations non interrompables ; fermeture des bitmaps, remise à zéro des canvas,
révocation des seules URL préparées et retrait des références aux fichiers inutiles.
Supprimer ne permet pas à une autre préparation de réintroduire l’image. Récapitulatif
et Modifier gardent la même URL ; changement de matériel/départ détruit le parcours.

Les mesures montrent un gain pour le gros PNG bruité, mais une augmentation pour les
petits PNG/WebP déjà compressés. Aucun gain universel ni benchmark Pixel annoncé.
Les tests navigateur utilisent de vraies images et vérifient les pixels EXIF ; les tests
unitaires avec doublures couvrent les erreurs, le poids et les résultats tardifs.
Les listes restent fixes jusqu’à #59. Ni téléversement, stockage, Firebase Storage,
authentification, GPS, audio ni abstraction anticipée. Django/DRF/PostgreSQL reste la cible.

## 2026-11-01 — Ajustements après revue Pixel (issue #58, intégrée par #60)

Depuis `main` vérifié à `5d1867a17a993f1005c87276665b29004787eab6` (#56 fusionnée),
appliquer les décisions d’Arthur avant les photos #57 puis la mémoire partagée #59.
#58 est intégrée par #60 (`7388912…`) ; #57 est en revue, #47/#48 gardent leur périmètre futur.

La carte Matériel contient un seul vrai lien englobant image et texte, nommé par son titre.
Dans les listes de signalements/interventions présentées en cartes, le pseudo-élément du
lien étend la cible aux marges. Le texte des autres cellules reste sélectionnable et ne
provoque pas de navigation. À 960 px disponibles, les tableaux conservent leur lien textuel.
Aucun gestionnaire de clic de ligne, contrôle imbriqué ou nouvelle abstraction n’est ajouté.
Les cartes de contexte Matériel/Signalement d’origine étendent aussi leur unique lien.
Les résumés sans destination, récapitulatifs et actions multiples restent indépendants.

Retirer le raccourci Agent et les explications de développement du dashboard Responsable ;
conserver le sélecteur d’espace du shell et les trois accès métier. Aucun dashboard calculé,
Scanner Responsable ni permission nouvelle. Les avertissements répétés de démonstration
quittent les écrans métier ; libellés, formats, champs facultatifs, erreurs, règles de risque
et confidentialité utile restent présents. Les fins de parcours sont intitulées
**Signalement terminé** / **Programmation terminée**, sans numéro, lien inventé, notification
ni synchronisation. Les jeux restent fixes et les formulaires en mémoire, sans requête métier.
README et [guide de revue](pixel-ux.md) portent explicitement ces limites.

Les erreurs QR sont regroupées juste avant la saisie, dans la zone d’identification, dans un bloc encadré avec titre,
message distinct invalide/inconnu et aide de correction/reprise. Une seule région `alert`
est liée au champ ; le statut caméra ne répète plus l’échec QR. Focus et saisie sont conservés.
Contrastes issus des jetons existants ; aucune nouvelle couleur porte seule l’information.

Figma Scanner `188:17`, liste/détail signalement `188:10487` / `188:10497`, détail intervention
`188:11306` consultés en lecture seule, avec captures et contexte. Les décisions d’Arthur
priment sur synchronisation, notifications, statuts ou actions futurs des prototypes.
Aucune refonte graphique, dépendance, modification backend ou déploiement ; cible
Django/DRF/PostgreSQL conservée. Les entrées historiques ci-dessous décrivent leurs incréments ;
cette décision remplace leurs anciennes mentions de démonstration dans l’interface proposée.

## 2026-10-31 — Identification QR Agent (issue #44, fusionnée)
## 2026-11-01 — Hosting statique et previews de PR (issue #61, intégrée par #62)

Conserver le projet Firebase TerriMaint existant et Spark, sans App Hosting ni backend.
La configuration racine ne publie que le build Angular. CI réutilise ses contrôles
Backend/Frontend et son artifact, puis un runner séparé reçoit les identifiants pour
un canal `pr-N` ou `live`. Le head exact de PR est construit et annoncé ; Responsive
conserve son contrôle séparé du checkout de fusion. Pas de `pull_request_target`,
pas de preview privilégiée de fork, pas de commentaire nécessitant des droits d'écriture.
Sérialiser les envois sans annulation et relire la source courante évite les retours
à un ancien commit. Expiration à sept jours, revalidation du cache et manifeste public
pour la revue sur Pixel. La CLI directe désactive la synchronisation des domaines Firebase Auth. Le manifeste
et le résumé portent un libellé avec le vrai SHA ; live le porte aussi dans le message
de release. Cela couvre aussi une PR déjà ouverte sélectionnée depuis main.

La configuration a été intégrée par #62 (`797ebc2…`) ; Arthur a depuis activé Hosting.
L’ID reste fourni par variable, aucune configuration Firebase nouvelle dans #57.
Chaque PR doit néanmoins consulter son succès réel, son URL et son SHA publié.
Le [guide](firebase-hosting.md) détaille les choix, permissions, activation et preuves.

## 2026-10-31 — Identification QR Agent (issue #44, en revue)

Le QR contient une référence seule, normalisée par `trim().toUpperCase()` puis
comparée entièrement aux identifiants de la source typée Matériel existante. Format
ASCII `EQ-AAA-0000` ; aucun matériel inventé, HTML interprété ou lien externe ouvert.
Seul un objet reconnu construit la route interne Agent. La saisie reste visible,
utilisable au clavier sans caméra. Les accès Scanner et leur seuil 1200 px sont conservés.

Après observation de Chromium 151 sans `BarcodeDetector` et lecture des sources
W3C/MDN/jsQR, retenir `jsqr@1.4.0`, sans dépendance d’exécution ni script d’installation.
Lockfile npm et politique stricte conservés. Une session caméra démarre sur clic,
ferme toutes les pistes à l’arrêt/résultat/départ et invalide chaque continuation
asynchrone par génération. Un flux accordé tardivement est immédiatement fermé.
Le décodage est séquentiel, borné en pixels, sans stockage d’images ni historique.

Le prototype Agent `188:3` et Scanner `188:17` sont consultés en lecture seule.
L’issue prime : activation explicite, formulaire toujours visible, fiche directe,
sans écran de succès ni indicateur Synchronisé. Le [guide](scanner-qr.md) détaille
sources, scripts examinés, format, QR Segno réutilisables, contexte HTTPS, tests
simulés et contrôle physique restant à Arthur. #43/PR #55 est intégrée ; #44 est
intégrée par la [PR #56](https://github.com/arthurb1348/terrimaint/pull/56), fusionnée le
1er novembre 2026 au commit `5d1867a17a993f1005c87276665b29004787eab6`. Aucune API métier, permission serveur ou PWA ajoutée.

## 2026-10-31 — Images et photos locales (issue #43, fusionnée)

Séparer illustrations Matériel, photos fixes de signalements et fichiers choisis en mémoire.
Conserver un champ natif sans caméra obligatoire, 3 photos de 5 Mio, JPEG/PNG/WebP
et décodage local. Génération de parcours et révocation des URL protègent les retours
asynchrones. Le [guide photos](photos-demo.md) documente provenance, adaptations Figma,
cycle de vie et limites ; #43 est intégrée par la [PR #55](https://github.com/arthurb1348/terrimaint/pull/55),
fusionnée le 31 octobre 2026 au commit `1e87c74d51ad6c642a79f9383f12d2dda12464d2`,
vérifié dans le dernier `origin/main` avant #44.

## 2026-10-31 — Contrastes interactifs (issue #53, fusionnée)

Depuis main `4722b2403b5592e96a0d8d645dea94bd721fb9ee` intégrant #52, séparer
`--focus: #A5682D` de l’accent décoratif et `--control-border: #6B7C72` des bordures
décoratives. Conserver le focus blanc sur le vert de la sidebar et les cartes discrètes.
Le [rapport de contraste](contrast-accessibility.md) documente les usages, rapports sRGB,
seuils non arrondis, contrôle des styles rendus, procédure et limites WCAG.
#53 est intégrée par la PR #54, fusionnée le 31 octobre 2026 (`554468d…`). Les images/photos #43 sont intégrées par la PR #55.

## 2026-10-31 — Harmonisation issue de la revue utilisateur (issue #51, fusionnée)

Arthur valide **Faible → Basse** pour la priorité visible, avec **Haute / Urgente** conservées.
Cette évolution concerne déclaration, aide/erreur, récapitulatif, filtres, badges et contexte
de programmation, dans les deux espaces. Les valeurs techniques `low/high/urgent`, les sources,
propriétés, routes et paramètres d'URL ne changent pas. Les décisions antérieures gardent leur
vocabulaire historique ; cette entrée datée décrit le choix actuel.

La consultation #42/PR #50 est fusionnée dans le dernier `origin/main` revérifié au démarrage,
`876b8b0a5a9dadff6bff5e0beaea7e1bd1d8cb05`. L'harmonisation #51 est intégrée par la PR #52, fusionnée le 31 octobre 2026
(commit `4722b2403b5592e96a0d8d645dea94bd721fb9ee`). Elle devient l'incrément **4/10**, après ajout de ce retour utilisateur au programme
initial de neuf PR. Les images/photos appartiennent à #43 ; PostgreSQL #38 reste différé.

Les actions de page partagent des styles CSS réellement communs : `.page-action` est pleine
dans le vert de la charte ; `.secondary` apporte un contour vert et un fond blanc, légèrement
teinté au survol. Déclarer, Programmer, Vérifier et Envoyer sont principaux ; Modifier, Annuler,
Voir le matériel, effacer/réinitialiser et les retours de contexte sont secondaires. Dans le
détail d'intervention, Voir le signalement est principal et Voir le matériel secondaire ; après
une simulation, le retour final devient l'action principale. Les raccourcis d'accueil gardent
leurs liens ; Scanner reste masqué à partir de 1200 px, sans changement du shell.

Une navigation reste un `<a routerLink>` avec `href`, utilisable au clavier et dans un autre
onglet ; une opération de formulaire reste un `<button>` typé. Ces actions ne sont soulignées
ni au repos ni au survol/focus/activation/visite. Le contour de focus de 3 px est conservé ; l'issue #53 ci-dessus sépare ensuite
sa couleur de l'accent décoratif. Les noms/références de listes restent des liens textuels
soulignés ; aucune suppression globale de leur repère. Les cibles d'action mesurent au moins
48 px de haut, se replient et réservent le dégagement de la navigation Agent fixe.

Les retours explicites existants reçoivent une flèche **accompagnée du libellé de destination**,
sur mobile et ordinateur. La flèche est un texte décoratif dans un `span aria-hidden="true"` :
elle ne double pas l'annonce du lien. Les destinations, espaces, filtres et accès directs sont
conservés ; aucun `history.back()` ni retour ajouté aux accueils/listes racines. Ce traitement
vient de la revue utilisateur du 31 octobre, **pas d'une nouvelle maquette Figma validée**.

Les cartes matériel, signalements, interventions et résumés/récapitulatifs partagent
`.business-card` : teinte très légère `--card-surface: #f4f8f5`, bordure discrète existante et
rayon de 12 px. Les bandes de contexte et repères de priorité/statut restent distincts et
textuels. Les composants gardent leur disposition ; les tableaux retrouvent leurs lignes
blanches/alternées à 960 px disponibles, sans modifier les seuils responsive intégrés.

Les prototypes [Agent `188:3`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-3)
et [Responsable `188:6`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-6)
ont été consultés en lecture seule : charte et hiérarchie de boutons guident la présentation,
avec priorité aux adaptations validées ici. Aucune image, dépendance, API, persistance,
authentification, permission ou règle métier ajoutée. La validation et la fusion restent à Arthur.

### Synchroniser le test Matériel sur le lien réellement rendu

L'[échec historique Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41187204526)
sur `eb86283…` porte sur les deux parcours de fiche Matériel à 320 px : l'URL était attendue
avec `q` exact, puis le test lisait immédiatement `href`, où il manquait un ou deux espaces
finaux. La suite main après #50 est verte ; ce succès ne démontre pas une correction de cet
échec intermittent. Les journaux ont été relus avant modification UX.

Avant modification, dix répétitions par espace à 320 px réussissent, soit 20/20 : l'échec exact
n'est pas reproduit. Une observation temporaire hors dépôt, sans ajouter de délai au rendu,
relève en revanche dix fois par espace le moment où `history.replaceState` vient d'actualiser
`q` : URL et champ contiennent la saisie entière, mais `href` porte encore la valeur précédente.
Dans les vingt observations, le lien converge ensuite vers la valeur exacte, sans perte de
saisie constatée. Cela établit cette fenêtre d'actualisation et justifie l'attente du lien ;
cela ne prouve pas rétrospectivement la cause unique de l'exécution historique.

Le test emploie désormais `expect.poll` sur **chemin + `q` décodé du lien**, avec les deux
espaces avant/après conservés. Aucun délai fixe, `trim`, scénario ignoré, retry ou timeout
augmenté. Aucun correctif de saisie applicatif n'est ajouté, faute de perte réelle établie.
Le résultat ciblé, la suite et la CI du dernier commit sont rapportés dans la PR ; cette
synchronisation du test ne vaut pas annonce d'une résolution définitive sur une seule CI verte.

## 2026-10-31 — Consulter et filtrer les interventions (issue #42, fusionnée)

La programmation #41 est intégrée par la PR #49 dans `origin/main`, revérifié au démarrage
à `eb86283f9898b88450401680fdbb5356c0c60733`. La consultation #42 est l'incrément 3/9 du
programme frontend initial pour décembre 2026. Elle est intégrée par la
[PR #50](https://github.com/arthurb1348/terrimaint/pull/50), fusionnée le 31 octobre 2026
(commit `876b8b0a5a9dadff6bff5e0beaea7e1bd1d8cb05`, revérifié dans le dernier `origin/main`
avant #51). Le programme compte désormais dix incréments après ajout de l'harmonisation UX.
PostgreSQL #38 demeure différé. Aucune simulation de programmation ou de déclaration n'alimente le jeu fixe.

`interventions-demo.ts` contient six interventions typées, avec références `INT-…` uniques,
titre, consignes facultatives, `incidentId`, `agentId`, date calendaire et statut fictif
Planifiée/En cours/Terminée. Le signalement fournit son `equipmentId` ; noms, emplacements
et agents sont lus dans les sources existantes, dont `agents-demo.ts`, sans copie de ces
informations. Les effectifs sont calculés depuis le jeu, indépendamment des filtres.
Ces statuts n'agissent sur aucun signalement/matériel et ne définissent pas un workflow serveur.

L'URL conserve la saisie exacte `q`, le `status` connu et l'`assignee` présent dans les agents
fictifs. La recherche compare titre/référence/nom/id matériel avec `trim().toLowerCase()`.
Les trois critères sont combinables ; une valeur inconnue signifie Tous. `replaceUrl`
évite un historique par lettre ; réinitialiser efface les critères puis focalise la recherche.
La liste et le détail partagent l'interprétation des paramètres. Le retour explicite vise
`/responsable/interventions`, même après accès direct. Les liens vers le signalement et
le matériel restent Responsable et ne transmettent aucun filtre d'intervention.

Le détail observe `id` : un changement actualise toutes les relations, un inconnu efface
l'ancienne fiche et affiche **Intervention introuvable**, avec retour. Des consignes absentes
affichent **Non renseignées**. `DatePipe` rend la chaîne calendaire ISO sans imposer UTC ni
créer un instant avec `new Date('YYYY-MM-DD')`. Les parcours vérifient les mêmes dates dans
Europe/Paris et America/New_York. La route spécifique `nouvelle/:incidentId` garde sa priorité
et son fonctionnement ; aucune entrée ni route de gestion Agent n'est ajoutée.

Les références Figma [Agent `188:3`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-3),
[Responsable `188:6`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-6)
et [détail `188:11306`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-11306)
ont été consultées en lecture seule. Le shell, ses icônes locales et ses variables de charte
sont réutilisés. Le résumé et les origines remplacent la chronologie du prototype : aucun
historique, créneau horaire, durée, disponibilité, rappel relatif ou action de statut inventé.
Les liens utilisateur deviennent **Voir le signalement** et **Voir le matériel**.

Adaptations responsive : le même tableau passe en cartes sous **960 px disponibles dans le
composant**, avec les cinq informations et les mêmes liens. Le détail empile résumé et origines
sous **880 px disponibles**, puis les place sur deux colonnes. Ces requêtes de conteneur tiennent
compte de la sidebar à 768 px. Les en-têtes restent accessibles, les contrôles mesurent au moins
48 px, les textes longs se replient et le focus est visible. Les quatre formats sont vérifiés
sans refonte du shell. Aucune fidélité pixel par pixel n'est revendiquée.

Les routes restent publiques. API métier, stockage, permissions, modification, suppression,
notification, PWA et hors connexion ne sont pas ajoutés. Dépendances, lockfiles, politique npm
et protections CI sont conservés. La validation humaine et la fusion restent à Arthur.

## 2026-10-30 — Programmation d'une intervention de démonstration (issue #41, fusionnée)

La [PR #40](https://github.com/arthurb1348/terrimaint/pull/40) est fusionnée dans le dernier
`origin/main` vérifié, au commit `4eefc19a510a44e140d41425504fb02895ed2268`.
L'[issue #41](https://github.com/arthurb1348/terrimaint/issues/41) poursuit la priorité frontend
pour décembre 2026. Elle est intégrée par la [PR #49](https://github.com/arthurb1348/terrimaint/pull/49),
fusionnée le 31 octobre 2026 au commit `eb86283f9898b88450401680fdbb5356c0c60733`,
vérifié dans le dernier `origin/main` avant l'issue #42. PostgreSQL #38 reste différé.
La consultation de l'issue #42 reste distincte de cette programmation simulée.

Les références Figma ont été consultées en lecture seule :
[détail du signalement `188:10497`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-10497),
[création `188:11246`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-11246),
[affectation `188:11263`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-11263),
[planification `188:11278`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-11278)
et [confirmation `188:11296`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-11296).
L'adaptation validée dans l'issue regroupe titre, consignes, agent et date dans **un formulaire**,
puis présente un récapitulatif modifiable et une confirmation. Les surfaces vertes, bordures,
contrôles arrondis et boutons reprennent la charte du shell intégré. Celui-ci reste conservé.
Les contrôles sont natifs ; aucun calendrier personnalisé, type d'intervention, immobilisation,
prestataire, disponibilité, heure, durée, brouillon, média ou notification du prototype n'est ajouté.

Seul le détail **Responsable** d'un signalement Ouvert ou En cours propose le lien
**Programmer une intervention**. Un signalement clôturé reste consultable avec une explication,
sans action factice. La route `/responsable/interventions/nouvelle/:incidentId` vérifie aussi
ces conditions, ainsi que l'existence du signalement et du matériel lié. Elle ne présente pas
de formulaire utilisable en cas d'échec. Aucune route de programmation Agent n'est créée.
Il s'agit de présentation frontend : les routes sont publiques, sans permission métier.
Authentification, autorisations serveur et isolation entre collectivités restent à construire.

Le signalement et son matériel sont lus dans les sources existantes, sans copie des objets.
Le contexte non modifiable présente leur référence, intitulé/nom, priorité et emplacement.
Une petite source typée séparée fournit trois agents fictifs aux identifiants stables ; aucun
agent n'est présélectionné et aucune disponibilité ou identité connectée n'est annoncée.

Le titre est prérempli, obligatoire, modifiable et limité à **120 unités UTF-16** ; les blancs
seuls sont refusés. Les **consignes sont facultatives**, vides au départ : les blancs seuls
représentent une absence ; sinon la longueur brute est limitée à **2000 unités UTF-16**.
Comme dans la déclaration existante, certains symboles occupent deux unités. L'aide l'explique.
Le récapitulatif affiche **Non renseignées** sans écrire ce texte dans le formulaire ;
**Modifier l'intervention** retrouve espaces et retours à la ligne exactement.

La date prévue est une **date calendaire**, obligatoire, valide et au moins égale au jour
local du navigateur. Le validateur TypeScript contrôle aussi mois, jours et années bissextiles,
indépendamment de l'attribut HTML `min`. Le jour courant est construit avec les composantes
locales, sans troncature d'un instant UTC. Le récapitulatif utilise `DatePipe` sans imposer
UTC. La date est revérifiée à l'action finale si minuit est passé pendant la lecture.
Les tests figent l'horloge ; les parcours Paris et New York vérifient des jours locaux
différents au même instant, ainsi que l'absence de décalage à l'affichage.

**Vérifier l'intervention**, **Modifier l'intervention**, puis **Programmer l'intervention**
déplacent seulement l'étape en mémoire. La mention de démonstration reste visible et celle
près du dernier bouton lui est associée par `aria-describedby`. **Programmation simulée**
précise qu'aucune intervention n'est enregistrée/transmise et qu'aucun agent n'est notifié.
Aucun numéro d'intervention, statut modifié, ajout à une liste, appel métier ou stockage.
Les règles de ce formulaire sont des choix de démonstration à reprendre dans le futur
contrat serveur ; elles ne décrivent pas un workflow métier déployé.

L'état disparaît au départ, au rechargement ou au changement d'`incidentId`, y compris depuis
le récapitulatif ou la confirmation. Modifier seulement `q`, `priority`, `status` conserve
la saisie. Ces trois critères normalisés sont les seuls paramètres transmis aux retours
explicites vers le signalement puis la liste ; la saisie exacte de `q` est conservée.
Interventions reste actif pendant les trois étapes, y compris dans le menu mobile Responsable.

Le formulaire reste en une colonne lorsque la place manque. À partir de **560 px de largeur
du composant**, agent et date partagent une ligne ; la requête de conteneur tient compte de
la sidebar, donc conserve une colonne à 768 px de fenêtre. À 1440 px les deux champs sont
côte à côte. Les actions se replient, les textes longs reviennent à la ligne et les contrôles
mesurent au moins 48 px de haut. Le focus rejoint le premier champ invalide, le titre du
récapitulatif/de la confirmation ou le titre saisi lors de Modifier. Le clavier et les quatre
formats sont contrôlés sans refonte du shell ni contournement lié au diagnostic #33.
Dépendances et politique npm sont conservées. La validation humaine et la fusion restent à Arthur.

## 2026-10-30 — Consultation des signalements et priorité frontend (issue #39, fusionnée)

Arthur valide la priorité aux parcours frontend pour son **oral de décembre 2026** : liste
et détail des signalements côté Responsable, réutilisés côté Agent. PostgreSQL
([issue #38](https://github.com/arthurb1348/terrimaint/issues/38)) est différé sans modifier
la cible de persistance. L'[issue #39](https://github.com/arthurb1348/terrimaint/issues/39)
est intégrée par la [PR #40 fusionnée](https://github.com/arthurb1348/terrimaint/pull/40)
le 30 octobre 2026 (commit `4eefc19a510a44e140d41425504fb02895ed2268`). Elle reste une
consultation locale et publique.

Les prototypes [liste `188:10487`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-10487)
et [détail `188:10497`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-10497)
ont été consultés. La table mélange des références et états de matériel avec des incidents.
L'adaptation distingue donc **référence de signalement `INC-…`** et **matériel `EQ-…`**.
Les seuls statuts de signalement sont **Ouvert, En cours et Clôturé** ; Disponible,
Immobilisé et Maintenance ne sont pas repris comme statuts d'incident. Les priorités restent
Faible, Haute et Urgente. Ces états fictifs ne définissent pas encore un workflow serveur.

Une unique source typée contient six exemples fixes, dont une description absente et des
contenus longs. `equipmentId` référence la source Matériel existante ; noms et emplacements
ne sont pas recopiés. La date affichée est la date fixe du signalement, sans activité relative
inventée. Le compteur vient des résultats filtrés, jamais du nombre montré dans le prototype.
La déclaration simulée ne modifie pas ce jeu d'exemples et garde son comportement intégré.

La recherche porte sur intitulé, référence, nom et identifiant de matériel, sans casse ni
espaces de bord. Elle se combine avec priorité et statut. Des sélections natives remplacent
les onglets du prototype pour proposer aussi Toutes/Tous dans un espace réduit. L'URL porte
`q`, `priority` et `status` ; seules les valeurs connues des filtres sont appliquées. Une
valeur inconnue affiche Toutes/Tous ; une nouvelle interaction ou le lien de retour la retire
de l'URL produite. La saisie exacte de `q` est conservée et `replaceUrl` évite un historique
par lettre. Le lien Voir le matériel ne transmet aucun de ces paramètres : une recherche
de signalements ne devient pas une recherche de matériel.

Le shell reste inchangé. Le tableau reprend la surface verte et les lignes du prototype ;
sous **960 px de largeur disponible du composant**, les mêmes lignes se présentent en cartes,
sans second jeu de contenu. Cette requête de conteneur tient compte de la barre Responsable
sur tablette ; le contenu Agent, plus étroit, garde les cartes même sur ordinateur. Les rôles
explicites et en-têtes du tableau conservent sa structure accessible lors du changement CSS.
Les liens, champs et réinitialisation gardent un focus visible, dégagé de la barre basse.

Identités connectées, notifications, synchronisation, récurrence, entretien, médias et actions
de gestion du prototype restent hors périmètre. Aucun changement de statut, intervention,
API, stockage, dépendance ou refonte de déclaration ajouté. Un risque signalé ne change jamais
le statut du matériel. Les routes ne confèrent pas de permission ; #33 reste distincte.
La validation humaine et la fusion restent à Arthur.

## 2026-10-30 — Saisie et actions de signalement (issue #36, fusionnée)

Après validation manuelle du parcours de la PR #35, Arthur demande dans
l'[issue #36](https://github.com/arthurb1348/terrimaint/issues/36) une **description facultative**
et des boutons formulés autour de l'action utilisateur. L'intitulé et la priorité restent
obligatoires. Les bornes restent 120 caractères pour l'intitulé et 2000 pour une description
renseignée, en unités UTF-16 comme auparavant. Une valeur vide ou composée uniquement
d'espaces représente une absence, sans erreur de validation. Les détails non blancs sont
contrôlés sur leur longueur brute, sans supprimer les espaces ni les retours à la ligne saisis.
Cette règle devra être conservée dans le futur contrat serveur.

Le champ porte le libellé **Description (facultative)**. Le récapitulatif affiche
**Non renseignée** en cas d'absence, uniquement pour la présentation : le formulaire garde
sa valeur exacte, retrouvée avec **Modifier le signalement**. **Vérifier le signalement**
ouvre le récapitulatif ; **Envoyer le signalement** termine encore une simulation locale.
Une mention de démonstration se trouve près de cette action et lui est associée
par `aria-describedby`. La confirmation **Signalement simulé** précise qu'aucun signalement
n'est réellement transmis ou enregistré. Le vocabulaire utilisateur ne crée aucun envoi métier.

Le matériel choisi, les deux espaces, `q`, le clavier, la mémoire seule et la règle de risque
sans changement de statut sont conservés. Aucun renommage général des composants/routes,
API, stockage ou dépendance ajouté. Cet ajustement est intégré par la
[PR #37](https://github.com/arthurb1348/terrimaint/pull/37), fusionnée le 30 octobre 2026
(commit `09f6613e65626bb3158f05c37bac6931306a5a8f`), vérifié dans `origin/main` avant l'issue #39.

## 2026-10-30 — Déclaration d'incident de démonstration (issue #34, fusionnée)

L'[issue #34](https://github.com/arthurb1348/terrimaint/issues/34) propose une consultation
locale du parcours **fiche → formulaire → récapitulatif modifiable → simulation terminée**.
Un même composant sert `/agent/incidents/nouveau/:equipmentId` et son équivalent Responsable.
Il retrouve le matériel dans l'unique source typée déjà utilisée par la liste et la fiche.
Incidents reste actif pendant tout le parcours, y compris dans Plus sur petit écran Agent.
Les retours visent explicitement la fiche du même espace et transmettent seulement `q`,
la recherche de la liste. Un identifiant inconnu ne permet aucune déclaration.

Les prototypes Figma [description `188:36`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-36)
et [priorité `188:45`](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-45)
ont été consultés. Pour ce premier incrément, leurs deux étapes sont **regroupées dans un
formulaire** : intitulé, description, priorité et signalement facultatif d'un risque ou d'une
impossibilité d'utilisation. Cela permet de relire et corriger l'ensemble sans introduire
les étapes médias/localisation prévues plus tard. Le récapitulatif reste une étape distincte.
La charte, la carte matériel, les champs étiquetés et les choix radio suivent les références ;
les indications de synchronisation et de disponibilité du prototype ne sont pas simulées.

La priorité exige un choix explicite, sans sélection initiale : **Faible — intervention à
planifier**, **Haute — intervention rapide**, **Urgente — danger immédiat**. Le libellé visible
Faible prévaut sur le nom interne d'une couche Figma. Les décisions métier du 16 octobre
priment : **aucun type d'incident et aucun changement de statut d'équipement**. Signaler un
risque n'immobilise pas le matériel, y compris dans l'espace Responsable ; l'immobilisation
officielle reste un futur parcours réservé au Responsable.

Dans cet incrément initial, intitulé et description doivent contenir autre chose que des espaces.
La description facultative fait l'objet de l'ajustement #36 décrit ci-dessus. Les limites sont
**120 et 2000 caractères** (longueur JavaScript/HTML, en unités UTF-16) : bornes frontend de
démonstration, visibles dans l'aide et à confirmer avec le futur contrat serveur. Les erreurs
conservent la saisie et déplacent le focus au premier champ invalide. Modifier depuis le
récapitulatif retrouve toutes les valeurs ; terminer annonce explicitement qu'aucun incident
n'a été enregistré ni envoyé et ne produit pas de numéro fictif.

Les valeurs restent dans le composant en mémoire, jamais dans l'URL ni dans un stockage
persistant. Quitter, recharger ou changer de matériel efface le formulaire et son étape ;
une modification de `q` seule ne les efface pas. Aucune requête métier n'est faite. Photos,
audio, GPS, brouillons persistants et API restent futurs. Les routes publiques et la validation
locale ne constituent pas des permissions ou une validation serveur. Dépendances et politique
npm de la PR #30 sont conservées. L'[issue #33](https://github.com/arthurb1348/terrimaint/issues/33)
reste un diagnostic distinct : aucun contournement de l'autocomplétion n'est ajouté.
Cet incrément est intégré par la [PR #35](https://github.com/arthurb1348/terrimaint/pull/35),
fusionnée le 30 octobre 2026 (commit `5e348c7f275a471e9369571a1181801c2291a1d4`),
vérifié dans le dernier `origin/main` avant création de la branche de l'issue #36.

## 2026-10-30 — Fiche Matériel locale et recherche dans l'URL (issue #31, fusionnée)

La consultation de l'[issue #31](https://github.com/arthurb1348/terrimaint/issues/31) partage
un seul composant entre `/agent/equipements/:id` et `/responsable/equipements/:id` et lit
la source typée existante, sans seconde liste de données. Le paramètre `id` est observé pour
suivre sa modification lorsque le routeur réutilise le composant ; un identifiant absent
de la source produit un état introuvable explicite avec retour.

La recherche devient un paramètre d'URL **`q`**. Les liens liste/fiche/retour transmettent
la saisie exacte ; le filtrage normalise seulement sa propre comparaison. `replaceUrl`
évite une étape d'historique par lettre. Le retour vise la liste du même espace, même
après accès direct, sans dépendre d'un historique ni d'un stockage persistant. Matériel
reste actif sur sa liste et ses fiches ; les routes demeurent publiques, sans permissions.

La fiche affiche uniquement nom, identifiant, emplacement et mention de démonstration.
Statuts, historiques, formulaires, modification, scanner et API métier restent hors périmètre.
La charte et les parties pertinentes des prototypes sont reprises sans simuler leurs
fonctions futures. Cet incrément est intégré par la
[PR #32](https://github.com/arthurb1348/terrimaint/pull/32), fusionnée le 30 octobre 2026
(commit `ab29cc512a384cbe5a583b3e42b7f24312932dc0`), vérifié dans `origin/main` avant l'issue #34.

## 2026-10-30 — Outillage frontend et scripts npm examinés (fusionnée)

La maintenance sur `fix/frontend-toolchain-security` fixe `@angular/build` à **22.2.5**
pour suivre sa dépendance officielle Vite **8.3.5**, avec lockfile régénéré par npm.
Les autres versions directes, dont Node 24.21.0 et npm 11.19.0, sont conservées.
Les dépendances indirectes nécessaires à ce builder évoluent sans override Vite.

Les décisions `allowScripts` sont limitées aux versions examinées : seul le `postinstall`
d'`esbuild@0.28.2` est autorisé. Les scripts d'`@parcel/watcher@2.6.0`, `lmdb@3.5.6` et
`msgpackr-extract@3.0.4` sont refusés : les binaires précompilés fonctionnent sans leur
compilation de repli dans l'environnement Linux contrôlé. Le `.npmrc` du frontend active
`strict-allow-scripts=true` pour refuser toute nouvelle version avec script non examinée.
Le [guide du code](code-guide.md#dépendances-frontend-et-scripts-dinstallation-npm) détaille
les fichiers relus, les raisons, les contrôles et la procédure de mise à jour. Windows et
macOS restent à vérifier. Cette maintenance est intégrée par la
[PR #30](https://github.com/arthurb1348/terrimaint/pull/30), fusionnée le 30 octobre 2026
(commit `fdaa85d531c77a34eb73b6075aa12200df163546`).

## 2026-10-30 — Accès Scanner selon la présentation (issue #21, fusionnée)

La décision UX d'Arthur dans l'[issue #21](https://github.com/arthurb1348/terrimaint/issues/21)
conserve Scanner sur mobile et tablette et simplifie la présentation ordinateur. La PR
associée masque **les deux accès**, raccourci de l'accueil Agent et entrée de navigation,
à partir de **1200 px inclus de largeur de fenêtre CSS**. Ce seuil conserve Scanner à
768 px et à 1024 px, notamment sur tablette en paysage ; il le masque à 1440 px.
Une fenêtre d'ordinateur plus étroite conserve donc Scanner : la règle décrit la présentation,
sans identifier l'appareil, sa caméra ou une permission.

Le seuil existant de 760/761 px continue seulement de choisir entre Plus et les destinations
directes. Jusqu'à 760 px : Accueil, Matériel, Scanner et Plus ; de 761 à moins de 1200 px :
les cinq destinations directes ; à partir de 1200 px : Accueil, Matériel, Incidents et Profil.
`display: none` retire les accès Scanner de la mise en page et du parcours clavier ; il retire
aussi le `li` de l'accueil pour ne laisser aucune puce vide. Les liens flexibles de navigation
se répartissent l'espace disponible. La route `/agent/scanner` reste accessible par URL
directe à toute largeur et affiche toujours la page d'attente existante.

Les deux media queries, dans `features/agent/agent.css` et
`shared/main-navigation/main-navigation.css`, doivent garder le même seuil. Playwright couvre
les deux emplacements à 320, 390, 768 et 1440 px, les limites 1199/1200/1201 px et des
allers-retours par redimensionnement sans rechargement, ainsi que l'URL directe et le clavier.
Matériel et sa recherche, les autres destinations et la navigation Responsable sont conservés.
Scanner réel, saisie de code et dépendances restent hors périmètre. Cette adaptation est
**intégrée par la [PR #29](https://github.com/arthurb1348/terrimaint/pull/29)**, fusionnée le
30 octobre 2026 (commit `4f5e3fc7b331482c5a2a994309f6481ee3f2acb1`).

## 2026-10-23 — Tests responsive reproductibles

Versionner les contrôles Playwright du shell et des navigations avec Chromium, en complément
des tests Vitest. Les formats 320 × 568, 390 × 844, 768 × 1024 et 1440 × 1024 couvrent petit
téléphone, mobile, tablette et ordinateur. La santé HTTP est simulée pour isoler l'interface.
Ces tests vérifient la géométrie et les interactions ; ils ne valident ni Django, ni un appareil
physique, ni la conformité visuelle complète aux maquettes.

Le workflow `Responsive` publie rapport, captures et traces d'échec pendant sept jours.
Il n'est pas ajouté au ruleset obligatoire au départ ; ses échecs restent visibles, sans
`continue-on-error`. Les contrôles `Backend` et `Frontend` restent inchangés. Les captures
servent à la relecture humaine, sans comparaison automatique pixel par pixel à ce stade.
Ces tests sont intégrés par la [PR #19 fusionnée](https://github.com/arthurb1348/terrimaint/pull/19)
le 23 octobre 2026.

## 2026-10-16 — Adapter la navigation Agent aux petits écrans (validée)

Le test de la PR #16 sur petit téléphone a révélé que cinq entrées rendaient les libellés
trop serrés. Jusqu'à 760 px, conserver **Accueil, Matériel, Scanner et Plus** sur une rangée,
avec icônes et textes. Plus donne accès à Incidents et Profil, indique leur état actif et
se ferme au toucher extérieur, par Échap, par Fermer ou après navigation, avec gestion du focus.
À partir de 761 px, les cinq destinations Agent restent directement visibles.
La décision du 30 octobre ci-dessus propose ensuite de masquer Scanner à partir de 1200 px,
sans changer le seuil ni le fonctionnement de Plus.

Cette adaptation validée privilégie la lisibilité et les accès terrain fréquents par rapport
au nombre d'entrées du prototype. La déclaration rapide depuis l'accueil ou une fiche reste
prévue, sans formulaire ajouté par cette décision. La navigation Responsable ne change pas.
La [PR #16 fusionnée](https://github.com/arthurb1348/terrimaint/pull/16) porte l'implémentation.

## 2026-10-16 — Immobilisation et déclaration simplifiée (validées)

L'immobilisation officielle et la remise en service d'un équipement sont réservées au
Responsable. L'Agent peut signaler un risque ou une impossibilité d'utilisation ; son
signalement ne change jamais directement le statut de l'équipement. Ces règles devront
être imposées côté serveur lors de l'implémentation métier.

Le type d'incident est retiré du MVP. La déclaration conserve une qualification par priorité,
sans champ de type. La première détection de récurrences pourra rapprocher les incidents
successifs d'un même équipement ; elle ne prétend pas reconnaître automatiquement une panne
identique. Le seuil et la période de rapprochement restent à préciser avant son implémentation.

Ces décisions priment sur les éléments contradictoires des prototypes Figma.

## 2026-10-16 — Navigation issue du prototype (fusionnée)

Les parcours Prototype Agent `188:3` et Responsable `188:6` guident l'UX avant les anciennes
maquettes et bibliothèques. Le shell reprend leurs navigations et styles en CSS natif, avec
une adaptation responsive pour chaque espace. Les URL sous `/agent` et `/responsable`
conservent le contexte ; les pages équipement et incident partagent les mêmes composants.
Les anciennes URL redirigent vers les nouvelles. Aucun lien ne confère de permission.

La navigation basse Agent et la barre latérale Responsable ont des destinations accessibles,
encore explicitement réservées aux prochains incréments. Recherche, notifications, identité
connectée et synchronisation ne sont pas simulées. Le contrôle de santé HTTP reste sur
l'accueil général et ne prouve ni persistance ni synchronisation. Les icônes originales sont
exportées depuis les instances du prototype, conservées localement dans `frontend/public/icons/`.
Aucune dépendance applicative ajoutée.

## 2026-10-16 — Architecture Angular par fonctionnalités (fusionnée)

Conserver Angular 22 strict/standalone, les signals, Vitest et l'accueil existant.
Le composant racine porte le shell responsive ; `shared/main-navigation` contient la
navigation commune sans état métier. Le service HTTP de santé et son test passent dans
`core/`. `home/` reste en place pour éviter une refonte sans bénéfice fonctionnel.

Les cinq pages `features/agent`, `responsable`, `equipements`, `incidents` et `interventions`
sont chargées par `loadComponent`. Les deux espaces pointent vers les mêmes domaines ;
le responsable pourra aussi réaliser les actions terrain. Une page d'entrée explicite suffit
à chaque domaine : aucun modèle, store, service métier ou composant générique anticipé.

Ces routes sont publiques et ne représentent pas des permissions. Authentification,
autorisations serveur et éventuels guards d'ergonomie viendront avec des règles testées.
Le shell garde la charte existante, sans maquette détaillée disponible dans le dépôt,
sans données simulées ni fonctionnalité hors connexion. Aucun ajout de dépendance.

## 2026-10-16 — Migration du socle vers Django/DRF (fusionnée)

Django 5.2 LTS et DRF 3.16 remplacent FastAPI, Uvicorn et Pydantic ; Python 3.12
reste la référence. uv verrouille les versions résolues. Le projet `terrimaint_api`
sépare configuration, routage, entrées WSGI/ASGI et application `health`, sans couche métier.
Le contrat GET `/api/v1/health` reste HTTP 200, JSON `{"status":"ok"}`, sans accès DB.
Le proxy Angular conserve l'origine du navigateur : aucune ouverture CORS n'est ajoutée.
Les tests passent à pytest-django/APIClient et vérifient explicitement les anciennes routes
OpenAPI/UI en 404 : aucun consommateur n'a été trouvé dans le dépôt.

SQLite local suffit à la configuration Django et aux futurs essais ; aucun modèle,
migration, compte, session ou PostgreSQL n'est introduit. La configuration DB est centralisée
pour le prochain incrément PostgreSQL. Les variables d'environnement pilotent le mode debug,
la clé secrète et les hôtes autorisés ; hors debug, une clé est obligatoire.
La CI existante garde la même commande ; le frontend conserve son code et son proxy.

## 2026-10-16 — Architecture cible et qualité dès la conception

- **Django + Django REST Framework** : un cadre commun pour les modèles, migrations,
  validation et API, avec les mécanismes d'authentification et de permissions à configurer
  et tester. Ce choix réduit l'assemblage d'outils pour un développeur solo et reste en Python.
- **PostgreSQL** : une base relationnelle adaptée aux liens équipements/incidents/interventions,
  aux contraintes d'intégrité et aux transactions. Aucune persistance n'est encore implémentée.
- **Angular + TypeScript** : conserver le frontend déjà initialisé ; composants, routage,
  typage strict et tests soutiennent des parcours maintenables. Le typage ne remplace pas
  la validation des réponses reçues ni celle des entrées côté serveur.
- **PWA avec hors connexion ciblé** : répondre aux pertes réseau du terrain sans promettre
  que toute l'application fonctionnera hors ligne. Cache, brouillons/photos et synchronisation
  restent à développer, avec règles de conservation, conflits et dédoublonnage explicites.
- **Tests et sécurité intégrés dès la conception** : définir critères, risques et permissions
  avant de coder, puis tester succès et refus. Les contrôles CI complètent la relecture humaine.

Cette décision remplace l'ancienne cible FastAPI/SQLAlchemy/Alembic. Au moment de cette décision documentaire, le socle
était encore FastAPI. La migration Django/DRF est décrite ci-dessus ; PostgreSQL reste futur.

La politique de commentaires d’[AGENTS.md](../AGENTS.md) privilégie la lisibilité et le pourquoi ;
les explications longues vont dans `docs/`, sans commentaire automatique à chaque bloc.

## 2026-10-07 — Bilan versionné et validation humaine

GitHub constitue la source de vérité. `docs/project-status.md` synthétise l'état réel,
avec date, commit de référence et liens vers le code, les tests et la documentation.
Les intentions et PR ouvertes restent distinctes des capacités intégrées sur `main`.
Les futures documentations et présentations externes seront dérivées de ce bilan ;
aucun mécanisme de synchronisation externe n'est installé par cette décision.

Le workflow est pilotable depuis cloud/mobile comme depuis PC ; VS Code local est facultatif.
Chaque PR significative préparée par un agent inclut un compte rendu pédagogique et des
questions de compréhension. Le fonctionnement et les contrôles automatisés ne remplacent
pas la compréhension ni la validation humaine. Les commentaires expliquent les intentions
et comportements non évidents, et le guide porte les détails utiles à l'apprentissage.

## 2026-10-06 — Un seul dépôt

Regrouper backend, frontend et documentation. Pour un développeur solo et un MVP,
une PR peut ainsi réunir le contrat API, le code et les tests du même parcours.
Chaque partie conserve son propre emplacement et ses commandes de contrôle.

## Historique — Stack validée avant l'initialisation (remplacée le 2026-10-16)

Backend Python/FastAPI avec PostgreSQL, SQLAlchemy et Alembic ; frontend Angular/TypeScript.
La PWA couvrira des usages hors connexion ciblés sur le terrain.
Le backend Python soutient la trajectoire Data/IA ; le projet couvre aussi les compétences CDA.

## 2026-10-06 — Automatiser les contrôles, garder la fusion manuelle

Une issue par tâche, une branche courte et une PR. Codex prépare le code et les preuves de
vérification. Arthur relit et fusionne. La CI et les dépendances sont automatisées progressivement.
GitHub reste la source du suivi des tâches ; les décisions durables vivent ici.

## 2026-10-06 — Socle progressif

Premier incrément : API minimale et workflow vérifiable. Le socle utilise Python 3.12.
uv verrouille les versions effectives dans `uv.lock`. Angular et la persistance seront des PR
distinctes avec leurs propres critères. La CI initiale ne prétend pas vérifier ces parties à venir.

## 2026-10-06 — Accueil Angular et contrôles

Angular 22.2.1 stable et Node 24.21.0 LTS sont compatibles selon la documentation officielle.
Application strict/standalone avec routage, HttpClient et signals, sans Zone.js ni SSR.
Vitest/jsdom est le runner natif de cette CLI ; angular-eslint analyse TypeScript et templates.
Les dépendances sont verrouillées par npm et la CI utilise la même version de Node.

Le service de santé valide le JSON reçu et limite l'attente à cinq secondes. L'accueil
affiche un résultat lisible et permet de réessayer sans développer de parcours métier.
Le proxy local garde une URL relative, sans modifier le contrat backend ni ajouter CORS.
Les commentaires français et le guide du code servent la présentation orale du projet.
À cette date, le fichier ruleset prévoyait Frontend et son activation distante restait à faire.
La lecture GitHub du 16 octobre 2026 confirme désormais les deux contrôles obligatoires ;
voir le [bilan](project-status.md).
