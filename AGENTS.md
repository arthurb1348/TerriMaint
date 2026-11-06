# TerriMaint — consignes pour les agents

## Contexte et périmètre

Lire `README.md`, `docs/project.md`, `docs/project-status.md` et `docs/workflow.md`,
puis la tâche. TerriMaint est un projet de formation CDA pour les petites collectivités.
Arthur décide du produit, relit et doit pouvoir expliquer le code à l'oral.
Communiquer en français ; conserver les identifiants de code en anglais.

- Un dépôt : `backend/`, `frontend/`, `docs/`, `.github/`.
- Présent sur cette branche : socle Python/Django/DRF, accueil Angular/TypeScript et tests.
- Cible validée : Django + Django REST Framework (DRF) + PostgreSQL ; voir `docs/decisions.md`.
  PostgreSQL et les modèles métier ne sont pas encore implémentés ; SQLite sert au socle local.
  Ne pas prolonger l'ancienne orientation SQLAlchemy/Alembic.
- Frontend Angular responsive pour les rôles Agent et Responsable à développer.
  La PWA et le hors connexion ciblé restent futurs ; consulter `docs/project.md`.
- Référence UX prioritaire : les parcours de la page Prototype du fichier Figma TerriMaint
  [Agent (188:3)](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-3) et
  [Responsable (188:6)](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-6).
  Ils prévalent sur les anciennes maquettes et bibliothèques, sous réserve des décisions
  métier validées dans `docs/decisions.md`, qui priment en cas de contradiction.
- Implémenter seulement l'incrément demandé, sans abstraction spéculative ni refonte annexe.
  Consigner les décisions d'architecture durables dans `docs/decisions.md`.

## Accord de travail

1. Vérifier l'état Git et la branche ; préserver les modifications de l'utilisateur.
2. Partir du dernier `main` distant vérifié ; créer une branche par tâche
   (`feat/...`, `fix/...`, `chore/...`, `docs/...`).
3. Annoncer un plan court et les critères d'acceptation ; identifier risques et permissions.
4. Réaliser les modifications, contrôles et corrections nécessaires sans demander une
   autorisation à chaque étape courante. Expliquer les changements de dépendances nécessaires.
5. Pour du Python, lancer `uv run --locked python scripts/check.py` avant remise.
   Pendant le développement, cibler les tests par comportements modifiés et dépendances,
   pas seulement par fichiers touchés ; après correction, relancer les contrôles concernés.
   Élargir pour un service partagé, la navigation, les styles globaux, les dépendances
   ou un impact incertain. Avant publication frontend : lint, tests unitaires et build
   du README ; pour l'interface, parcours navigateur ciblés et revue visuelle utiles.
   La suite Responsive complète locale n'est pas systématique si la CI peut valider
   la version finale proposée. Distinguer santé HTTP simulée, intégration Django et appareil réel.
   Pour la documentation seule, vérifier faits, liens, cohérence et diff, sans ajouter
   ni exécuter de tests applicatifs artificiels. Voir la politique de validation du workflow.
6. Avec un accès GitHub configuré, les commits, la publication de la branche et l'ouverture
   d'une PR en brouillon sont autorisés. Limiter les commits à la tâche, utiliser le modèle
   de PR et lier l'issue si elle existe. Garder l'identité Git existante sans réglage global.
7. S'arrêter à une PR révisable : Arthur choisit la fusion et le déploiement.
   Ne jamais contourner les protections ni modifier les permissions pour finir une tâche.
8. Rapporter le résultat, les fichiers importants, les vérifications réellement exécutées
   et leurs limites, ainsi qu'une explication pédagogique proportionnée.

Demander une précision pour une décision métier manquante, un élargissement de périmètre
ou une action non autorisée. Les étapes courantes et réversibles ne demandent pas de pause.
Le bootstrap initial pouvait créer le premier commit sur `main` ; il est terminé.

## Validation et sobriété des sorties

