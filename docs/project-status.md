# Bilan du projet TerriMaint

## Déclaration sur lieu côté Responsable — #105, en revue

Base vérifiée `e578a33`, fusion de #104. La liste Responsable propose Nouveau signalement,
avec la route spécifique avant le détail et le formulaire partagé en mode lieu.
Annuler/Retour conservent ses filtres ; Voir le signalement ouvre la nouvelle fiche dans
l’espace d’origine sans ces filtres. Les validations et les créations en mémoire restent
communes aux deux espaces. Résultats et procédure téléphone dans la PR de #105.


## Confidentialité de la démo — #97, en revue

Base vérifiée `78f0f6f`, fusion de #103. Le pied de page commun donne accès à une
page partagée sous chaque espace, qui décrit les permissions, la mémoire de l’onglet
et le chargement explicite des tuiles OpenStreetMap. La portée reste la démo actuelle.
Les preuves de code, requêtes observées, interceptions et résultats figurent dans la PR.


## Agents Responsable — #96, en revue

Base vérifiée : `a8bad8d`, fusion de #102. `/responsable/agents` consulte les trois
entrées de `DEMO_AGENTS`. Le composant `features/agents/agents.ts` dérive dans un
`computed` les effectifs Planifiées et En cours de `DemoData.interventions`, par
identifiant d’agent ; les zéros restent visibles. Programmer ou terminer via les
parcours existants actualise ces valeurs dans le même onglet. Les liens vers la
liste Responsable transmettent uniquement `assignee` : les terminées y restent visibles.
Aucun compte, droit, disponibilité ou planning ajouté. Recharge et fermeture perdent
les créations de démonstration. Les résultats réels et la procédure téléphone sont
consignés dans la PR de #96.


## Référence et usage

