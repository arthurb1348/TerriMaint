# Démonstration orale — 6 minutes

## Avant de commencer

Ouvrir la preview HTTPS de la PR présentée depuis le résumé du job Firebase Hosting.
Comparer son `/deployment.json` au **SHA de tête indiqué dans la PR** ; ne pas utiliser
une ancienne preview ou `live` comme preuve de cette version. Les liens vers Backend,
Frontend, les deux lots Responsive, le rapport commun et le contrôle final sont dans la PR.
Télécharger le rapport commun avant son expiration (sept jours) pour préparer l’oral.
Les observations Pixel restent à compléter par Arthur selon la [revue #48](stabilization-review.md).

Garder **un seul onglet** pour changer d’espace avec le menu de l’en-tête. Recharger
une seule fois avant la présentation pour retrouver les six signalements et six interventions
initiaux. Les créations, modifications de statut et médias sont perdus au rechargement
ou à la fermeture. Préparer un second écran avec `/qr-demo/index.html` pour le QR, ou
utiliser la saisie manuelle `EQ-OUT-0001`. Aucun capteur n’est indispensable au scénario.

En local : Git, Python 3.12/uv, Node 24.21.0 et npm 11.19.0 ; suivre le [README](../README.md).
Depuis la racine : `uv sync --locked`, puis `uv run --locked python backend/manage.py runserver`.
Dans un autre terminal : `cd frontend`, `npm ci`, `npm start`. Ouvrir `http://localhost:4200`.
Le proxy `/api/**` joint Django sur 8000 ; **API disponible** vérifie seulement la santé HTTP,
sans accès à une base métier. Sur Firebase, seul le frontend est publié : API indisponible
est attendu. Les données métier de la démo ne viennent pas de Django.

## Fil conducteur chronométré

| Temps | Pages et actions | Ce qu’il faut expliquer |
| --- | --- | --- |
| 0:00–0:35 | Accueil général, puis Espace Agent. | « TerriMaint relie un constat de terrain à une intervention. Je présente une démo frontend ; les deux espaces sont publics. » Distinguer santé HTTP et données métier. |
| 0:35–1:10 | Sur téléphone : Scanner → saisir `EQ-OUT-0001` → Ouvrir la fiche. Sur PC : Matériel → chercher `tondeuse` → Tondeuse autoportée. | Le QR contient une référence, pas une autorisation. La saisie manuelle fournit une alternative à la caméra ; le Scanner est masqué dans la navigation dès 1200 px, sa route reste accessible. |
| 1:10–2:05 | Faire un signalement. Intitulé **Lame à contrôler**, priorité **Haute**, description laissée vide. Vérifier → Modifier → Vérifier → Envoyer. Voir le signalement. | Champs obligatoires, médias facultatifs, un seul retour contextuel. Le risque déclaré n’immobilise pas le matériel. La confirmation ajoute le signalement à la mémoire partagée de l’onglet. |
| 2:05–2:45 | Accueil Agent → Nouveau signalement. Lieu **Rue des Écoles, entrée nord**, intitulé **Barrière endommagée**, priorité **Urgente**. Confirmer → Voir le signalement. | Un lieu écrit suffit, sans équipement ni GPS. Revenir à l’accueil montre la nouvelle déclaration en tête des deux derniers signalements. Passer à Responsable sans recharger. |
| 2:45–3:45 | Tableau de bord → urgents → Barrière endommagée → Programmer une intervention. Titre **Réparer la barrière**, agent **Camille Durand**, date **aujourd’hui**. Vérifier → Programmer → Voir l’intervention. | Les compteurs dérivent des mêmes données. La date est calendaire locale. L’intervention est Planifiée ; le signalement conserve son statut Ouvert. Le lieu vient du signalement, aucun lien Matériel fictif. Voir le signalement retrouve les filtres. |
| 3:45–4:30 | Responsable → Agents → Camille → Voir ses interventions. Puis Espace Agent → Mes interventions → Réparer la barrière. | Les compteurs Agents résument Planifiées et En cours ; le filtre `assignee` de la liste Responsable inclut aussi les terminées. Agent présente Camille, sans authentification. Les espaces partagent l’état du même onglet. |
| 4:30–5:15 | Agent → Mes interventions → **Vérification du plateau de coupe** (`INT-2026-035`) → Intervention terminée. Voir le signalement (`INC-2026-048`). Passer à Responsable → Signalements → rechercher `Vibration` → Clôturer → confirmer. | Utiliser cet exemple initial **En cours** : la démo ne permet pas de démarrer la nouvelle intervention Planifiée. Terminer ne clôture pas le signalement automatiquement. Clôturer relève du parcours Responsable ; historiques et compteurs suivent l’état partagé. |
| 5:15–6:00 | Responsable → Matériel → Tondeuse → Programmer une intervention (montrer le formulaire puis retour). Ouvrir Confidentialité en bas de page. | Autre origine de programmation : le matériel seul. Rappeler permissions au clic, stockage en mémoire et futurs contrats serveur. Finir sur ce qui fonctionne et ce qui reste à construire. |

Option si 30–45 secondes restent : ouvrir le signalement initial `INC-2026-045`, qui porte
une position **fictive**. Avant Afficher la carte, pas de tuiles ; au clic, requêtes HTTPS
vers OpenStreetMap dont les indices révèlent la zone. En cas de panne, coordonnées et
autres actions restent disponibles. Ne pas présenter ce point comme la position du téléphone.
L’acquisition GPS d’un nouveau signalement et les médias sont des variantes à préparer hors chrono.

## Repli sans caméra, micro ou GPS

Utiliser la référence manuelle du Scanner ou la recherche Matériel. Ne joindre ni photo,
ni note vocale, ni position : intitulé/priorité et, sans équipement, lieu écrit suffisent.
Un refus de permission ne bloque pas cette déclaration. Les photos peuvent aussi venir
du sélecteur de fichiers. Ne pas passer du temps à changer les réglages de l’appareil
pendant l’oral ; expliquer le repli et poursuivre.

## Code à savoir expliquer au jury

- **Routes et composants** : `app.routes.ts` partage formulaires et fiches entre espaces.
  La route `incidents/nouveau` précède `incidents/:id`. Une URL publique n’accorde aucun droit.
- **État réactif** : `DemoData` expose des signals en lecture seule ; ses méthodes créent
  ou remplacent les objets. Les `computed` des accueils, listes et Agents recalculent sans
  rechargement. Les sources `DEMO_*` typées amorcent l’état, elles ne sont pas une base.
- **Relations et filtres** : les identifiants relient matériel, signalement, intervention
  et agent. Un lieu d’intervention est résolu depuis son signalement. Les paramètres d’URL
  conservent recherche/filtres et contexte de retour, sans ajouter une seconde copie du lieu.
- **Validation** : formulaires et service refusent les origines invalides, les titres vides,
  les agents inconnus et les dates passées. Ces contrôles facilitent la démo ; le futur serveur
  devra revalider les entrées et appliquer authentification, rôles et isolation des collectivités.
- **Ressources** : demandes de capteurs au clic, arrêt des pistes caméra/micro, invalidation
  des réponses tardives et révocation des URL temporaires au départ/retrait. Les médias confirmés
  suivent le signalement jusqu’au rechargement. Voir les guides [photos](photos-demo.md),
  [Scanner](scanner-qr.md) et [carte](incident-map.md).

Deux tests à montrer : `core/demo-data.spec.ts`, cas **« programme un lieu depuis son
signalement puis refuse la programmation après clôture ou avec un matériel de repli »**
(invariant avant mutation), et
`e2e/place-planning.pw.ts`, **« Lieu écrit seul… »** (navigation réelle Chromium dans les
deux espaces, retours filtrés et affectation). Vérifier les intitulés dans la version présentée.

Questions possibles : pourquoi un `computed` évite-t-il des compteurs désynchronisés ?
Pourquoi la validation Angular ne remplace-t-elle pas l’autorisation serveur ? Pourquoi
changer d’espace dans l’onglet conserve-t-il les créations, contrairement à recharger ?

## Suite du projet

Django/DRF/PostgreSQL reste la cible ; PostgreSQL #38 est différé. API métier, persistance,
authentification, permissions et isolation des collectivités, notifications, synchronisation,
PWA/hors connexion restent à réaliser. Profil reste une page d’attente. Aucun succès de test
ou de santé HTTP n’établit ces capacités. La relecture et la fusion appartiennent à Arthur.
