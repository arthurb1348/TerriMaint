# Signalement et intervention sur un lieu — #94 intégrée par #100, #95 en revue

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

## Programmer une intervention sur le lieu (#95, en revue)

Depuis la fiche Responsable d’un signalement **Ouvert** ou **En cours**, choisir
**Programmer une intervention**. Le formulaire partagé préremplit le titre et présente
le lieu exact du signalement. Titre non blanc (120 caractères au plus), agent connu
choisi explicitement et date calendaire locale valide (aujourd’hui ou après) restent
obligatoires ; les consignes restent facultatives, limitées à 2000 caractères si renseignées.
Le lieu écrit suffit : aucune position GPS ni pièce jointe n’est requise.

Vérifier, puis Modifier conserve la saisie. Le contexte du récapitulatif montre le lieu.
Confirmer crée une seule intervention **Planifiée** et conserve le statut du signalement.
**Voir l’intervention** ouvre sa nouvelle fiche : lieu, agent et date, lien vers le
signalement, aucun lien Matériel. **Voir le signalement** retrouve les filtres d’origine,
puis Retour aux signalements retrouve la liste filtrée. Le lien d’une intervention déjà
liée sur la fiche transmet aussi ce contexte (`fromIncident`, `q`, `priority`, `status`).
Les critères du signalement ne deviennent pas des filtres d’interventions.

`Intervention` porte soit un `equipmentId` valide avec un `incidentId` facultatif,
soit un `incidentId` obligatoire sans équipement. Aucun champ `place` n’est copié :
le signalement est la seule source du lieu. Liste/recherche et détail partagés, ainsi
que l’aperçu Responsable, retrouvent ce texte via `DemoData.getIncident`.

`DemoData.canPlanIntervention` centralise l’admissibilité pour le service et l’interface.
`createIntervention` la revérifie avant tout identifiant ou mutation : origine connue,
statut Ouvert/En cours, matériel existant ou lieu non blanc borné, sans deux origines
simultanées ni matériel de repli pour un lieu. Une URL directe invalide n’affiche aucun
formulaire actif. Une clôture pendant le récapitulatif empêche aussi la confirmation.

### Scénario court téléphone

1. Dans **Agent → Signalements → Nouveau signalement**, saisir **Rue des Écoles, entrée nord**,
   **Barrière endommagée**, priorité **Urgente** ; laisser GPS et médias vides. Confirmer.
2. Sans recharger, changer d’espace vers **Responsable**, ouvrir Signalements, rechercher
   **ÉCOLES**, filtrer Urgente/Ouvert, ouvrir la fiche et programmer pour **Camille Durand**
   à la date locale du jour. Vérifier le lieu, Modifier puis confirmer.
3. Ouvrir Voir l’intervention : **Planifiée**, lieu visible et aucun lien Matériel.
   Voir le signalement : statut toujours **Ouvert**, intervention liée ; revenir à la
   liste et retrouver la recherche et les deux filtres.
4. Dans le même onglet, changer vers **Agent → Interventions**, rechercher **ÉCOLES** et
   ouvrir l’affectation de Camille : même lieu, même date, retour au signalement fonctionnel.
5. Rejouer un signalement sur équipement puis **Matériel → Programmer une intervention** :
   matériel et liens présents, retour Matériel avec sa recherche. Recharger perd les créations.

La carte de [#93](incident-map.md) reste inchangée : les coordonnées proviennent uniquement
de la position jointe, sans zoom ni pose manuelle du point.

## Contrôles et points à comprendre

Depuis `frontend/`, suivre les prérequis du README :

```sh
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:responsive -- place-planning.pw.ts place-incident.pw.ts shared-memory.pw.ts equipment-planning.pw.ts incident-interventions.pw.ts
```

Les cas du service, `place-planning.spec.ts` et `place-incident.spec.ts` couvrent le modèle, les refus sans
mutation, les bornes, les routes, les retours, le récapitulatif, Modifier, la recherche,
l’aperçu, la consultation partagée et la clôture. Un ancien fixture de formulaire photo
inclut désormais la valeur vide du contrôle Lieu ; ses assertions de préparation et
d’annulation sont conservées.

`place-planning.pw.ts` vérifie la programmation avec lieu écrit seul, ses retours, les refus
en URL directe et la consultation par l’agent affecté, dans les quatre formats et les
fuseaux Paris/New York. `place-incident.pw.ts` vérifie le parcours complet dans les quatre formats existants,
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
