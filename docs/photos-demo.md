# Images et photos de démonstration — #43 intégrée par la PR #55

## Origine et présentation

Intégrée le 31 octobre 2026 au commit `1e87c74d51ad6c642a79f9383f12d2dda12464d2`
([PR #55](https://github.com/arthurb1348/terrimaint/pull/55)), vérifié avant #44.

Branche issue de `origin/main` vérifié `554468d731311dc25b34956c75866a8349c672c5`,
qui intègre #52 et #53/PR #54. Les prototypes Figma Agent `188:3` et Responsable
`188:6` ont été consultés en lecture seule, dont la capture Ajouter une photo
`188:9552`. Adaptation : sélection et aperçus dans le formulaire commun existant,
sans étape supplémentaire ni faux indicateur de synchronisation. Les décisions
validées (Basse, description facultative, risque sans immobilisation) priment.

Les neuf images dans `frontend/public/images/demo/` ont été générées avec l’outil
OpenAI image_gen le 31 octobre 2026 pour ce projet. Ce sont des illustrations
fictives, sans marque demandée, ni preuve de l’état réel d’un équipement.
Leur préparation ne crée aucune fonction IA dans l’application.

| Fichier | Sujet | Association |
| --- | --- | --- |
| mower.webp | Tondeuse autoportée verte dans un atelier | EQ-OUT-0001 |
| blower.webp | Souffleur à dos et tube | EQ-OUT-0002 |
| brushcutter.webp | Débroussailleuse à arbre droit | EQ-OUT-0003 |
| van.webp | Fourgon blanc générique | EQ-VEH-0042 |
| boiler.webp | Chaudière et tuyauterie | EQ-BAT-0011 |
| washer.webp | Nettoyeur, flexible et lance | EQ-OUT-0004 |
| heating-controls.webp | Commandes du chauffage, vue rapprochée | INC-2026-047 |
| heating-pipes.webp | Distribution des tuyaux de chauffage | INC-2026-047 |
| hose-joint.webp | Raccord de flexible et gouttes au sol | INC-2026-050 |

Prompt commun : photographie illustrative réaliste et générique, matériel entier,
atelier municipal, lumière naturelle douce, palette verte/grise, sans personne,
texte ou logo ; sujet précisé dans le tableau. Les exemples ont des cadrages
spécifiques de commandes, tuyauterie et raccord, distincts des illustrations Matériel.
Les tailles exactes et empreintes SHA-256 livrées figurent dans [le manifeste](demo-images-manifest.json).
Les originaux PNG sont conservés dans l’environnement de préparation, hors dépôt.
Conversion WebP qualité 80, sans déformation, centrée dans un cadre 4:3 : 900 × 675
(44 à 81 ko environ) et six variantes Matériel `-thumb` 300 × 225. Pillow est uniquement un outil
de préparation déjà disponible, aucune dépendance applicative ajoutée.
Les listes chargent les petites variantes ; les fiches utilisent les grandes.
L’élément image est recréé quand son URL change : aucun ancien bitmap ne reste
affiché pendant le chargement d’un autre matériel, et ses anciens événements sont détachés.
Dimensions et ratio sont réservés, premier visuel chargé immédiatement, suivants différés et repli textuel en cas d’erreur.

Pour remplacer un visuel, modifier l’association image/alternative dans
`equipements-demo.ts`, ou les `photos` dans `incidents-demo.ts`, puis remplacer
l’asset local. Ne pas dupliquer nom, référence ou emplacement des équipements.

## Prise de vue et préparation — #57 intégrée par #63

La branche `feat/57-prepare-report-photos` part de `origin/main`
`73889125a5683af04d7360423d53e16802e73be7`, vérifié avec Git distant et GitHub :
#58/PR #60 fusionnée le 1er novembre 2026 ; Hosting #61/PR #62 est aussi intégré.
#43 reste intégrée ; la préparation #57 est **intégrée par #63** (`d9ad574…`).
Ordre : #58 et #57 intégrées → #59 mémoire partagée en revue → #45 GPS → #46 audio
→ #47 dashboard → #48 stabilisation. Django/DRF/PostgreSQL reste la cible backend.

Deux boutons natifs du formulaire partagé Agent/Responsable ouvrent deux `input file` :
**Prendre une photo** (`capture="environment"`, une image) et **Choisir dans la galerie**
(sélection multiple, sans `capture`). Le navigateur décide de la proposition effective :
ni caméra arrière garantie, ni lecteur caméra personnalisé, ni nouvelle bibliothèque.
Annuler un sélecteur produit une sélection vide et ne modifie ni saisie, ni photos, ni erreurs.
Le champ est vidé après sélection pour pouvoir reprendre le même fichier.

### Limites choisies avant implémentation

Toutes les constantes sont dans `features/incidents/photo-preparation.ts` (`PHOTO_LIMITS`).
Les octets utilisent les puissances de 1024 ; les mégapixels sont décimaux.

| Contrôle | Limite | Pourquoi |
| --- | --- | --- |
| Photos conservées | 3, facultatives | Même capacité métier ; fichiers valides acceptés dans les places disponibles |
| Entrée compressée | 24 Mio = 25 165 824 octets, fichier non vide | Accepter une photo dépassant 5 Mio sans entrées illimitées |
| Dimensions d’entrée | 8 192 px par axe et 24 000 000 pixels | Accepte 4 032 × 3 024 et 6 000 × 4 000 ; borne le décodage avant allocation |
| Lecture d’en-tête | Au plus 256 Kio = 262 144 octets | Pas de lecture intégrale préalable ; en-tête absent/trop éloigné refusé |
| Formats d’entrée | MIME et contenu JPEG (SOF0/1/2), PNG, WebP statique | Signature, dimensions puis décodage réel ; WebP animé refusé |
| Côté long préparé | 1 920 px au maximum, sans agrandissement | Conserver des détails ; proportions à l’arrondi d’un pixel |
| Réencodage | JPEG, qualités 0,86 → 0,78 → 0,70 | Format largement décodable ; fond blanc explicite pour la transparence |
| Repli si nécessaire | Côté long 1 600 px, mêmes trois qualités | Au plus six essais ; pas de réduction indéfinie pour obtenir un fichier accepté |
| Sortie contrôlée | 1,5 Mio = 1 572 864 octets au maximum | Taille réellement mesurée, MIME/signature, dimensions et nouveau décodage contrôlés |

24 mégapixels représentent jusqu’à environ **96 Mo de pixels RGBA** pour un seul bitmap,
auxquels le navigateur peut ajouter ses propres copies/buffers. Ce n’est pas une mesure de
pic mémoire ni une garantie contre tout épuisement de mémoire. Le mode Pixel très haute
résolution (par exemple 50 MP) est volontairement refusé ; utiliser la résolution normale.
Les en-têtes complexes au-delà de 256 Kio sont aussi refusés même si un autre logiciel
peut les ouvrir. Les contrôles locaux ne remplacent jamais la validation serveur future.

### Circulation et ressources

1. `selectPhotos` récupère les fichiers natifs et vide le champ, sans toucher au formulaire.
2. `IncidentPhotos.add` met les sélections en file, puis prépare **un fichier à la fois**.
   Type/taille, en-tête/dimensions/pixels sont contrôlés avant `createImageBitmap`.
3. `preparePhoto` décode avec `imageOrientation: 'from-image'`. EXIF, rotations et miroirs
   sont appliqués par le navigateur ; aucune seconde rotation manuelle. Les dimensions
   décodées doivent correspondre à l’en-tête, éventuellement transposées.
4. Un canvas réduit sans agrandir, garde le ratio et compose l’alpha sur blanc. Le bitmap
   original est fermé avant le réencodage. Chaque `toBlob` produit un candidat JPEG :
   qualité ne signifie pas poids garanti. Le candidat accepté est relu et redécodé ;
   tout résultat incorrect ou impossible produit une erreur nommée, sans effacer les autres.
5. Une URL d’objet est créée **uniquement pour le Blob préparé**. L’aperçu et le récapitulatif
   lisent la même URL ; Modifier conserve les mêmes photos, identifiants et saisies.

Le nom affiché reste celui de l’original pour reconnaître sa sélection ; le contenu est
bien un JPEG préparé, même si ce nom finit par `.png` ou `.webp`. Aucun export ou envoi
n’est créé. Réencoder peut augmenter le poids d’une petite image déjà bien compressée :
la borne de sortie est garantie pour les photos acceptées, pas un gain sur tous les fichiers.

`AbortController` invalide le parcours à terminer/changer de matériel/quitter/détruire.
Les lectures `FileReader` sont interrompues ; les résultats tardifs des API non interrompables
(`createImageBitmap`, `toBlob`) sont ignorés et leurs ressources fermées. La même instance
garde sa file après remise à zéro : un nouveau matériel attend le nettoyage de l’ancien
décodage. Les références aux fichiers non commencés sont retirées immédiatement ; celles
aux fichiers traités quittent la file au fur et à mesure. Aucune URL d’original n’est créée.
Les canvas sont remis à zéro et les bitmaps fermés dans des `finally`, y compris les erreurs.

La suppression retire par identifiant stable et révoque l’URL préparée ; une autre préparation
ne reconstruit jamais une ancienne liste. Le focus rejoint suppression suivante/précédente,
ou le bouton galerie, centré après rendu pour dégager la navigation mobile. Une sélection
rapprochée attend la précédente et recontrôle les places disponibles ; une sélection mixte
garde les fichiers valides. Une modification de `q` seule ne réinitialise pas le matériel.

Le statut annonce **Préparation des photos…**, puis le nombre accepté ; les erreurs sont
associées aux actions et annoncées dans la zone vive. Les boutons sont accessibles au
clavier avec focus visible. La soumission est désactivée et `review()` garde aussi une
protection logique pendant le traitement et hors de l’étape formulaire : pas de double
validation ni de récapitulatif incomplet.

Avant confirmation, les photos restent dans le brouillon. La branche #59 en revue transfère
les URL préparées au signalement confirmé dans `DemoData` : elles survivent au formulaire
et au changement d’espace du même onglet. `IncidentPhotos.transfer()` retire la propriété des
URL avant de nettoyer le brouillon ; le service les libère à sa destruction, le navigateur
à la fermeture/recharge du document. Les préparations tardives restent annulées/ignorées.
Le [guide #59](shared-memory.md) détaille ce transfert sans réencodage.
Quitter sans confirmer libère le brouillon ; recharger perd aussi les créations partagées.
Aucun téléversement, stockage persistant, Firebase Storage, backend métier, GPS ou audio.

### Mesures reproductibles et limites

Mesures du 1er novembre 2026, Chromium **153.0.8010.0** local, via le vrai canvas/codec du
navigateur et le formulaire ; `e2e/photo-preparation.pw.ts` reproduit les images synthétiques.
Le WebP est l’illustration existante `public/images/demo/mower.webp` ; aucune photo personnelle.

| Image d’essai | Original (octets et dimensions) | Préparée JPEG (octets et dimensions) |
| --- | --- | --- |
| JPEG à quatre quadrants, EXIF 1 | 1 259 ; 120 × 80 | 1 164 ; 120 × 80 |
| Même JPEG, EXIF 6 | 1 259 ; 120 × 80 stockés | 1 189 ; 80 × 120 orientés |
| Petit PNG à quatre quadrants | 664 ; 160 × 80 | 984 ; 160 × 80 |
| Illustration WebP tondeuse | 64 012 ; 900 × 675 | 111 962 ; 900 × 675 |
| JPEG synthétique à quatre quadrants | 79 813 ; 4 000 × 3 000 | 19 252 ; 1 920 × 1 440 |
| PNG bruit déterministe, réellement > 5 Mio | 6 606 776 ; 1 600 × 1 200 | 1 407 683 ; 1 600 × 1 200 |

Les huit orientations EXIF sont contrôlées par dimensions **et pixels de quatre quadrants**,
miroirs inclus. Le dernier essai a pris environ **987 ms**, du remplissage automatique du
sélecteur au contrôle de sortie (automation incluse, un échantillon). Ce n’est ni un benchmark
CPU, ni un temps de capteur Pixel, ni un pic mémoire mesuré. Les petits fichiers peuvent
grossir comme le montrent les deux lignes PNG/WebP. Les aplats et le bruit ne prouvent pas
la lisibilité d’une fissure réelle ; qualité/détails et performances physiques restent à Arthur.
Les mesures par format/espace sont attachées au rapport Responsive ; les codecs/versions
peuvent donner des poids légèrement différents. Les seuils sont des choix de cette PR,
à réviser après la revue terrain, pas une validation Pixel déjà obtenue.

### Vérifications

- **Unitaires avec doublures** : en-têtes, limites avant décodage, fichier > 5 Mio, erreur
  de lecture, décodage refusé, sortie nulle/mauvais format/mauvaises dimensions/illisible,
  dépassement réel du poids, nombre borné de tentatives et fermeture des ressources.
  Sélections mixtes/rapprochées, suppression pendant traitement, annulation, résultats tardifs
  d’entrée/sortie/réencodage, changement de matériel et double validation bloquée sont testés.
- **Navigateur avec vraies images** : JPEG/PNG/WebP, EXIF 1–8, pixels/proportions/dimensions,
  pas d’agrandissement, réduction 4 000 → 1 920, PNG bruit > 5 Mio, en-tête démesuré refusé
  et PNG tronqué refusé par le véritable décodeur. Aperçu/récapitulatif/Modifier, capacité,
  suppression/focus, rechargement/départ et sélection mixte restent couverts dans les deux
  espaces aux quatre formats : 320 × 568, 390 × 844, 768 × 1024, 1440 × 1024.
- **Sélecteurs** : Playwright vérifie l’ouverture des deux entrées et simule une sélection
  vide ; il ne valide pas l’interface système Android, les permissions ou la caméra physique.
- Santé HTTP simulée ; aucune intégration métier Django ni conformité WCAG globale annoncée.
  Les contrôles de contraste existants sont conservés et étendus aux deux actions.

Commandes : `npm run lint`, `npm test`, `npm run build`, `npm run test:responsive`.
Les résultats réels et liens CI/Hosting du dernier commit figurent dans la PR.
Le Chromium Playwright 156 attendu est absent localement : téléchargement renvoyant un
HTML de 195 octets, erreur ZIP « End of central directory record signature not found ».
Les essais locaux utilisent Chromium 153 via une configuration temporaire **hors dépôt**,
sans changer workflows, dépendances applicatives, délais, retries ou assertions.

### Procédure courte sur Pixel et oral

Utiliser le lien HTTPS du résumé **Firebase Hosting de cette exécution**, comparer son
`/deployment.json` au SHA de la PR. Dans Agent puis Responsable :

1. Saisir un intitulé et une priorité. Prendre une photo : vérifier proposition de la caméra
   arrière, orientation portrait/paysage, détail d’un défaut et aperçu. Noter Pixel/Android,
   navigateur/version, durée ressentie et qualité ; `capture` reste une indication.
2. Choisir dans la galerie, puis annuler chacun des deux sélecteurs : saisies/photos intactes.
   Ajouter une photo > 5 Mio mais ≤ 24 Mio/24 MP ; vérifier préparation puis détail visible.
   Une photo trop grande ou illisible doit laisser les autres et les champs en place.
3. Essayer quatre photos et une sélection mixte. Supprimer pendant une préparation ;
   aucun ancien aperçu ne doit revenir. Vérifier focus/clavier et actions dégagées du menu.
4. Vérifier le signalement, contrôler les mêmes photos, puis Modifier : tout est conservé.
5. Annuler/quitter vers un autre matériel pendant une préparation, revenir et recharger :
   aucun résultat tardif ni ancienne photo du brouillon. Avec #59 en revue, confirmer puis
   quitter doit au contraire conserver les photos dans la fiche partagée jusqu’au rechargement.

À modifier : limites et réencodage dans `photo-preparation.ts`, file/URL dans
`incident-photos.ts`, boutons/focus dans `incident-declaration.*`. Pour l’oral, suivre
**fichier original → contrôles → décodage orienté → réduction/réencodage → Blob contrôlé
→ URL d’aperçu → même URL au récapitulatif**, puis révocation au départ.

1. Pourquoi vérifier les dimensions avant le décodage et encore après ?
2. Pourquoi le réglage de qualité ne suffit-il pas à garantir 1,5 Mio ?
3. Comment l’annulation et la file empêchent-elles une ancienne photo de revenir ?
