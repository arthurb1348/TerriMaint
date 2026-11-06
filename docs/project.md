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

Arthur privilégie la réalisation rapide des parcours frontend pour préparer son oral de
décembre 2026. La liste et le détail des signalements de l'[issue #39](https://github.com/arthurb1348/terrimaint/issues/39)
sont intégrés par la PR #40 fusionnée, avec priorité à la présentation Responsable et composants
partagés avec Agent. La programmation simulée depuis un signalement Responsable de
l'[issue #41](https://github.com/arthurb1348/terrimaint/issues/41) est intégrée par la
[PR #49](https://github.com/arthurb1348/terrimaint/pull/49), fusionnée le 31 octobre 2026.
La consultation d'un jeu fixe d'interventions de l'[issue #42](https://github.com/arthurb1348/terrimaint/issues/42)
est intégrée par la [PR #50](https://github.com/arthurb1348/terrimaint/pull/50), fusionnée le
31 octobre 2026. Les créations en mémoire de #59 (intégrée par #69) complètent ce jeu. L'[issue #51](https://github.com/arthurb1348/terrimaint/issues/51)
porte l’harmonisation UX intégrée par la PR #52 : Basse/Haute/
Urgente, actions hiérarchisées sans soulignement, retours fléchés avec libellé et cartes légèrement
teintées. C'est l'incrément **4/10**, après ajout de ce retour utilisateur au programme initial.
Les contrastes #53/PR #54 sont intégrés. Les images/photos #43 sont intégrées par la [PR #55](https://github.com/arthurb1348/terrimaint/pull/55).
L’identification QR et la saisie manuelle #44 sont intégrées par la PR #56, fusionnée le
1er novembre 2026 (`5d1867a17a993f1005c87276665b29004787eab6`).
Les ajustements Pixel #58 sont intégrés par la PR #60 (`7388912…`). Les photos #57 sont intégrées par #63. La mémoire partagée #59 est intégrée par #69.
Suite : Mes interventions #70 (en revue) → interventions sur fiche matériel → gestion des états
→ #45 GPS → #46 audio → #47 dashboard → #48 stabilisation.
Le [guide Agent](agent-interventions.md) décrit cet incrément de consultation. Le
[guide #59](shared-memory.md) précise les données locales et leur perte au rechargement.
Ces parcours restent locaux et fictifs ; leurs limites sont documentées dans le README et les guides.
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
