# Données partagées dans l’onglet — #59 en revue

Base distante vérifiée le 6 novembre 2026 : `0567919…`, intégrant les photos
[#63](https://github.com/arthurb1348/terrimaint/pull/63) et le sharding Responsive
[#68](https://github.com/arthurb1348/terrimaint/pull/68), tous deux fusionnés.
Cette branche propose [#59](https://github.com/arthurb1348/terrimaint/issues/59) ; elle reste
en revue jusqu’à fusion. Django/DRF/PostgreSQL reste la cible backend. Hosting sert le frontend.

## Un état commun, des composants qui gardent leur rôle

`frontend/src/app/core/demo-data.ts` fournit `DemoData` au niveau de l’application
(`providedIn: 'root'`). Les listes, fiches et le formulaire de programmation lisent ses
signals `incidents` et `interventions` ; les méthodes `getIncident` et `getIntervention`
retrouvent les mêmes objets. Recherches, filtres, relations et effectifs existants sont
calculés depuis cet état. Aucun dashboard supplémentaire n’est implémenté.

Chaque nouvelle instance du service copie les jeux typés `DEMO_INCIDENTS` et
`DEMO_INTERVENTIONS` comme amorçage. Collections, objets et descriptions des photos sont
gelés ; les signals exposés sont en lecture seule. Les composants ne disposent ni de
`set`/`update`, ni de collections modifiables. Les sources initiales ne sont jamais mutées.
Matériel et agents restent des références statiques communes, sans nouvelle possibilité de création.

Les composants conservent formulaire, focus, navigation et affichage. À confirmation valide,
ils appellent `createIncident` ou `createIntervention`. Le service contrôle aussi les bornes,
priorités, dates et références avant de publier un nouvel état. Les listes et fiches qui en
dépendent se recalculent ; aucune copie locale d’une liste métier n’est maintenue dans un écran.
La validation de date est partagée avec le formulaire, y compris le changement de jour local.

Un signalement commence à **Ouvert**, une intervention à **Planifiée**. Programmer ne modifie
pas le statut du signalement. Une référence absente ou un signalement clôturé empêche la
programmation. Ces règles de démonstration ne constituent pas des permissions serveur.

## Confirmation, identifiants et durée de vie

Les brouillons restent dans leur composant. Vérifier/Modifier ne créent rien ; annuler,
changer de référence ou quitter libère le brouillon. La confirmation conserve l’objet créé
et quitte immédiatement l’étape de revue. Une deuxième activation ou un appel tardif de
Modifier/Confirmer ne crée aucun doublon. Revenir ouvrir un nouveau formulaire permet une
autre création volontaire ; les champs identiques ne sont pas une clé de déduplication.

Les identifiants `INC-LOCAL-…` et `INT-LOCAL-…` contiennent un UUID de l’instance d’application
et un compteur propre à chaque collection. Le compteur garantit l’unicité dans l’onglet ;
un nouvel UUID évite de réattribuer après rechargement un ancien identifiant temporaire à
un autre objet. L’UUID utilise `crypto.randomUUID`, disponible sur localhost et en HTTPS.
Les confirmations proposent un vrai lien vers la nouvelle fiche, dans le même espace.
Les retours précédents gardent leur matériel, leur signalement et leurs filtres ; les filtres
d’un domaine ne sont pas appliqués à un autre.

Navigation Angular et changement Agent/Responsable dans **le même onglet** conservent le
service. Recharger complètement ou fermer l’onglet perd les créations et rétablit l’amorçage.
Une ancienne fiche temporaire devient introuvable, avec un retour utilisable. Ni stockage
local/session, IndexedDB, service worker, écriture HTTP métier, ni synchronisation entre
onglets/appareils ne sont ajoutés. Un essai Pixel ne crée aucune donnée sur le PC.

## Qui possède les photos ?

| Moment | Propriétaire | Libération |
| --- | --- | --- |
| Fichier en attente et préparation | `IncidentPhotos`, instance du brouillon | Annulation des lectures, nettoyage des fichiers, bitmaps/canvas et rejet des résultats tardifs selon #63. |
| Photo préparée non confirmée | `IncidentPhotos`, pour son URL d’objet | Suppression, annulation, changement de matériel ou destruction du formulaire : révocation de l’URL. |
| Confirmation acceptée | `DemoData`, pour les URL attachées au signalement | Elles restent valides après départ du formulaire et changement d’espace. Le service les révoque à la destruction de l’application ; le navigateur libère aussi les URL du document lors de sa fermeture/recharge. |

Le service reçoit les descripteurs des **photos déjà préparées**, sans fichier original,
nouveau réencodage ni nouvelle URL. Après création acceptée, `IncidentPhotos.transfer()`
retire les URL de son ensemble de propriété, puis remet le brouillon à zéro. Le prochain
`clear()` du formulaire ne peut donc pas révoquer les photos du signalement. Un refus de
création ne transfère rien et laisse le brouillon intact.

Le nettoyage garde le mécanisme d’annulation et la file séquentielle de #63 : un résultat
ancien ne peut revenir dans un autre brouillon ou enrichir un enregistrement confirmé.
La confirmation reste bloquée pendant la préparation. Les photos initiales sont des assets
statiques et ne sont jamais révoquées par le service. Les créations et leurs photos occupent
de la mémoire jusqu’au rechargement ; aucune suppression métier n’est ajoutée ici.

## Tests, limites et future API

Les tests unitaires du service couvrent créations et relations, refus, absence de mutation
des constantes, collections exposées immuables, renouvellement des identifiants et propriété
des URL. Ceux des formulaires couvrent notamment double confirmation, retour au récapitulatif,
annulation, date devenue passée et préparation tardive. Horloge et UUID sont déterminisés
dans les tests du service.

`frontend/e2e/shared-memory.pw.ts` utilise de vraies images préparées : création depuis chacun
des espaces, liste/fiche, changement d’espace sans rechargement, même URL photo encore lisible,
programmation liée, agents/matériel, filtres/retours, doubles activations, puis remise à zéro
et fiches introuvables. Les tests existants de clavier, navigation, photos et contraste restent
présents. Les quatre formats et le workflow en deux lots de #68 sont conservés ; le nombre
courant de scénarios vient de l’inventaire, pas d’une valeur historique fixée dans la CI.

Commandes du README : `npm run lint`, `npm test`, `npm run build`, `npm run test:responsive`.
Les résultats réels et liens Backend/Frontend/lots/Responsive/Hosting du dernier SHA sont dans
la PR. La santé HTTP y est simulée ; cela ne prouve ni une intégration métier Django, ni la
caméra/galerie native ou les performances d’un appareil Pixel.

Le futur raccordement pourra garder les modèles, relations et point commun de consultation/
création. Il devra remplacer l’amorçage et l’écriture en mémoire par les échanges avec Django/DRF,
les identifiants serveur et le stockage des médias ; gérer explicitement attente, erreurs,
validation serveur, autorisations et déduplication serveur. Les URL d’objet locales ne sont
pas des URL de fichiers sauvegardés. Aucune interface de repository ou dépendance n’anticipe ce travail.

## Revue courte sur PC / Pixel

1. Ouvrir l’URL HTTPS du résumé Hosting **du dernier commit**, vérifier le SHA de
   `/deployment.json`, puis rester dans le même onglet pendant le parcours.
2. Dans Agent, ouvrir un matériel, saisir intitulé/priorité et éventuellement une photo.
   Vérifier puis confirmer ; ouvrir Voir le signalement et retrouver la photo, la liste et
   ses filtres. Une double activation ne doit ajouter qu’un signalement.
3. Changer d’espace par le menu du shell vers Responsable. Retrouver ce signalement dans
   Incidents et programmer une intervention. Consulter sa fiche et sa liste : bon matériel,
   signalement d’origine, agent affecté et date ; filtres et retours restent utilisables.
4. Créer aussi un signalement depuis Responsable. Essayer une annulation et un formulaire
   invalide : aucun nouvel élément. Au clavier sur PC, vérifier focus et nouveaux liens.
5. Recharger sur une fiche temporaire : état introuvable et retour utilisable ; les listes
   reviennent aux exemples initiaux. Sur Pixel, la sélection native et la lisibilité réelle
   des photos restent à évaluer par Arthur. Ne pas déduire une synchronisation PC/Pixel.

Questions de compréhension :

1. Pourquoi le service fourni à l’application conserve-t-il les créations quand un composant disparaît ?
2. Pourquoi la destruction du formulaire ne révoque-t-elle plus une photo confirmée ?
3. Quelles garanties devront être ajoutées côté serveur quand ces créations passeront par une API ?