- Suivre la [politique locale et CI](docs/workflow.md#validation-locale-et-ci).
  Avant fusion, vérifier les résultats réels de Backend, Frontend, des deux lots Responsive,
  du rapport commun et du contrôle final, avec les commits contrôlés et différences de source.
  Une réussite locale partielle ne remplace pas la CI complète ; si elle est indisponible
  ou incomplète, garder la PR en brouillon et expliquer ce qui manque. Arthur valide et fusionne.
- Après réussite, ne pas relancer sans modification susceptible d'affecter le contrôle,
  nouvel échec ou doute concret. Une retouche documentaire seule ne justifie pas une suite
  applicative locale. Vérifier normalement la nouvelle CI requise après actualisation de branche.
  Réserver les suites complètes locales au diagnostic, à l'intégration ou à l'absence de CI exploitable.
- Conserver les journaux complets en fichiers temporaires ou artifacts ; présenter seulement
  commande, code de sortie, résultats et avertissements pertinents. En échec, extraire les
  erreurs avec le contexte nécessaire et conserver l'accès au journal complet. Ne jamais
  masquer un échec par redirection ou filtrage. Espacer les consultations CI selon la durée
  habituelle ; limiter les relectures de fichiers connus et inchangés, en respectant les consignes.
- Cette politique ne réduit aucun test CI selon les chemins modifiés et ne change ni tests,
  couverture, assertions, retries, timeouts, workflows, sharding, dépendances, permissions,
  ruleset ni Firebase. Ne pas annoncer de gain chiffré de tokens sans mesure ; distinguer
  temps de calcul, attente et contexte consommé par l'agent.

## Politique de commentaires

Cette politique s'applique aux prochaines tâches Codex ; elle ne demande pas de nettoyer
les commentaires du code existant dans une PR documentaire.

- Rendre le code lisible d'abord par des noms explicites et des fonctions bien structurées.
- Les commentaires, en français, expliquent le **pourquoi** plutôt que paraphraser le **quoi**.
- Conserver les explications utiles sur les règles métier, la sécurité, les contraintes
  techniques, les compromis et les comportements non évidents ; corriger celles devenues fausses.
- Placer les explications pédagogiques longues dans `docs/` : la revue technique pour la
  vue d'ensemble, le guide du code pour les détails de fichiers et configurations.
- Ne pas ajouter automatiquement un commentaire à chaque fonction, classe, fichier ou bloc.
- Ne pas supprimer les docstrings ou commentaires nécessaires aux contrats publics,
  notamment paramètres, résultats, erreurs et effets de bord utiles à l'appelant.
- Pour les formats sans commentaires comme JSON, documenter les clés utiles dans
  `docs/code-guide.md`. Une tâche limitée aux commentaires conserve le comportement.

## Source de vérité et validation pédagogique

- GitHub est la source de vérité. Maintenir `docs/project-status.md` dans les PR qui changent
  significativement l'état ; distinguer code intégré, travail en cours et prévu.
- Le workflow fonctionne depuis cloud/mobile et PC ; VS Code local reste facultatif.
  Respecter branche → PR → contrôles → relecture → fusion par Arthur.
- Chaque PR significative suit le compte rendu de `docs/workflow.md` : résultat, fichiers,
  fonctionnement, circulation des données si pertinente, choix, tests, endroits à modifier,
  points à maîtriser et deux à trois questions de compréhension.
- Une CI verte ne vaut pas validation humaine. Ne pas cocher pour Arthur les critères
  d'acceptation ou sa compréhension. Le code assisté reste compréhensible et maintenable.

## Qualité, sécurité et relecture

Appliquer le cycle de `docs/workflow.md` : critères d'acceptation → risques et permissions
→ implémentation avec tests adaptés → vérification de la CI et relecture de la PR.

- Tester les comportements observables et les échecs importants, sans recopier l'implémentation.
  Ne jamais supprimer des tests ni affaiblir la CI pour obtenir du vert.
- Les jobs `Backend` et `Frontend` existent et sont obligatoires dans le ruleset actif
  vérifié le 16 octobre 2026 ; relire GitHub si leur état doit être confirmé ultérieurement.
- Pour les futurs parcours métier, prévoir validation serveur, authentification, autorisations,
  isolation entre collectivités et tests des accès refusés, y compris par identifiant direct.
- Définir les limites de fichiers/photos (type, taille, accès, stockage) et la gestion des
  données hors connexion (conservation, déconnexion, reprise, conflits et doublons).
- Ces protections métier ne sont pas présentes dans le socle actuel. Ne pas les annoncer
  comme acquises parce que Django/DRF les rend possibles.
- Garder les secrets dans une configuration locale ignorée et utiliser des données fictives.
- En relecture, privilégier exactitude, autorisations, intégrité des données et régressions.
  Vérifier les frontières de rôles/collectivités et les effets des pertes réseau et reprises
  lorsqu'ils seront implémentés. Réserver le formatage aux outils automatisés.