Vérification ciblée du 13 novembre 2026 : dernier `origin/main` **`eeba26bafa200bed8698f309c41aee271d40af04`**,
avec [#100](https://github.com/arthurb1348/terrimaint/pull/100) et
[#101](https://github.com/arthurb1348/terrimaint/pull/101) fusionnées et présentes dans cette base.
La déclaration sur lieu #94 et la carte #93 sont intégrées.
**En revue (#95) :** programmer depuis la fiche Responsable d’un signalement sur lieu
Ouvert/En cours. Le lieu écrit seul suffit et reste fourni par le signalement ; formulaire,
récapitulatif, consultation et recherche le présentent sans lien Matériel fictif.
La création est Planifiée, sans changer le statut du signalement. Service et interface
refusent les origines invalides ou clôturées. Les nouvelles affectations sont partagées
entre Responsable et Agent dans le même onglet. Les parcours matériel sont conservés.
Voir [le guide de revue](place-incidents.md). Résultats réels, commits contrôlés et lien
Firebase sont consignés dans la PR de #95 ; validation et fusion restent à Arthur.
Les passages ci-dessous conservent leurs dates et leur contexte historiques.

Vérification ciblée du 6 novembre 2026 pour [#78](https://github.com/arthurb1348/terrimaint/issues/78) :
base distante `origin/main` **`73da92ecc26e4236f68b8b9e60f3c061197ab00e`**,
vérifiée par Git distant et GitHub. [#77](https://github.com/arthurb1348/terrimaint/pull/77)
est fusionnée et présente dans cette base : accès Scanner et actions photo #76 intégrés.
**En revue :** intégration du logo validé dans l’en-tête et la sidebar Responsable,
favicon SVG/ICO fourni, provenance et licence Inter conservées. Aucun comportement
métier, stockage, dépendance, workflow, permission ou réglage Firebase modifié.
Voir [les usages et la revue du logo](brand.md). Les résultats réels et limites sont
dans la PR ; les passages datés ci-dessous restent historiques.

- Date de vérification ciblée : 2026-11-01 (Europe/Paris), fusion #58/#60 et #61/#62, préparation photos #57. Les autres preuves conservent leur date.
- Dépôt source : [arthurb1348/terrimaint](https://github.com/arthurb1348/terrimaint).
- Code de référence : `main`, commit `73889125a5683af04d7360423d53e16802e73be7` (PR #60 fusionnée, #62 également intégrée), vérifié sur GitHub et par Git distant.
- Périmètre : état constaté du code, des configurations et de la documentation ;
  les PR non fusionnées ne font pas partie des fonctionnalités implémentées.

Ce bilan versionné est la synthèse de référence. Les sources liées dans chaque section
permettent de vérifier les affirmations ; le code intégré sur GitHub prévaut en cas d'écart.
Le document prépare une réutilisation future par un humain ou un agent, sans synchronisation
externe actuellement installée. Les statuts utilisés sont **implémenté**, **en cours**,
**prévu** et **non présent**. Une intention documentée ne prouve pas une implémentation.

## Nom et objectif

**TerriMaint — Du terrain à la décision.** Projet de formation CDA pour les petites
collectivités : relier les signalements de terrain au suivi des équipements et des
interventions, avec un historique partagé entre agents et responsable.
Ces parcours sont l'objectif produit, pas les capacités actuelles de l'application.
Source : [contexte produit](project.md).

## Priorité frontend pour décembre 2026

Arthur valide la priorité aux parcours frontend pour préparer son oral de **décembre 2026**.
L'[issue #39](https://github.com/arthurb1348/terrimaint/issues/39) et la PR #40 sont intégrées :
consultation des signalements avec priorité à la présentation Responsable, partagée avec Agent.
L'[issue #41](https://github.com/arthurb1348/terrimaint/issues/41) est intégrée par la
[PR #49](https://github.com/arthurb1348/terrimaint/pull/49), fusionnée le 31 octobre 2026 :
programmation simulée depuis un signalement Responsable. La consultation d'un jeu fixe
d'interventions #42 est intégrée par la [PR #50](https://github.com/arthurb1348/terrimaint/pull/50),
fusionnée le 31 octobre 2026 ; #59 intégrée par #69 complète cette consultation par les
créations en mémoire, sans modifier les exemples initiaux.
L'harmonisation UX #51 est intégrée par la [PR #52](https://github.com/arthurb1348/terrimaint/pull/52),
fusionnée le 31 octobre 2026 : incrément **4/10**. La correction de contraste
[#53](https://github.com/arthurb1348/terrimaint/issues/53) est intégrée par la PR #54 fusionnée. #43 est intégrée par la [PR #55](https://github.com/arthurb1348/terrimaint/pull/55), incrément 5/10.
Le Scanner QR #44 est intégré par la PR #56 fusionnée. Les ajustements Pixel #58 sont
intégrés par #60 ; les photos #57 sont intégrées par #63. #59 est intégrée par #69 ;
Mes interventions #70 est intégrée par #71 ; l’UX #72 est intégrée par #73 ; #76 est intégrée par #77, puis interventions sur fiche matériel, gestion des états,
#45 GPS, #46 audio, #47 dashboard et #48 stabilisation restent prévus.
PostgreSQL ([#38](https://github.com/arthurb1348/terrimaint/issues/38)) est **différé** et ne
bloque pas cet incrément. La cible Django/DRF/PostgreSQL reste prévue ; la démonstration
locale ne prétend pas fournir persistance, authentification ou permissions métier.

## Navigation Prototype intégrée

La [PR #16 fusionnée](https://github.com/arthurb1348/terrimaint/pull/16) intègre les navigations
des prototypes Agent et Responsable : barre basse Agent, barre latérale Responsable sur ordinateur et menu repliable
sur mobile. Les deux espaces restent accessibles sur chaque format. Les liens actifs,
repères de focus et lien d'évitement sont conservés. La liste et les fiches Matériel des PR
#20/#32, puis la simulation locale d'incident de la PR #35, complètent les pages d'attente.
Aucune authentification, modèle métier ou API supplémentaire n'est ajouté. Le contrôle de santé
reste sur l'accueil général ; aucun statut de synchronisation n'est simulé.

Les nouvelles URL sous `/agent/…` et `/responsable/…` partagent les composants équipement et
incident. Les anciennes URL redirigent. Scanner ouvre le lecteur QR intégré ; profil et agents restent indisponibles. Les décisions validées sur l'immobilisation réservée
au Responsable et le retrait du type d'incident sont dans [decisions.md](decisions.md).
Depuis #73, la navigation mobile Agent affiche **Accueil, Matériel, Interventions et Plus**.
Plus conserve Incidents/Profil, fermeture et focus. Depuis #77, Plus ajoute Scanner ;
au-delà de 760 px, les destinations sont directes (Scanner masqué dès 1200 px).
La navigation Responsable possède également son entrée Scanner.
Les liens Scanner et la carte d’accueil sont visibles sous
1200 px et masqués dès 1200 inclus, avec les deux routes directes accessibles à toute largeur.
L’accueil conserve les affectations partagées de Camille ; le cadre suit l’image vidéo sans
modifier les pixels décodés. La [décision et le guide](agent-scan-ux.md) expliquent ce choix.

## Architecture Angular intégrée

La [PR #15](https://github.com/arthurb1348/terrimaint/pull/15) a intégré sur `main` le shell
responsive et cinq pages d'entrée différées : `/agent`, `/responsable`, `/equipements`,
`/incidents`, `/interventions`. `core/` porte le service de santé, `shared/` la navigation,
`features/` les pages métier. Matériel affiche une liste locale, une recherche et ses fiches ;
un formulaire permet une simulation d'incident en mémoire, sans action métier opérationnelle.
Ces liens ne confèrent aucun rôle.

## Architecture actuelle

- Un seul dépôt pour backend, frontend, documentation et contrôles.
- API Django/DRF, configuration SQLite locale sans modèle ni migration métier.
- Client Angular strict, composants standalone, routage et état réactif par signals ;
  sans SSR ni Zone.js.
- Circulation des données : accueil → service `ApiHealth` → HTTP GET `/api/v1/health`
  → Django/DRF → JSON `{"status":"ok"}` → état affiché.
- En développement, le proxy Angular transmet `/api/**` à `http://127.0.0.1:8000`.
- Aucun stockage persistant, modèle métier, authentification ou système de rôles présent.
  Aucun déploiement de production défini ; l'URL relative de l'API devra être prise en
  charge par l'hébergement choisi ultérieurement.

Sources : [API](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/src/terrimaint_api/health/views.py),
[service HTTP](../frontend/src/app/core/api-health.ts),
[configuration Angular](../frontend/src/app/app.config.ts),
[proxy](../frontend/proxy.conf.json).

## Stack effectivement présente

| Partie | Technologies présentes et versions de référence | Source |
| --- | --- | --- |
| Backend | Python 3.12 pour le socle/CI ; Django 6.1.2, DRF 3.18.3 ; SQLite local configuré, sans persistance métier | [.python-version](../.python-version), [pyproject.toml](../pyproject.toml), [uv.lock](../uv.lock) |
| Qualité Python | uv, pytest 9.1.1, pytest-django 4.14.0, Ruff 0.17.2, pre-commit | [uv.lock](../uv.lock), [hooks](../.pre-commit-config.yaml) |
| Frontend | Angular 22.2.1, CLI 22.2.4, builder 22.2.5, Vite 8.3.5, TypeScript 6.0.3, RxJS, HTML/CSS | [package.json](../frontend/package.json), [package-lock.json](../frontend/package-lock.json) |
| Outillage frontend | Node 24.21.0 LTS, npm 11.19.0, ESLint/angular-eslint, Vitest et jsdom | [.nvmrc](../.nvmrc), [package.json](../frontend/package.json) |
| Suivi et CI | Git/GitHub, GitHub Actions, Dependabot | [CI](../.github/workflows/ci.yml), [Dependabot](../.github/dependabot.yml) |

PostgreSQL est **prévu et différé** (#38), PWA et IndexedDB sont **prévus**, non installés
ou implémentés dans ce socle.
Les versions effectives des dépendances viennent des lockfiles ;
les bornes déclarées dans les manifestes ne doivent pas être prises pour des versions exactes.

## Fonctionnalités implémentées

| Fonctionnalité | Comportement et limites | Preuve |
| --- | --- | --- |
| Santé HTTP de l'API | GET `/api/v1/health`, statut 200 et JSON `{"status":"ok"}` ; ne vérifie aucune base de données | [API](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/src/terrimaint_api/health/views.py) |
| Anciennes routes API | `/openapi.json`, `/docs` et `/redoc` renvoient 404 ; aucune UI OpenAPI ajoutée | [tests HTTP](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/tests/test_health.py) |
| Accueil responsive | Signature du projet, statut de l'API et bouton de relance ; attente, disponible ou indisponible | [composant Home](../frontend/src/app/home/home.ts), [template](../frontend/src/app/home/home.html), [styles](../frontend/src/app/home/home.css) |
| Gestion des échecs HTTP | Validation du JSON, erreurs réseau/HTTP et délai maximal de cinq secondes ; annulation en quittant la page | [service intégré](../frontend/src/app/core/api-health.ts), [composant](../frontend/src/app/home/home.ts) |
| Routage | Accueil, listes et fiches publiques avec contexte Agent/Responsable, anciennes URL redirigées et retour des URL inconnues à l’accueil | [routes](../frontend/src/app/app.routes.ts) |
| Matériel de démonstration | Six équipements fictifs, recherche locale par nom/identifiant et effacement avec retour du focus, dans les deux espaces ; aucune API métier | [PR #20 fusionnée](https://github.com/arthurb1348/terrimaint/pull/20), [composant](../frontend/src/app/features/equipements/equipements.ts) |
| Fiche Matériel de démonstration | Liens clavier, composant partagé, état introuvable, accès direct/rechargement, retour conservant la recherche `q` et Matériel actif | [PR #32 fusionnée](https://github.com/arthurb1348/terrimaint/pull/32), [fiche](../frontend/src/app/features/equipements/equipment-detail.ts) |
| Simulation locale d'incident | Formulaire partagé, validation, récapitulatif modifiable, confirmation sans enregistrement ni envoi, retours avec `q` ; état en mémoire seul | [PR #35 fusionnée](https://github.com/arthurb1348/terrimaint/pull/35), [composant](../frontend/src/app/features/incidents/incident-declaration.ts) |
| Programmation simulée Responsable | Origine Ouvert/En cours, titre, consignes facultatives, agent fictif, date locale, récapitulatif modifiable et confirmation en mémoire ; aucun enregistrement | [PR #49 fusionnée](https://github.com/arthurb1348/terrimaint/pull/49), [composant](../frontend/src/app/features/interventions/intervention-planning.ts) |
| Consultation locale des interventions | Six exemples fixes, filtres combinés dans l’URL, détail Responsable, origines sans filtres étrangers, dates calendaires et retours ; les simulations n’alimentent pas le jeu | [PR #50 fusionnée](https://github.com/arthurb1348/terrimaint/pull/50), [liste](../frontend/src/app/features/interventions/interventions.ts), [détail](../frontend/src/app/features/interventions/intervention-detail.ts) |
| Consultation locale des signalements | Six exemples fixes liés au matériel, recherche/filtres combinés dans l'URL, détail partagé, retours conservés, états absents et clavier | [PR #40 fusionnée](https://github.com/arthurb1348/terrimaint/pull/40), [liste](../frontend/src/app/features/incidents/incidents.ts), [détail](../frontend/src/app/features/incidents/incident-detail.ts) |

## Matériel de démonstration intégré

La [PR #20](https://github.com/arthurb1348/terrimaint/pull/20), **fusionnée le 23 octobre 2026**
(commit `f36d19f31d29b11969405216eb43bb96b147f061`), intègre la page Matériel
commune à `/agent/equipements` et `/responsable/equipements`, qui affiche six équipements fictifs,
avec identifiant stable, nom et emplacement textuel. Une mention visible identifie les données
de démonstration. La recherche locale porte sur le nom et l'identifiant, ignore la casse et
les espaces de début/fin ; une recherche vide affiche tout. Le message vide et l'effacement
avec retour du focus au champ sont inclus. La source typée est séparée du composant.

Cet incrément intégré ne constitue pas un parcours connecté à une
API métier : aucune requête d'équipements, sauvegarde, CRUD, authentification, permission,
scan QR ou synchronisation. Les navigations existantes sont conservées. Le [guide du code](code-guide.md#matériel--première-liste-de-démonstration)
explique les fichiers, le filtrage et le futur point de raccordement API.

## Adaptation Scanner intégrée

L'[issue #21](https://github.com/arthurb1348/terrimaint/issues/21) est réalisée par la
[PR #29](https://github.com/arthurb1348/terrimaint/pull/29), **fusionnée le 30 octobre 2026**
(commit `4f5e3fc7b331482c5a2a994309f6481ee3f2acb1`). Les deux accès restent visibles sous
1200 px, dont 768 et 1024 px sur tablette, et sont masqués sur grand écran à partir de
1200 px inclus. Le raccourci disparaît avec sa ligne et la navigation se répartit sans trou.
Matériel/recherche, Plus, la navigation Responsable et la route directe sont conservés.
Le [guide du code](code-guide.md#accès-scanner-et-seuil-de-présentation) détaille le choix.

## Maintenance de l'outillage intégrée

La [PR #30](https://github.com/arthurb1348/terrimaint/pull/30) est **fusionnée le 30 octobre 2026**
(commit `fdaa85d531c77a34eb73b6075aa12200df163546`). Elle fixe `@angular/build` à 22.2.5,
dont le manifeste officiel déclare Vite 8.3.5. Le lockfile
régénéré par npm ne contient plus que Vite 8.3.5, au lieu de 8.3.3 à la racine et de 8.3.0
sous le builder. L'audit de départ signale Vite et son parent, soit deux paquets affectés ;
les contrôles après mise à jour puis après installation propre ne signalent aucune vulnérabilité.
Ce constat est daté, limité aux alertes connues par npm, et ne vaut pas validation de sécurité
de l'application. Les autres dépendances directes et Node/npm sont conservés ; les dépendances
indirectes nécessaires au builder évoluent sans override Vite ni `npm audit fix --force`.

Après lecture des quatre scripts présents, seul `esbuild@0.28.2` est autorisé. Les scripts
d'`@parcel/watcher@2.6.0`, `lmdb@3.5.6` et `msgpackr-extract@3.0.4` sont refusés pour ces versions ;
leurs binaires précompilés restent installés. Le `.npmrc` du frontend active le contrôle strict
pour refuser avant exécution les versions avec script non examinées. L'installation propre
avec `npm ci --foreground-scripts` n'exécute que le `postinstall` d'esbuild ;
`npm install-scripts ls` ne présente plus de script non couvert. Les modules natifs et le
démarrage/rechargement Angular sont contrôlés sous Linux ; Windows et macOS restent à vérifier.
Les résultats complets sont consignés dans la PR #30. Sa
[CI](https://github.com/arthurb1348/terrimaint/actions/runs/41048825375) et son
[Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41048825272) réussis concernent
le commit proposé `cdffa3ac9430cf22521a46a35757a6c21ac051f1`, avant fusion.
Le [guide](code-guide.md#dépendances-frontend-et-scripts-dinstallation-npm) et la
[décision](decisions.md) expliquent les autorisations et les limites.

## Fiche Matériel intégrée

L'[issue #31](https://github.com/arthurb1348/terrimaint/issues/31) est intégrée par la
[PR #32](https://github.com/arthurb1348/terrimaint/pull/32), **fusionnée le 30 octobre 2026**
(commit `ab29cc512a384cbe5a583b3e42b7f24312932dc0`, présent dans le dernier `origin/main` vérifié).
Chaque nom de la liste devient un lien réel vers `/agent/equipements/:id` ou
`/responsable/equipements/:id`. Les deux chemins chargent le même composant, qui affiche
nom, identifiant et emplacement depuis la même source typée que la liste, avec une mention
visible « Données de démonstration ». L'état introuvable conserve un retour à Matériel.

La recherche est portée par `q` dans l'URL, transmise à la fiche puis à la liste par
« Retour au matériel ». La saisie et les résultats sont donc retrouvés, y compris après
rechargement, sans stockage persistant. Le contexte, Matériel actif et le parcours clavier
sont conservés. L'identifiant est observé pour actualiser une fiche réutilisée par le routeur.
La source fictive, les versions de dépendances et la politique npm de la PR #30 sont conservées.

Cet incrément est local et public : aucune API métier, permission, modification d'équipement,
formulaire d'incident, statut métier, historique ou scanner ajouté. Le
[guide du code](code-guide.md#fiche-partagée-et-circulation-des-données-issue-31-fusionnée)
explique les routes, les paramètres et les endroits à modifier. Les résultats réels des
contrôles et les captures sont consignés dans la PR ; ils ne valent pas validation humaine.

## Simulation locale d'incident intégrée

L'[issue #34](https://github.com/arthurb1348/terrimaint/issues/34) est intégrée par la
[PR #35](https://github.com/arthurb1348/terrimaint/pull/35), **fusionnée le 30 octobre 2026**
(commit `5e348c7f275a471e9369571a1181801c2291a1d4`, vérifié dans le dernier `origin/main`).
Un lien de fiche valide ouvre le même formulaire dans les deux espaces,
avec le matériel identifié depuis la source existante. Dans cet incrément initial,
intitulé et description obligatoires (120/2000 caractères maximum), priorité explicite
Faible/Haute/Urgente et risque facultatif
conduisent à un récapitulatif modifiable, puis à une confirmation sans enregistrement.
Incidents reste actif, y compris Plus sur mobile Agent. Annuler ou revenir après la simulation
retrouve la fiche du même espace et sa recherche `q`.

Les valeurs restent en mémoire et disparaissent au départ, au rechargement ou au changement
de matériel. Un inconnu affiche un retour sans formulaire. Aucun type d'incident, statut
modifié, photo/audio/GPS, stockage persistant ou appel métier n'est ajouté. Les routes restent
publiques et la validation locale n'impose aucune permission. Dépendances et politique npm
sont inchangées. L'issue #33 reste un diagnostic séparé, sans contournement ajouté ici.
La [décision](decisions.md) explique le formulaire regroupé à partir des deux prototypes ;
le [guide](code-guide.md#déclaration-locale-dincident-issue-34-fusionnée) détaille le flux,
les fichiers et le test manuel. Les preuves des contrôles du commit proposé figurent dans
la PR. L'assouplissement de la description est l'ajustement distinct décrit ci-dessous.

## Ajustement de saisie intégré

L'[issue #36](https://github.com/arthurb1348/terrimaint/issues/36) est intégrée par la
[PR #37](https://github.com/arthurb1348/terrimaint/pull/37), **fusionnée le 30 octobre 2026**
(commit `09f6613e65626bb3158f05c37bac6931306a5a8f`, présent dans le dernier `origin/main` vérifié).
La description est facultative et les actions sont formulées autour du signalement.
L'intitulé et la priorité restent obligatoires. Une description vide ou blanche est acceptée
comme absente ; des détails renseignés restent limités à 2000 caractères. Le récapitulatif
affiche Non renseignée pour l'absence, sans modifier la valeur retrouvée avec Modifier.
Les trois boutons deviennent Vérifier le signalement, Envoyer le signalement et Modifier
le signalement. Une mention de démonstration accompagne l'action finale et la confirmation
Signalement simulé précise qu'aucun signalement n'est réellement transmis ou enregistré.
Le matériel, les deux espaces, `q`, le clavier, l'état en mémoire et le risque sans changement
de statut sont conservés, sans API, stockage ni dépendance ajoutés. La
[décision](decisions.md) demande de conserver cette règle dans le futur contrat serveur.

## Consultation des signalements intégrée

L'[issue #39](https://github.com/arthurb1348/terrimaint/issues/39) est intégrée par la
[PR #40](https://github.com/arthurb1348/terrimaint/pull/40), **fusionnée le 30 octobre 2026**
(commit `4eefc19a510a44e140d41425504fb02895ed2268`). Une source typée unique de six exemples fixes référence le matériel
existant par `equipmentId`, sans recopier noms ni emplacements. La liste combine recherche
par intitulé/référence/nom/id matériel et filtres de priorité/statut ; compteur, vide et
réinitialisation viennent des résultats réels. `q`, `priority` et `status` sont conservés dans
l'URL, au retour et au rechargement ; les valeurs de filtre inconnues sont ignorées.

Les deux espaces utilisent les mêmes composants. Le détail suit les changements d'identifiant,
affiche Non renseignée pour une description absente et un retour pour Signalement introuvable.
Voir le matériel reste dans le même espace sans lui transmettre les filtres de signalements.
Incidents reste actif, y compris Plus sur petit Agent. Le tableau Responsable s'adapte en
cartes quand la largeur du contenu est insuffisante, avec clavier et focus conservés.

Les prototypes sont adaptés explicitement : références INC distinctes de EQ ; statuts de
signalement Ouvert/En cours/Clôturé, sans employer les états de matériel de leur table.
Ce jeu de consultation n'est pas alimenté par la déclaration simulée. Aucun changement de
statut, intervention, média, API, PostgreSQL, stockage ou dépendance ajouté. Les routes
restent publiques ; #33 reste distincte. Le [guide](code-guide.md#liste-et-détail-des-signalements-issue-39-fusionnée)
et les [décisions](decisions.md) expliquent le flux et l'adaptation. Les résultats du commit
proposé avant fusion sont consignés dans la PR #40.

## Programmation simulée intégrée

L'[issue #41](https://github.com/arthurb1348/terrimaint/issues/41) est intégrée par la
[PR #49](https://github.com/arthurb1348/terrimaint/pull/49), fusionnée le 31 octobre 2026
(commit `eb86283f9898b88450401680fdbb5356c0c60733`). Le dernier `origin/main` distant a été
revérifié à ce commit au démarrage de #42 ; l'issue #41 est fermée. Le parcours Responsable est :
détail d'un signalement Ouvert/En cours → formulaire → récapitulatif modifiable →
**Programmation simulée**. Le matériel et le signalement viennent des sources existantes ;
trois agents fictifs ont leur propre petite source typée. Titre requis prérempli (120 unités
UTF-16), consignes facultatives (2000 si renseignées), agent explicite et date locale valide
aujourd'hui ou future. Les saisies restent exactes avec Modifier ; erreurs associées et focus
au premier champ invalide. Les signalements clôturés, inconnus et relations matériel absentes
n'offrent pas de formulaire. Aucune entrée ni route de programmation Agent n'est ajoutée.

Interventions reste actif, y compris au menu mobile. Les retours visent le signalement puis
la liste avec `q`, `priority`, `status` normalisés, sans toucher à la saisie exacte de `q`.
Un nouvel identifiant réinitialise le formulaire ; les seuls filtres de retour ne le font pas.
L'état reste en mémoire et disparaît au départ/rechargement, sans numéro fictif, appel métier,
stockage, notification, mutation de source ni statut modifié. La confirmation et l'action
finale précisent la démonstration. Ces choix frontend restent à traduire dans un futur contrat
serveur ; les routes publiques ne sont pas des permissions.

Les cinq écrans Figma référencés ont été lus. L'adaptation regroupe les champs dans un formulaire,
puis sépare récapitulatif et confirmation ; elle conserve le shell et la charte, avec une colonne
sur mobile/tablette et agent/date côte à côte à partir de 560 px disponibles dans le composant.
La liste/détail des interventions relève de #42, PostgreSQL #38 reste différé, #33 distincte.
Dépendances et politique npm sont conservées. Le [guide](code-guide.md#programmation-locale-dune-intervention-issue-41-fusionnée)
explique le flux et les fichiers ; les [décisions](decisions.md) documentent règles et adaptation.
Les résultats réels et les captures du commit proposé avant fusion figurent dans la PR #49.

## Consultation des interventions intégrée

L'[issue #42](https://github.com/arthurb1348/terrimaint/issues/42) est intégrée par la
[PR #50](https://github.com/arthurb1348/terrimaint/pull/50), fusionnée le 31 octobre 2026
(commit `876b8b0a5a9dadff6bff5e0beaea7e1bd1d8cb05`, revérifié au démarrage de #51).
La consultation liste/détail Responsable est locale et publique. Six interventions fixes liées aux signalements, au matériel et aux agents existants
couvrent Planifiée, En cours, Terminée et des consignes absentes. Les noms/emplacements
ne sont pas recopiés. Recherche, statut et agent se combinent ; effectifs réels, vide et
réinitialisation sont inclus. `q`, `status`, `assignee` conservent la saisie et les critères
connus dans l'URL au retour/rechargement, sans entrée d'historique par lettre.

Le détail observe l'identifiant, y compris dans une même instance, affiche Non renseignées
ou Intervention introuvable selon le cas et lie les origines Responsable sans transmettre
les filtres aux autres domaines. Les dates restent calendaires, contrôlées à Paris/New York.
Interventions reste actif sur liste/détail et au menu mobile. Les cartes deviennent un tableau
à 960 px disponibles ; résumé et origines passent sur deux colonnes à 880 px disponibles.
Les références Figma ont été consultées en lecture seule ; les
[décisions](decisions.md) et le [guide](code-guide.md#liste-et-détail-des-interventions-issue-42-fusionnée)
documentent les adaptations et le parcours manuel.

La route de programmation #41 et ses consignes facultatives sont conservées. Déclaration
et programmation ne modifient pas le jeu fixe ni les sources liées. Aucune gestion Agent,
API métier, persistance, permission, notification ou dépendance ajoutée ; PostgreSQL #38
reste différé. Les contrôles et captures du commit proposé avant fusion figurent dans la PR #50.

## Harmonisation UX intégrée

L'[issue #51](https://github.com/arthurb1348/terrimaint/issues/51) est intégrée par
la [PR #52](https://github.com/arthurb1348/terrimaint/pull/52), fusionnée le 31 octobre 2026. Elle reprend le retour validé
d'Arthur : Basse/Haute/Urgente, valeur `low` inchangée ; actions principales pleines et
secondaires à contour, sans soulignement ; retours fléchés avec libellé et liens explicites ;
teinte très légère des cartes et résumés. Les styles communs remplacent les duplications
locales, sans refonte du shell ni changement de route, filtre ou règle métier. La navigation
Scanner à partir de 1200 px, les descriptions/consignes facultatives et les simulations
sans mutation restent inchangées. Les images/photos restent pour #43.

Les prototypes Figma ont été lus en lecture seule. Le traitement des retours provient de
la revue utilisateur, sans annoncer une nouvelle maquette Figma validée. Les
[décisions](decisions.md) et le [guide](code-guide.md#harmonisation-ux-issue-51-fusionnée)
expliquent les choix, les fichiers à modifier et la procédure manuelle. Les contrôles et
captures du dernier commit proposé sont rapportés dans la PR ; Arthur garde la validation
humaine et la fusion.

L'échec historique [Responsive après #49](https://github.com/arthurb1348/terrimaint/actions/runs/41187204526)
a été examiné avant modification. Les 20 répétitions à 320 px passent, mais une observation
temporaire relève un décalage d'actualisation entre URL/champ et lien dans chacun des vingt
cas, suivi d'une convergence exacte sans perte de saisie constatée. Le test attend désormais
chemin et `q` décodé du lien via `expect.poll`, en conservant tous les espaces, le clavier et
les retours. Aucun délai fixe, retry/timeout accru ou correction applicative de saisie ajouté.
Les vingt répétitions après correction passent aussi. Le diagnostic ne prétend pas établir
avec certitude la cause unique de l'exécution historique ni sa résolution définitive sur
le seul constat d'une CI verte.

Les tests responsive sont déjà **intégrés** par la
[PR #19](https://github.com/arthurb1348/terrimaint/pull/19), fusionnée le 23 octobre 2026
(commit `7b5d56fe8bf2bb588ca4205fc50f546306e5f079`). La navigation et la migration Django/DRF
sont intégrées par les [PR #16](https://github.com/arthurb1348/terrimaint/pull/16) et
[#13](https://github.com/arthurb1348/terrimaint/pull/13).
Le suivi vivant des autres travaux reste dans les [issues](https://github.com/arthurb1348/terrimaint/issues)
et [PR](https://github.com/arthurb1348/terrimaint/pulls), sans recopier une liste vite périmée.

## Contrastes accessibles intégrés

L'[issue #53](https://github.com/arthurb1348/terrimaint/issues/53), branche
`fix/53-accessible-contrast`, est intégrée par la PR #54 fusionnée. Elle sépare focus,
accent décoratif, bordures de contrôles et bordures de cartes ; le focus blanc sidebar
est conservé. Les mesures ciblent les styles réellement appliqués dans Chromium,
les fonds adjacents et les états interactifs, avec seuils sans arrondi.
Vingt scénarios ciblés sont proposés en plus des 248 existants, soit 268 au total.
Le [rapport et la procédure manuelle](contrast-accessibility.md) donnent les couleurs,
rapports, portée WCAG et limites ; les résultats d'exécution et la CI du dernier commit
sont dans la PR. Aucune image métier ajoutée : #43 reste distincte. Arthur garde la
validation humaine et la fusion.

## Images et photos intégrées

L’issue #43 est intégrée par la [PR #55](https://github.com/arthurb1348/terrimaint/pull/55),
fusionnée le 31 octobre 2026 au commit `1e87c74d51ad6c642a79f9383f12d2dda12464d2`,
vérifié par Git distant et l’API GitHub avant création de la branche #44.
Six illustrations locales de matériel, trois photos d’exemple et une sélection facultative
limitée à 3 photos de 5 Mio sont intégrées. Les fichiers restent en mémoire ; la liste
fixe n’est pas alimentée. Le [guide photos](photos-demo.md) décrit provenance, ressources,
tests, procédure et limites. Les tests photos et contrastes sont conservés pour #44.

## Scanner QR Agent intégré

L’[issue #44](https://github.com/arthurb1348/terrimaint/issues/44) est intégrée par la
[PR #56](https://github.com/arthurb1348/terrimaint/pull/56), fusionnée le 1er novembre 2026
au commit de référence ci-dessus. La page d’attente est remplacée par activation/arrêt/reprise explicites, vrai décodage jsQR
et saisie permanente. Les références sont résolues dans la source typée unique ; seuls
les identifiants reconnus ouvrent la fiche Agent. Les résultats tardifs sont invalidés,
les flux fermés, aucun média ni historique de scans conservé. Les accès #21/PR #29,
le shell, les photos et les contrastes sont préservés.

Chromium système 151.0.7922.173 ne fournit pas `BarcodeDetector` dans l’environnement
vérifié. `jsqr@1.4.0`, sans dépendance d’exécution ni script d’installation, est ajouté
avec lockfile npm ; politique de scripts et CI inchangées. Le
[guide Scanner](scanner-qr.md) décrit format/casse, sources, ressources, QR locaux,
HTTPS sur téléphone et procédure de revue. Les tests distinguent décodage réel des
PNG et capteur/permissions simulés ; aucune caméra physique n’est validée. Les résultats
locaux et les liens réels Backend/Frontend/Responsive du dernier commit sont dans la PR.
Les cases de validation humaine restent à Arthur.

## Revue Pixel #58 intégrée par #60

PR #60 fusionnée le 1er novembre 2026 à `7388912…` : liens de grandes cartes, dashboard Responsable sans raccourci Agent,
retrait des avertissements techniques répétés et erreurs Scanner encadrées. Le sélecteur
du shell, les filtres/retours, le menu Plus, le seuil Scanner et la santé réelle sur l’accueil
sont conservés. Aucun dashboard calculé ni permission nouvelle.

Lors de #60, les formulaires ne créaient aucun objet consultable ; #59 intégrée par #69
les ajoute maintenant à l’état partagé de cette branche. Aucun envoi,
notification, stockage distant ou synchronisation. Les sections historiques ci-dessus
conservent les textes d’origine ; la décision #58 déplace les limites de
l’interface vers le README et les guides. Voir [la procédure Pixel](pixel-ux.md) et les
preuves du dernier commit dans la PR. Les validations humaines restent à Arthur.

## Photos #57 intégrées par #63

Branche `feat/57-prepare-report-photos`, depuis `7388912…`, après vérification distante de
la fusion #60. Deux actions natives dans les deux espaces ; trois photos facultatives,
préparation séquentielle bornée, version préparée dans aperçu/récapitulatif/Modifier.
Entrée ≤ 24 Mio/24 MP/8 192 px par axe ; sortie JPEG ≤ 1 920 px et 1,5 Mio mesurée,
avec refus préservant saisies et fichiers valides. Annulation, résultats tardifs, suppression,
ressources, focus et double validation couverts. Le [guide photos](photos-demo.md) donne
les constantes, mesures réellement obtenues et leurs limites. Revue physique Pixel à Arthur ; #63 est fusionnée.

#57 est intégrée par #63 (`d9ad574…`). #59 est intégrée par #69 : les créations complètent
les listes en mémoire dans cette branche, avec photos conservées jusqu’au rechargement.
Aucune persistance ou backend métier. Ensuite interventions sur fiche matériel → gestion des états → #45 GPS → #46 audio → #47 dashboard → #48 stabilisation.
Aucune configuration Hosting, permission, secret ou dépendance modifiée par #57.
Les résultats CI/Responsive et URL Hosting du commit proposé sont à lire dans la PR.

## Fonctionnalités prévues et non implémentées

Le [contexte produit](project.md) documente les intentions suivantes, sans échéance
ni ordre d'implémentation engagé :

- Liste et fiches d’équipements connectées à une API métier, accès par QR code.
- Déclaration d'incidents par agent ou responsable, pièces jointes et localisation.
- Suivi/priorisation des incidents et historique partagé.
- Création, affectation et planification des interventions.
- Tableau de bord et indications de récurrence.
- Persistance PostgreSQL avec ORM et migrations Django, différée (#38) après la priorité frontend.
- Hors connexion ciblé : shell PWA, cache d'équipements, scan QR, fiches basiques,
  brouillons/photos et file IndexedDB avec reprise et dédoublonnage.
- Conteneurisation et déploiement introduits progressivement.
- IA, OCR, transcription et détection d'anomalies : extensions futures, hors prérequis MVP.

Les règles d'accès et données obligatoires restent à préciser par issue. Aucun de ces
parcours n'est annoncé comme disponible. La synchronisation de documentation externe
et de présentation est une étape future ; aucun connecteur ou automatisme n'est installé ici.

## Structure générale

| Emplacement | Rôle |
| --- | --- |
| `backend/src/terrimaint_api/` | Projet Django et application de santé DRF |
| `backend/tests/` | Tests HTTP et configuration Django |
| `frontend/src/app/` | Racine, routes, service HTTP, accueil et tests Angular |
| `frontend/public/`, `frontend/src/styles.css` | Ressources publiques et styles globaux |
| `docs/`, `docs/tasks/` | Contexte, bilan, décisions, workflow, guide et tâche Angular |
| `scripts/check.py` | Point d'entrée des contrôles Python |
| `.github/` | CI, Dependabot, modèles d'issues/PR et configurations GitHub |
| `AGENTS.md`, `README.md` | Consignes des agents et commandes de démarrage |
| `.vscode/` | Aides facultatives pour l'éditeur local |
| `pyproject.toml`, `uv.lock`, `frontend/package*.json` | Dépendances et verrouillage |

## Tests présents

- Backend : **12 cas pytest-django** dans [test_health.py](../backend/tests/test_health.py)
  et [test_settings.py](../backend/tests/test_settings.py) : contrat santé JSON, méthodes,
  routes absentes, hôtes et configuration de la clé secrète. Aucun accès DB métier.
- Frontend intégré : **268 cas Vitest dans 19 fichiers** :
  [routage et navigation](../frontend/src/app/app.spec.ts),
  [service HTTP](../frontend/src/app/core/api-health.spec.ts),
  [accueil](../frontend/src/app/home/home.spec.ts),
  [Matériel](../frontend/src/app/features/equipements/equipements.spec.ts),
  [fiches](../frontend/src/app/features/equipements/equipment-detail.spec.ts),
  [déclaration locale](../frontend/src/app/features/incidents/incident-declaration.spec.ts),
  [liste des signalements](../frontend/src/app/features/incidents/incidents.spec.ts),
  [détail des signalements](../frontend/src/app/features/incidents/incident-detail.spec.ts),
  [programmation](../frontend/src/app/features/interventions/intervention-planning.spec.ts) et
  [dates locales](../frontend/src/app/features/interventions/planning-date.spec.ts),
  [liste des interventions](../frontend/src/app/features/interventions/interventions.spec.ts) et
  [détail des interventions](../frontend/src/app/features/interventions/intervention-detail.spec.ts).
  Ils couvrent l'attente, le succès, les JSON invalides, les erreurs HTTP/réseau,
  la relance, l'annulation, le délai de cinq secondes et les routes inconnues.
  Les sept autres fichiers couvrent images, photos en mémoire, résolveur QR, caméra
  et décodeur. HTTP simulé ; aucun serveur réel requis.
- La navigation intégrée inclut URL directes et historiques, contexte partagé,
  ouverture/fermeture des menus, focus et absence de synchronisation fictive.
- Intégré par la [PR #19](https://github.com/arthurb1348/terrimaint/pull/19) :
  [configuration Playwright](../frontend/playwright.config.ts) et
  [56 scénarios navigateur de référence](https://github.com/arthurb1348/terrimaint/blob/7b5d56fe8bf2bb588ca4205fc50f546306e5f079/frontend/e2e/responsive.pw.ts),
  soit 11 pages et trois parcours de navigation/clavier dans quatre formats : 320 × 568,
  390 × 844, 768 × 1024 et 1440 × 1024. Débordement, libellés Agent, menus, toucher, focus,
  lien d'évitement et erreurs JavaScript sont contrôlés ; captures jointes au rapport.
  La santé HTTP est simulée, sans preuve d'intégration Django/proxy ou de permissions.
  La CI du dernier commit de la PR #19 (`6bf22293cdff49970a2685c4cf3327dbc6847194`)
  a été consultée : [CI réussie](https://github.com/arthurb1348/terrimaint/actions/runs/39932815516)
  et [Responsive réussi](https://github.com/arthurb1348/terrimaint/actions/runs/39932815661).
- La [PR #20 fusionnée](https://github.com/arthurb1348/terrimaint/pull/20) ajoute
  **12 cas Vitest** pour Matériel (inclus dans les 268 ci-dessus) et deux parcours Playwright
  dans quatre formats (soit **64 scénarios intégrés**). Les scénarios
  Matériel contrôlent la recherche dans les deux espaces, le résultat vide, l'effacement au
  clavier, le focus, le contexte et le débordement après saisie/effacement.
  Sa [CI réussie](https://github.com/arthurb1348/terrimaint/actions/runs/39973749045) et son
  [Responsive réussi](https://github.com/arthurb1348/terrimaint/actions/runs/39973749049) concernent
  le commit proposé `0c0fd95fec4273188992ab4d29ecd3efc23b9fe9` ; les artifacts étaient conservés
  sept jours. Ces liens historiques ne prouvent pas les contrôles d'un nouveau commit.
- La [PR #29 fusionnée](https://github.com/arthurb1348/terrimaint/pull/29) ajoute
  **huit scénarios supplémentaires**, soit **72 intégrés** :
  accès Scanner dans les deux emplacements, URL directe et clavier, seuil et redimensionnement
  dans chacun des quatre formats. Elle vérifie aussi la répartition des destinations visibles.
  Les 50 cas Vitest restent inchangés. La [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41036057026)
  et le [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41036057013) réussis
  concernent le commit proposé `6d129a072923a5de183cccb1782f9931a29d844b`, avant fusion.
  La santé HTTP est simulée dans tous les tests responsive.
- La PR #30 fusionnée ne change aucun scénario ni code applicatif. Elle vérifie
  aussi l'installation propre, l'audit, les décisions de scripts et le démarrage/rechargement
  Angular. La description de sa PR fournit les résultats du commit concerné et leurs limites.
- La PR #32 fusionnée ajoute **16 cas Vitest**, soit **66 dans cinq fichiers** :
  fiche correcte, état introuvable, changement d'identifiant dans une même instance, paramètres
  de recherche, contexte et navigation aller-retour. Les tests existants de recherche passent
  désormais par le routeur pour observer `q`.
  Elle intègre **104 scénarios Playwright**, soit 32 de plus : 15 URL de référence, dont les
  fiches valides/inconnues, et parcours clavier, accès direct, rechargement et retour dans les
  deux espaces aux quatre formats. Sa [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41059308918)
  et son [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41059308992) réussis
  concernent le commit proposé `8631d118031cfcc64e61e831cd1da517883d8689`, avant fusion.
  La santé HTTP est simulée, sans intégration réelle
  Django/proxy ni validation de permissions.
- La PR #35 fusionnée intègre **93 cas Vitest dans six fichiers** (27 de plus) et **136 scénarios
  Playwright** (32 de plus) : formulaire partagé, identifiant inconnu,
  champs vides/blancs et bornes, trois priorités, risque sans mutation, récapitulatif/modification,
  simulation, annulation et `q`, accès direct/rechargement, réinitialisation à chaque changement
  de matériel. Les parcours des deux espaces contrôlent clavier, erreurs, focus dégagé de la
  barre Agent, navigation active et débordement aux quatre formats. Les tests navigateur
  vérifient aussi l'absence de requête métier et de stockage local/session pendant le parcours.
  Sa [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41070394284) et son
  [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41070394410) réussis
  concernent le commit proposé `84a8922bc752f9f83697ba60f59e7f92f953669e`, avant fusion.
  Les résultats et limites d'exécution locale/CI sont consignés dans sa PR ; aucun appareil
  physique, backend métier, Windows ou Safari n'est validé par ces scénarios.
- La PR #37 fusionnée intègre **99 cas Vitest dans six fichiers** et **144 scénarios Playwright** :
  description vide/blanche, récapitulatif d'absence sans mutation du champ, modification
  conservant la saisie et nouveaux boutons au clavier aux quatre formats. Les tests des champs
  réellement obligatoires, des détails renseignés et des dépassements restent présents.
  Sa [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41078195812) et son
  [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41078195949) réussis concernent
  le commit proposé `54dde0d3997d0589b4c97556af8fabca6835368b`, avant fusion.
  Les résultats réels et leurs limites sont consignés dans sa PR.
- La PR #40 fusionnée intègre **127 cas Vitest dans huit fichiers** et **176 scénarios Playwright** :
  relations signalement/matériel, recherche et filtres combinés, vide/réinitialisation,
  paramètres inconnus, sélection correcte, description absente, identifiant inconnu/changé,
  retours et rechargements conservant les critères, lien Matériel sans paramètres de recherche,
  absence d'ajout depuis la déclaration et navigation active. Clavier, tableau/cartes et textes
  longs sont contrôlés dans les deux espaces aux quatre formats. Les résultats de la PR
  distinguent navigateur système local, CI et santé HTTP simulée, sans intégration Django/proxy
  réelle ni appareil physique validé. Sa [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41088844571)
  et son [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41088844560) réussis
  concernent le commit proposé `f1670865f0bafa1303b76283be115bcbcbcf672c`, avant fusion.
- La PR #49 fusionnée a intégré **176 cas Vitest dans dix fichiers** et
  **204 scénarios Playwright**, dont 26 URL de référence aux quatre formats. Le 30 octobre
  2026, lint, tests unitaires et build réussissent localement avec Node 24.21.0/npm 11.19.0.
  Les 204 scénarios réussissent en 6,7 minutes avec Chromium système **151.0.7922.173** et une
  configuration temporaire hors dépôt. L'essai standard limité au premier échec s'arrête car
  le navigateur Playwright attendu est absent (203 scénarios non exécutés par cet essai).
  Les nouveaux parcours valident notamment les jours locaux Paris/New York à horloge figée,
  les champs facultatifs, erreurs, retours, rechargement, clôture et absence d'entrée Agent.
  Les cas de composant couvrent aussi matériel absent, identifiant réutilisé et minuit passé
  au récapitulatif. Les captures mobile/tablette/ordinateur ont été relues ; la PR fournit
  les liens de CI du dernier commit et le rapport responsive. Santé HTTP simulée ; aucune
  intégration navigateur Django/proxy, appareil physique, Windows/macOS, Safari ou lecteur
  d'écran validé. La commande standard de CI reste distincte de l'essai local alternatif.
- La PR #50 fusionnée a intégré **199 cas Vitest dans douze fichiers** et **232 scénarios Playwright**.
  Les nouveaux cas vérifient relations intervention/signalement/matériel/agent, filtres et
  paramètres inconnus, compteurs, consignes absentes, retours/rechargement, dates Paris/New York,
  origines sans pollution de recherche et changements d'id dans une même instance. La
  programmation et la déclaration gardent les sources fixes inchangées. Le 31 octobre 2026,
  lint, 199 tests et build réussissent avec Node 24.21.0/npm 11.19.0. Les 232 scénarios passent
  en 5,8 min avec Chromium système 151.0.7922.173 via une configuration temporaire hors dépôt ;
  le test renforcé des simulations sans rechargement passe ensuite aux quatre formats (13,4 s).
  La commande standard locale, limitée au premier échec, s'arrête avant tout parcours : navigateur
  Playwright absent, son téléchargement étant refusé par la politique réseau (HTTP 403).
  Les captures ont été relues aux quatre formats ; la PR fournit les résultats CI et le rapport
  du dernier commit proposé. Santé HTTP simulée, sans intégration Django/proxy réelle ni appareil
  physique, Windows/macOS, Safari ou lecteur d'écran validé.
- La PR #52 fusionnée conserve **199 tests Vitest dans douze fichiers** et intègre **248 scénarios
  Playwright** (16 nouveaux parcours UX). Lint, tests et build réussissent localement avec
  Node 24.21.0/npm 11.19.0. Le parcours Matériel ciblé réussit 20/20 avant modification puis
  20/20 après synchronisation du lien à 320 px ; les deux scénarios d'observation temporaires
  hors dépôt relèvent vingt fenêtres URL/champ/lien sans perte finale. Les tests UX contrôlent
  clavier, focus, hiérarchie, soulignement, cartes, retours/filtres et autre onglet. La suite
  complète réussit **248/248 en 6,7 min** avec Chromium système ; après les dernières retouches
  visuelles, les **16 parcours UX repassent en 57,3 s**, puis les huit parcours communs aux deux
  espaces repassent en 39,8 s avec une capture supplémentaire du focus limitée à la fenêtre.
  Les captures et la CI du dernier commit figurent dans la PR. La commande
  responsive standard locale s'arrête avant tout parcours faute de navigateur Playwright ;
  la variante locale utilise Chromium système 151.0.7922.173, sans modifier le dépôt ou la CI.
- La PR #56 fusionnée intègre **268 tests Vitest dans 19 fichiers** et **328 scénarios
  Playwright** : Scanner, ressources caméra et vrai décodage des PNG avec capteur simulé.
  #58 intégrée conserve ces garanties avec **360 scénarios**, dont 32 nouveaux pour les
  surfaces de cartes, sélection du texte et erreurs QR. Les preuves du dernier commit
  proposé sont dans sa PR ; les cases humaines restent à Arthur.
- Aucun test de persistance ou de parcours métier complet présent.
- Commandes : `uv run --locked python scripts/check.py` à la racine ;
  `npm run lint`, `npm test`, `npm run build`, `npm run test:responsive` dans `frontend/`.

## CI/CD présente

- [GitHub Actions CI](../.github/workflows/ci.yml) déclenchée sur PR, push de `main`
  et lancement manuel (`workflow_dispatch`). Deux jobs indépendants sur Ubuntu 24.04.
- `Backend` : installation Python/uv, `uv sync --locked`, Ruff lint/format et pytest
  via `scripts/check.py`.
- `Frontend` : Node fixé par `.nvmrc`, `npm ci`, lint, tests et build de production.
  Artifact `frontend-build` conservé sept jours.
- Intégré par la PR #19 : workflow [Responsive](../.github/workflows/responsive.yml) séparé,
  sur PR, push de `main` et lancement manuel. Installation Chromium puis contrôle des types
  et tests Playwright. Rapport HTML, captures et traces d'échec conservés sept jours dans
  `responsive-report`. Ce contrôle est informatif, sans `continue-on-error` et sans
  modification du ruleset ; les jobs `Backend` et `Frontend` restent obligatoires.
- Dependabot propose des PR hebdomadaires pour uv et GitHub Actions ; aucune entrée npm
  n'est configurée et aucune fusion automatique n'est prévue par le workflow.
- **CD en cours — #61** : configuration Hosting et workflow réutilisable préparés en PR,
  après Backend/Frontend, avec URL `pr-N`, provenance SHA et publication de main sur live.
  Responsive reste indépendant ; aucune suite coûteuse dupliquée. Le [guide](firebase-hosting.md)
  décrit l'activation PC et le lancement d'une PR déjà ouverte, dont #60 (restée intacte).
  Aucun ID Firebase disponible ici ; aucune clé, IAM ou secret créé/modifié. Aucun
  déploiement authentifié exécuté ni preuve Pixel fournie par cette tâche.
  Build réel, tests de sécurité ciblés, actionlint et émulateur Hosting réussis ; ces
  vérifications ne prouvent pas que la publication distante fonctionne après liaison.
- Le [ruleset versionné](../.github/rulesets/main.json) prévoit `Backend` et `Frontend`.
  Lecture distante revérifiée le 2026-11-01 : [ruleset 24590632](https://github.com/arthurb1348/terrimaint/rules/24590632)
  actif sur `main`, PR et discussions résolues exigées, **Backend et Frontend obligatoires**,
  branche actualisée, historique linéaire, force pushes et suppression bloqués, aucun bypass.
  Zéro approbation tierce obligatoire ; la relecture par Arthur reste nécessaire.
  Source : [API du ruleset](https://api.github.com/repos/arthurb1348/terrimaint/rulesets/24590632).
  Le fichier local ne suffit pas à prouver les réglages distants ; cette lecture est datée.
- Les résultats de CI sont attachés à chaque commit/PR : une configuration présente ne
  prouve pas une exécution réussie. Les résultats de la PR #19 sont liés ci-dessus ;
  chaque nouveau commit demande sa propre vérification.

## Prévisualisations Hosting #61 intégrées par #62

La PR #62 est fusionnée au commit `797ebc2…`, présent dans la base de #57.
Hosting est activé par Arthur ; il héberge uniquement le frontend. Pour chaque revue,
consulter CI et son job Firebase Hosting, puis comparer URL, SHA du résumé et `/deployment.json`.
Le [guide](firebase-hosting.md) garde la procédure initiale ; #57 ne reconfigure rien.
Backend/Frontend conditionnent la publication ; Responsive reste indépendant et requis pour la revue.

## État de la documentation

- [README](../README.md) et [README frontend](../frontend/README.md) : démarrage et contrôles.
- [project.md](project.md) : objectifs, périmètre MVP, hors connexion et direction graphique.
- [decisions.md](decisions.md) : décisions durables et choix de stack.
- [workflow.md](workflow.md) : travail par issue/branche/PR, cloud/mobile et validation humaine.
- [technical-review.md](technical-review.md) : vue d’ensemble et oral CDA (certains passages historiques restent à actualiser après la migration).
- [code-guide.md](code-guide.md) : détail des fichiers présents et des configurations sans commentaires.
- [bootstrap.md](bootstrap.md) : historique/procédure du socle GitHub ;
  [tâche Angular](tasks/init-angular.md) : critères de l'incrément déjà intégré.
- Ce bilan : synthèse factuelle réutilisable, maintenue avec le dépôt.
- Aucun fichier de présentation existante n'est versionné dans le dépôt consulté ;
  son emplacement externe n'est pas établi par ce bilan. Aucun mécanisme de mise à jour
  de Google Docs/Slides, Gemini ou Apps Script présent ou ajouté.

## Décisions techniques et prochaines étapes

Les [décisions](decisions.md) retiennent le monorepo, Angular/TypeScript et la cible
**Django + DRF + PostgreSQL**. Django/DRF est intégré ; PostgreSQL reste futur.
SQLAlchemy/Alembic sont une ancienne orientation remplacée. PWA et hors connexion ciblé
restent futurs. Tests et sécurité sont à définir dès la conception de chaque incrément,
selon le [workflow](workflow.md), puis à vérifier en CI et en relecture humaine.

1. #58/#60, photos #57/#63 et Responsive #67/#68 sont intégrés ; la mémoire partagée #59/#69 est intégrée ; Mes interventions #70/#71 est intégrée ; relire les accès Scanner et photos grand écran #76 **en revue**, après #73 et #75 intégrées.
2. Ensuite interventions sur fiche matériel → gestion des états (fin/clôture déjà validées) → #45 GPS → #46 audio → #47 dashboard → #48 stabilisation.
3. Reprendre ultérieurement PostgreSQL #38, le modèle métier et les migrations Django,
   avec validation serveur, envoi et règles d'accès entre collectivités.
4. Prévoir la validation des entrées, l'authentification, les autorisations, les tests d'accès
   refusés, les fichiers/photos et la conservation/synchronisation hors connexion.
5. Définir l'hébergement et les contrôles d'intégration/navigateur au fil des parcours.

La priorité frontend est validée pour préparer l'oral, sans annonce de déploiement métier.
Aucune de ces protections métier n'est implémentée aujourd'hui. Le workflow responsive et ses
360 scénarios ont été intégrés par #60, puis 376 par #63. #68 les répartit en deux lots ;
#59 ajoute ses parcours sans modifier Backend/Frontend, les workflows ou les protections distantes.

## Règles de mise à jour du bilan

- Mettre à jour ce fichier dans la PR qui change un état significatif du projet.
- Relever la date et le commit de `main` audité ; vérifier code, tests, manifestes,
  lockfiles, workflows et suivi GitHub. Garder les liens vers les preuves.
- Une fonctionnalité passe à **implémenté** lorsqu'elle existe dans le code intégré ;
  préciser ses limites et les contrôles réellement observés. Une PR ouverte reste **en cours**.
- Ne conserver dans **prévu** que les intentions explicitement documentées ; supprimer
  ou corriger les statuts périmés, sans inventer de planning ou de pourcentage d'avancement.
- Distinguer les fichiers de configuration souhaités des réglages distants effectivement lus.
- Les sorties externes futures seront dérivées de ce bilan ; les corrections reviennent
  dans GitHub via une PR. La relecture humaine reste nécessaire avant intégration.
