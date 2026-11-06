# TerriMaint

**Du terrain à la décision.**

Application de suivi de maintenance pour les petites collectivités : signaler un incident,
consulter un équipement et organiser les interventions avec un historique partagé.
Projet fil rouge de formation Concepteur Développeur d'Applications.

## État du projet

Le [bilan projet versionné](docs/project-status.md) distingue l'état réel, les travaux en cours
et les intentions documentées, avec leurs sources. GitHub constitue la source de vérité.

Socle initial : API Django/DRF minimale, tests HTTP, Ruff, dépendances gérées par uv,
CI GitHub Actions, modèles d'issues et de pull requests, consignes Codex et configuration VS Code.
Le frontend Angular strict et standalone fournit un accueil responsive avec l'état de l'API.
Le socle utilise Django + Django REST Framework ; PostgreSQL et les fonctions métier
restent à développer par petites tâches. La PWA et le hors connexion
ciblé ne sont pas encore implémentés. Voir les [décisions techniques](docs/decisions.md).
L'endpoint de santé vérifie que l'API répond ; il ne vérifie pas de base de données.

## Installation

Prérequis : Git, Python 3.12, [uv](https://docs.astral.sh/uv/getting-started/installation/),
Node **24.21.0 LTS** (`.nvmrc`) et npm **11.19.0**. Le frontend utilise Angular **22.2.1**,
TypeScript **6.0.3** et Vitest. `uv.lock` et `frontend/package-lock.json` fixent les dépendances.
Depuis la racine du dépôt, dans un terminal local ou un environnement cloud disposant
des prérequis (VS Code est facultatif) :

```sh
uv sync --locked
uv run pre-commit install
uv run --locked python scripts/check.py
```

Avec VS Code, choisir l'interpréteur de `.venv`. Les hooks locaux se réinstallent après chaque clone.
Ils corrigent et formatent les fichiers Python au commit ; si des fichiers sont corrigés,
relire le diff, les ajouter à nouveau puis relancer le commit.

## Démarrer l'API

```sh
uv run --locked python backend/manage.py runserver
```

- Santé de l'API : <http://127.0.0.1:8000/api/v1/health>

La configuration par défaut est réservée au développement local. Les variables sont
présentées dans [.env.example](.env.example) ; Django ne charge pas ce fichier automatiquement.
Définir les variables dans le terminal ou l'environnement cloud. `DJANGO_DEBUG=false`
désactive le débogage et exige une `DJANGO_SECRET_KEY` propre à l'environnement ;
`DJANGO_ALLOWED_HOSTS` accepte une liste d'hôtes séparés par des virgules.
SQLite est configuré localement dans `backend/db.sqlite3` (ignoré par Git) ; la santé
n'y accède pas et aucune migration n'est nécessaire pour démarrer ce socle sans modèles.
Ce serveur de développement ne définit pas un déploiement de production.

Les anciennes routes FastAPI `/openapi.json`, `/docs` et `/redoc` renvoient désormais 404.
Aucun consommateur n'a été identifié dans le dépôt ; aucun schéma ou UI de remplacement
n'est ajouté. Les détails et différences HTTP sont dans le [guide du code](docs/code-guide.md).

## Démarrer le frontend

Dans un second terminal, depuis la racine :

```sh
cd frontend
npm ci
npm start
```

Le projet limite les scripts d'installation npm à des versions examinées. Si `npm ci`
signale `ESTRICTALLOWSCRIPTS`, consulter le
[guide des dépendances et scripts](docs/code-guide.md#dépendances-frontend-et-scripts-dinstallation-npm)
avant de modifier les autorisations ; conserver Node et npm aux versions déclarées.

Ouvrir <http://localhost:4200>. Le proxy de développement transmet `/api/**` à
`http://127.0.0.1:8000` ; aucune ouverture CORS n'est nécessaire sur le backend.
La page vérifie l'API à son ouverture et au clic sur « Vérifier à nouveau ».
L'état devient indisponible après une erreur ou cinq secondes sans réponse.
Ce statut ne prouve pas qu'une base de données fonctionne.

## Vérifier le frontend

Avant publication d'une modification frontend, depuis `frontend/` :

```sh
npm run lint
npm test
npm run build
```

`npm test` lance Vitest sans mode watch et sans serveur réel. `npm run test:watch` est
disponible pour développer. Le build de production sort dans `frontend/dist/terrimaint/browser`.
La CI exécute les jobs `Backend` et `Frontend` sur les PR et sur `main`.
Les deux contrôles sont obligatoires dans le ruleset actif, vérifié sur GitHub le
16 octobre 2026 ; voir le [bilan et ses sources](docs/project-status.md).

Pendant le développement, cibler les tests par comportements et dépendances ; pour une
évolution d'interface, ajouter les parcours navigateur pertinents et une revue visuelle.
La CI complète reste à vérifier avant fusion. La
[politique de validation](docs/workflow.md#validation-locale-et-ci) précise les relances,
les changements Python et l'exception documentaire, sans suite applicative locale.

Pour un besoin de suite navigateur complète locale (diagnostic, intégration ou CI
inexploitable), les commandes restent disponibles depuis `frontend/` ; cette suite
n'est pas systématiquement requise si la CI valide la version finale proposée :

```sh
npx playwright install chromium
npm run test:responsive
npm run test:responsive:report
```

Sous Linux, `npx playwright install --with-deps chromium` installe aussi les bibliothèques
système requises. Playwright démarre Angular automatiquement ; Django n'est pas nécessaire
car la santé HTTP est simulée. Les tests couvrent les pages, les fiches Matériel, la consultation
et les filtres des signalements, la déclaration locale, la programmation en mémoire Responsable
(dates locales Paris/New York, sans persistance ni envoi métier), la consultation des interventions
avec critères dans l’URL, l’harmonisation des actions/retours/cartes et les menus en Chromium à
320, 390, 768 et 1440 px. Le [guide du code](docs/code-guide.md#tests-navigateur-responsive)
explique les vérifications et leurs limites.

Sur chaque PR, sur `main` et manuellement, le workflow **Responsive** répartit toute la suite
entre **deux jobs parallèles**, chacun
avec deux workers Playwright. La commande locale ci-dessus exécute toujours la suite entière.
Les rapports blob de chaque lot sont fusionnés dans l'artifact **responsive-report**,
conservé sept jours avec les captures et les traces d'échec ; les blobs et diagnostics portent
des noms distincts par lot. Après extraction de l'artifact commun, ouvrir `index.html`
(ou `npx playwright show-report chemin/du/rapport`). Le contrôle final **Responsive** exige
le succès des deux lots et de la préparation du rapport commun. Le
[guide Responsive CI](docs/responsive-ci.md) explique la répartition, les mesures et la revue.
Ce nouveau contrôle n'est pas ajouté aux contrôles obligatoires du ruleset : un échec reste
visible et doit être examiné avant la décision de fusion.

Pour une vérification manuelle : démarrer les deux services, constater « API disponible »,
arrêter Django puis cliquer sur le bouton pour voir « API indisponible ». Relancer l'API
et vérifier à nouveau. Tester à 375 px et au clavier : contenu sans débordement,
focus visible et libellé de statut lisible sans dépendre de la couleur.

## Scanner Agent (issue #44 intégrée)

`/agent/scanner` propose une lecture QR après clic et une
saisie manuelle toujours disponible. Le QR contient seulement une référence connue
comme `EQ-OUT-0001` ; casse ignorée et espaces de bord retirés. Les
[QR locaux](frontend/public/qr-demo/index.html) sont servis à `/qr-demo/index.html`.
Le [guide Scanner](docs/scanner-qr.md) fournit la courte procédure d’Arthur, le vrai
décodage testé et les limites. Sur téléphone, la caméra exige HTTPS avec certificat
reconnu ; une adresse LAN HTTP ne remplace pas le `localhost` de l’ordinateur.
#43/PR #55 et #44/PR #56 sont intégrées.

L’UX [#72](https://github.com/arthurb1348/terrimaint/issues/72) est **en revue** :
navbar Agent Accueil/Matériel/Interventions/Plus, carte Scanner sur l’accueil sous 1200 px,
aperçu conservé et cadre décoratif ajusté à l’image vidéo, sans recadrer le décodage.
Depuis une autre page : Accueil → Scanner. Voir le [guide PC/Pixel](docs/agent-scan-ux.md).

## Limites des parcours métier et revue Pixel

Matériel et agents restent des références locales fixes. Les signalements et interventions
sont amorcés avec les exemples, puis les confirmations ajoutent de vrais éléments **en mémoire**
depuis #59, intégrée par la PR #69. Listes, fiches, recherches et relations
partagent cet état dans le même onglet, entre Agent et Responsable. Les photos confirmées
suivent le signalement après départ du formulaire. Recharger ou fermer perd ces créations ;
les brouillons non confirmés restent abandonnés au départ. Aucun envoi métier ni notification. Aucun stockage distant,
authentification, permission serveur ni synchronisation n’est fourni. Les deux espaces
restent publics ; le contrôle réel de santé Django reste sur l’accueil général.
Ces limites sont documentées ici plutôt que répétées dans chaque écran métier.

Les ajustements Pixel [#58](https://github.com/arthurb1348/terrimaint/issues/58) sont
**intégrés par la PR #60**, fusionnée le 1er novembre 2026 (`7388912…`) : cartes avec
liens natifs, accueil Responsable simplifié, messages métier et erreurs QR identifiables.
Le [guide de revue](docs/pixel-ux.md) précise les choix et la procédure Pixel.

Les photos **#57 sont intégrées par la PR #63** : deux actions Prendre une photo / Choisir dans la galerie,
préparation locale séquentielle, 3 photos facultatives, entrées JPEG/PNG/WebP jusqu’à
24 Mio / 24 MP / 8 192 px par axe, JPEG préparés jusqu’à 1 920 px et 1,5 Mio réellement
contrôlés. Aperçu, récapitulatif et Modifier partagent la version préparée, puis #59
transfère ses URL au signalement confirmé ; aucun téléversement. Le [guide photos](docs/photos-demo.md) détaille les bornes,
mesures et limites ; caméra/galerie natives et qualité sur Pixel restent à Arthur.
Le [guide de mémoire partagée #59](docs/shared-memory.md) précise le fonctionnement intégré,
la propriété des photos et la revue PC/Pixel. Suite validée : interventions sur la fiche matériel → gestion des états → #45 GPS → #46 audio → #47 dashboard → #48 stabilisation.
Django/DRF/PostgreSQL reste la cible backend ; aucune nouvelle configuration Firebase.

La consultation Agent [#70](https://github.com/arthurb1348/terrimaint/issues/70) est **intégrée par #71** :
accès Mes interventions, aperçu de trois affectations actives au maximum, liste et détail
partagés avec Responsable. Camille Durand est l’identité de présentation ; ce filtrage
frontend ne constitue pas une autorisation serveur. Voir le [guide de revue PC/Pixel](docs/agent-interventions.md).

## Prévisualiser sur Pixel avec Firebase Hosting

La configuration de l'[issue #61](https://github.com/arthurb1348/terrimaint/issues/61)
est intégrée par la PR #62 : un canal HTTPS `pr-N` par PR interne et la publication de `main` sur `live`,
après Backend et Frontend. Hosting est déjà activé par Arthur ; aucune fusion automatique. Chaque revue doit
consulter le résultat réel du job et comparer le SHA publié dans `/deployment.json`. Responsive reste indépendant.
Le [guide Hosting](docs/firebase-hosting.md) précise les variables/secrets, la liaison
à effectuer depuis la racine sur PC, le lancement d'une PR déjà ouverte (#60), le lien
Actions et le SHA publié. Aucun backend n'est déployé : API indisponible est attendu.

## Organisation

| Dossier ou fichier | Rôle |
| --- | --- |
| `backend/src/terrimaint_api/` | Projet Django et application de santé DRF |
| `backend/tests/` | Tests du contrat HTTP et futurs tests métier |
| `frontend/` | Accueil Angular strict, routage, état de l'API et contrôles |
| `docs/` | Contexte, décisions et workflow |
| `scripts/check.py` | Une commande de vérification commune au poste local et à la CI |
| `.github/` | CI, Dependabot et modèles de suivi |
| `AGENTS.md` | Consignes de travail pour Codex |

## Développer avec Codex

Une issue précise → une branche → implémentation et contrôles → une pull request → relecture et fusion par Arthur.
Les instructions complètes sont dans [le workflow](docs/workflow.md).
Ce processus se pilote depuis mobile ou PC avec GitHub et un agent dans un environnement
cloud ou local. La relecture et la compréhension du développeur complètent les contrôles automatisés.
Les [décisions](docs/decisions.md) et le [contexte produit](docs/project.md) fixent le cadre.
La [revue technique](docs/technical-review.md) explique l'ensemble pour l'oral CDA ;
le [guide du code](docs/code-guide.md) détaille les fichiers et configurations.
Le [guide d'initialisation GitHub](docs/bootstrap.md) conserve la procédure historique du bootstrap terminé.

## Vérifier et formater

```sh
uv run --locked python scripts/check.py
uv run --locked ruff check --fix .
uv run --locked ruff format .
```

La première commande vérifie sans corriger. Les deux suivantes corrigent le lint et le format.
Dependabot propose les mises à jour dans des PR ; la fusion reste manuelle.
