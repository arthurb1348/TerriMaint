# Mes interventions — issue #70, en revue

Base vérifiée le 6 novembre 2026 : `8415eb7f467fd53cd9b6920252a75608e8038618`,
avec [#69](https://github.com/arthurb1348/terrimaint/pull/69) fusionnée (mémoire partagée #59).
Cet incrément ajoute la consultation Agent ; il reste en revue jusqu’à fusion.

## Données et présentation

`core/presented-agent.ts` désigne une seule fois Camille Durand (`AG-DEMO-001`) depuis
le référentiel existant. « Pour Camille Durand » indique qui est présenté, sans connexion
simulée. Aucun sélecteur de compte ni stockage ajouté.

Responsable programme avec `DemoData.createIntervention`. Le même service racine publie
la collection réactive ; accueil, liste et détail Agent la relisent dans le même onglet.
Une création affectée à Camille apparaît immédiatement, une autre reste uniquement dans
la consultation Responsable. Les objets conservent leurs identifiants de relations :
intervention → signalement → matériel. Les noms ne sont pas copiés dans les interventions.
Recharger réinitialise les créations, conformément au [guide mémoire](shared-memory.md).

`assigned-interventions.ts` sélectionne les affectations de Camille. L’aperçu exclut les
Terminées, met les En cours avant les Planifiées, puis trie chaque groupe par date prévue
croissante. Le tri stable garde l’ordre de la collection en cas d’égalité ; la source
n’est pas triée en place. Trois résultats au maximum. Une date passée reste visible.
Les exemples initiaux de Camille sont deux interventions actives ; son filtre Terminée
est donc vide au départ. Les tests unitaires vérifient aussi des affectations terminées,
les égalités, la limite de trois et l’absence totale d’affectation.

## Composants et navigation

Les routes `/agent/interventions` et `/agent/interventions/:id` chargent les **mêmes**
composants que Responsable. Leur contexte `agentView` vient des données de route,
pas d’un paramètre utilisateur. La liste calcule résultats et effectifs sur ses affectations,
masque le filtre et la colonne Agent, garde recherche `q` et `status` dans l’URL.
`assignee` est ignoré dans ce contexte, puis exclu des liens et des mises à jour de filtres.
Responsable conserve ses trois critères et toutes les affectations.

Les liens natifs de retour, matériel et signalement utilisent le contexte de route.
Un autre identifiant suit la collection réactive ; un identifiant inconnu donne
« Intervention introuvable ». Une affectation étrangère donne « Intervention non assignée »,
avec retour à la liste, sans titre, consignes ni liens métier de cette fiche.
La liste distingue aucune affectation et aucun résultat pour les critères.

**Filtrer l’affichage n’est pas autoriser un accès.** Tout le jeu fictif est livré au
navigateur et les espaces restent publics. Le futur backend devra déterminer l’identité
authentifiée et contrôler chaque accès, y compris par identifiant direct et collectivité.
Cette présentation locale n’est pas une protection serveur.

L’accueil conserve Matériel, Incidents et Scanner (masqué à partir de 1200 px), ajoute
Mes interventions et l’aperçu. Barre basse, menu Plus et navigation principale restent
inchangés ; accéder à Mes interventions se fait depuis l’accueil ou par URL.
Les règles existantes restent partagées : cartes sous 960 px disponibles, tableau au-delà,
statuts textuels et focus. Le shell Agent garde sa largeur de lecture maximale de 768 px ;
sa liste reste donc en cartes aux quatre formats actuels, tandis que Responsable utilise
le tableau sur grand écran. Aucun élargissement du shell n’est ajouté.

## Revue PC et Pixel par Arthur

1. Ouvrir la preview et comparer `/deployment.json` au SHA en tête de la PR. Sur PC,
   essayer 1440 px puis 320/390/768 px ; sur Pixel, utiliser Chrome et le même canal HTTPS.
2. Accueil Agent : nom, ordre En cours/Planifiée, dates passées, Scanner et accès préservés.
   Avec Tab/Entrée sur PC, ouvrir Mes interventions puis une fiche ; vérifier le contour
   de focus, les cartes/tableau et l’absence de défilement horizontal.
3. Rechercher « Tondeuse », filtrer En cours, recharger, ouvrir et revenir : critères conservés.
   Essayer Terminée, réinitialiser ; distinguer vide de recherche et absence d’affectations
   (ce dernier état est couvert par fixture unitaire, sans outil de modification dans l’UI).
4. Ouvrir `/agent/interventions?assignee=AG-DEMO-002`, puis
   `/agent/interventions/INT-2026-033` et `/agent/interventions/inconnue` : Camille reste
   l’agent présenté et les états explicites permettent le retour. Les liens d’une fiche
   assignée restent dans `/agent`.
5. Responsable → signalement ouvert → programmer pour Camille. Changer d’espace via le
   menu, sans recharger : la nouvelle fiche apparaît dans la liste et l’aperçu (troisième
   place avec les exemples). Programmer pour Alex : elle n’apparaît pas chez Camille ;
   Responsable garde les deux créations. Recharger perd les créations de cet onglet.
6. Rejouer une création de signalement avec photo et consulter depuis l’autre espace.
   Vérifier visuellement lisibilité et toucher sur Pixel ; les tests automatisés ne
   remplacent pas un essai réel. Les onglets et appareils ne se synchronisent pas.

## Vérifications et suite

Les preuves et liens de CI du **dernier commit proposé** sont dans la PR : lint, Vitest,
build, parcours Responsive sur quatre formats, deux lots et HTML commun. Les nouveaux
parcours couvrent URL, clavier, focus, débordement, relations et créations entre espaces ;
les mesures de contraste utilisent les couleurs effectivement rendues. Les parcours
Responsable, mémoire/photos et Scanner préexistants restent exécutés.
La santé HTTP est simulée dans Playwright ; ce n’est pas une intégration backend métier.

Ordre validé : **Mes interventions → interventions sur la fiche matériel → gestion des états
→ #45 GPS → #46 audio → #47 dashboard → #48 stabilisation**.
La décision de fin/clôture dans [decisions.md](decisions.md) est conservée : l’agent termine
directement ; le responsable résout le signalement ou programme une nouvelle intervention,
et la clôture reste empêchée tant qu’une intervention liée est active. Rien de cela n’est
implémenté ici. Pas d’ajout sur fiche matériel, dashboard, GPS, audio, logo, footer ou photo PC.

Questions de compréhension :

1. Pourquoi ignorer `assignee` côté Agent ne protège-t-il pas les données sur un serveur ?
2. Pourquoi une programmation apparaît-elle sans recharge, puis disparaît-elle après recharge ?
3. Comment les mêmes composants gardent-ils des liens Agent et Responsable différents ?
