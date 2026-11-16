# Contexte produit

## Besoin

TerriMaint aide les petites collectivités à relier les signalements du terrain aux décisions
de maintenance. Les incidents, les équipements et les interventions deviennent consultables
avec une traçabilité commune aux agents et au responsable.

## Parcours prioritaires

1. Agent : identifier un équipement, consulter sa fiche et déclarer un incident.
2. Responsable : consulter un incident, examiner les informations et programmer une intervention.

Le responsable doit aussi pouvoir déclarer un incident. Chaque rôle dispose d'une interface
responsive utilisable sur mobile et sur ordinateur ; le rôle ne détermine pas le type d'écran.

## Priorité validée pour l'oral de décembre 2026

La base vérifiée le 13 novembre 2026 est `5ae8095`, après fusion de la
[PR #108](https://github.com/arthurb1348/terrimaint/pull/108). Les parcours de démonstration
Agent et Responsable partagent leurs signalements et interventions en mémoire dans l’onglet :
identification QR/manuelle, fiches Matériel, déclaration avec matériel ou lieu écrit,
photos/GPS/audio facultatifs, programmation, consultation de l’agent affecté, fin
d’intervention et clôture Responsable. Les accueils, les compteurs et la page Agents
lisent ce même état. Le pied de page donne accès à Confidentialité dans les deux espaces.

Les PR fusionnées et leurs limites sont recensées en tête du [bilan](project-status.md).
La dernière passe [#48](https://github.com/arthurb1348/terrimaint/issues/48) est **en revue** :
retours et confirmations, tableaux, logo Responsable PC, validations transversales et
[guide de démonstration de six minutes](demo-oral.md). Les essais automatisés ne remplacent
ni la relecture d’Arthur ni les contrôles sur appareil réel et avec lecteur d’écran.
Les parcours restent locaux et fictifs ; recharger rétablit les exemples initiaux.
PostgreSQL ([#38](https://github.com/arthurb1348/terrimaint/issues/38)) est **différé** et ne
bloque pas ces écrans. La cible Django/DRF/PostgreSQL est conservée ; cette priorité ne
constitue pas une annonce de parcours métier connecté ou de livraison en production.

## Périmètre prévu du MVP

- Équipements et accès à leur fiche par QR code.
- Déclaration d'incidents, pièces jointes et localisation lorsque disponible.
- Suivi et priorisation des incidents ; historique.
- Création, affectation et planification d'interventions.
- Tableau de bord et indications de récurrence.

Cette liste fixe une direction. Chaque comportement, règle d'accès et donnée obligatoire
doit être précisé dans une issue avant implémentation.

## Hors connexion ciblé

Ce périmètre est futur : aucun service worker ni stockage hors connexion n’est implémenté.
Prévoir le shell de la PWA, les équipements utiles en cache, le scan QR et la consultation
basique d'une fiche, les brouillons et la déclaration d'incident avec photos.
La géolocalisation est utilisée si elle est disponible. Une file IndexedDB permettra
la synchronisation au retour du réseau, avec une stratégie explicite de reprise et de dédoublonnage.
Les actions de gestion qui exigent des données actualisées seront définies au cas par cas.

## Technologies retenues

- Cible backend : Python, Django + Django REST Framework et PostgreSQL ; ORM et migrations Django.
- Frontend : Angular et TypeScript déjà présents ; PWA à développer ultérieurement.
- Socle de cette branche : Django/DRF et pytest, configuration SQLite locale, sans modèles
  ni fonctions métier. PostgreSQL reste la cible de persistance, différée après cette priorité frontend.
- Tests et sécurité dès la conception : critères, risques, permissions et cas de refus
  à définir pour chaque incrément, selon le [workflow](workflow.md).
- Qualité : Ruff, Git/GitHub et CI ; conteneurisation et déploiement introduits progressivement.

Les [décisions techniques](decisions.md) donnent les raisons et distinguent cible et existant.
Python maintient la cohérence avec la trajectoire Data/IA d'Arthur. Java/Spring reste étudié
pendant la formation. Les fonctions IA, OCR, transcription ou détection d'anomalies
sont des extensions futures : elles ne sont pas des prérequis au MVP.

## Interface

Direction graphique : Inter, Source Serif 4, vert `#234E3F`, accent `#C3823E`,
surfaces `#E4ECE8` et `#F5F5F5`. Les maquettes et les adaptations UX validées par Arthur guident chaque tâche d'interface.
Accessibilité et lisibilité sur le terrain font partie des critères du parcours.
