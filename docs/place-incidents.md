# Signalement sans équipement — #94, en revue

## Revue sur la preview

Dans le même onglet, ouvrir **Agent → Signalements → Nouveau signalement**.

1. Vérifier sans lieu, puis avec des espaces seuls : refus et focus sur Lieu. Après un
   lieu valide, vérifier l’intitulé puis la priorité obligatoires. La description, les
   photos, la note vocale et le GPS restent facultatifs.
2. Saisir par exemple **Barrière endommagée**, lieu **Rue des Écoles, entrée nord**, priorité
   **Urgente**. Ajouter éventuellement une photo, une note vocale et une position.
   Vérifier le signalement : le récapitulatif montre le lieu. Modifier retrouve exactement
   la saisie et les médias ; modifier le repère écrit puis confirmer.
3. La confirmation propose Voir le signalement et Retour aux signalements. Le détail
   indique le lieu, sans matériel inventé. Sans GPS, aucune carte ; avec GPS, le composant
   de #93 conserve les coordonnées et charge le fond seulement sur Afficher la carte.
4. Revenir à la liste et rechercher **ÉCOLES** : le lieu est recherché sans distinction
   de casse. Passer à **Espace Responsable** via le menu, sans recharger. L’aperçu du
   tableau de bord inclut ce signalement urgent et son lieu. Ouvrir sa fiche, annuler une
   clôture, puis clôturer et confirmer : le statut devient Clôturé dans les deux espaces.
5. Refaire sans position et avec la permission GPS refusée : le lieu écrit suffit à
   poursuivre. Sur téléphone et PC, vérifier les libellés, le focus et l’absence de débordement.
6. Rejouer **Matériel → Tondeuse autoportée → Faire un signalement** : aucun lieu à saisir,
   matériel identifié, mêmes médias, récapitulatif et confirmation. Retour à la fiche
   conserve la recherche Matériel ; Voir le signalement ouvre la nouvelle fiche.

Les créations n’existent que dans l’onglet courant. Recharger rétablit les exemples et
rend une ancienne URL locale introuvable. Une priorité basse peut ne pas apparaître dans
l’aperçu limité aux trois signalements les plus prioritaires ; elle reste dans la liste.
Le [résumé Firebase](firebase-hosting.md) de la PR donne le lien de revue et le commit publié.

## Modèle et validation

`Incident` combine ses métadonnées avec une union exclusive : `equipmentId: string`,
ou `place: string`. Le second champ est absent dans chaque variante. Aucun équipement
fictif, référence vide ou identifiant technique n’est créé pour représenter un lieu.

`DemoData.createIncident` revalide les données avant toute mutation :

- Avec une référence matériel fournie, elle doit être connue et aucun lieu ne doit être
  renseigné. Une référence inconnue ou vide reste une erreur, même accompagnée d’un lieu.
- Sans référence, un lieu contenant au moins un caractère autre qu’un espace est requis.
  La limite partagée formulaire/service est **200 caractères** ; elle porte sur la saisie
  complète, comme l’intitulé. Le contenu exact est conservé pour Modifier et la consultation.
- Intitulé, description, priorité et médias conservent leurs validations. La nouvelle
  entrée est immuable et **Ouverte** ; les photos/audio confirmés passent au service selon
  leur propriété existante. Les coordonnées facultatives sont validées, copiées et figées.

La clôture existante s’applique aux signalements Ouverts/En cours côté Responsable.
Le rôle présenté reste une convention frontend, sans autorisation serveur.

## Formulaire et navigation

`/agent/incidents/nouveau` est déclarée **avant** `/agent/incidents/:id`. Sa donnée de
route `placeIncident` active le mode sans matériel du **même** `IncidentDeclaration`.
L’absence d’équipement sur une ancienne route ne déclenche jamais ce mode implicitement.
Un identifiant matériel inconnu continue à afficher Équipement introuvable.

Les liens Annuler et Retour aux signalements conservent les filtres de la liste d’origine.
Après confirmation, Voir le signalement ouvre sa fiche sans imposer ces filtres.
Depuis un matériel, les destinations et `q` restent ceux de la fiche matériel. Les brouillons
sont effacés au départ ; les réponses média/GPS tardives ne sont pas transférées à une
autre déclaration. Aucun stockage durable ou envoi HTTP métier ajouté.

`Incidents` recherche aussi `place` et présente la colonne **Matériel ou lieu** ; les cartes
mobiles précisent Lieu ou Matériel. Le détail montre Lieu du signalement, et l’aperçu
Responsable utilise ce libellé au lieu d’afficher Matériel introuvable. Les tris, compteurs,
filtres, états et relations des signalements sur matériel sont conservés.

## Limite volontaire : interventions et carte

La programmation sur un lieu reste réservée à **#95**. Aucun lien de programmation
n’est présenté sur ces fiches. Une URL directe explique l’indisponibilité sans formulaire ;
le service refuse aussi une programmation de ce signalement, même avec un matériel de repli.
La carte de [#93](incident-map.md) est réutilisée telle quelle : aucune nouvelle commande
de zoom ni pose manuelle du point. Les coordonnées proviennent uniquement de la position jointe.

## Contrôles et points à comprendre

Depuis `frontend/`, suivre les prérequis du README :

```sh
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:responsive -- place-incident.pw.ts shared-memory.pw.ts location.pw.ts
```

Les nouveaux cas du service et `place-incident.spec.ts` couvrent le modèle, les refus sans
mutation, les bornes, les routes, les retours, le récapitulatif, Modifier, la recherche,
l’aperçu, la consultation partagée et la clôture. Un ancien fixture de formulaire photo
inclut désormais la valeur vide du contrôle Lieu ; ses assertions de préparation et
d’annulation sont conservées.

`place-incident.pw.ts` vérifie le parcours complet dans les quatre formats existants,
avec GPS absent/refusé/joint. Il utilise une vraie image préparée et un vrai enregistrement
issu d’une source sonore synthétique ; il contrôle leur conservation et leur lecture après
confirmation. Le fond est une réponse locale interceptée, sans disponibilité OSM requise.
Les tests existants de mémoire partagée rejouent la déclaration sur matériel et sa
programmation ; ceux de localisation couvrent aussi retrait et réponses tardives.
La PR consigne résultats locaux, sources de CI et résumé Firebase. Les formats émulés
ne constituent pas un essai Pixel physique ni une intégration métier Django.

Pour modifier la borne : `INCIDENT_PLACE_LIMIT` dans `incident.ts`. Pour les règles,
relire `DemoData` avec le formulaire ; pour l’affichage, liste/détail/tableau de bord.
La différence à maîtriser est entre origine écrite (`place`) et coordonnées GPS : la
première est obligatoire dans ce parcours, les secondes enrichissent facultativement le signalement.
