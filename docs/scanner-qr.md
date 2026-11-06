# Scanner Agent — issue #44 intégrée par la PR #56

## Adaptation UX #72 — en revue

#71 est fusionnée. Le [guide UX](agent-scan-ux.md) décrit la carte Scanner sur l’accueil
sous 1200 px, le retrait de Scanner de la navbar et le cadre décoratif uniquement pendant
le scan. Son ratio suit l’image réellement visible, y compris portrait/paysage et bandes.
Le QR hors cadre reste reconnu : `QrCamera` et `QrDecoder` ne sont pas modifiés.
Les sections datées ci-dessous décrivent les incréments initiaux ; ce guide UX précise
la navigation et le viseur qui les remplacent. Les garanties de permission/nettoyage restent valables.

## Point de départ et choix

Branche dédiée depuis le dernier `origin/main` vérifié le 31 octobre 2026 :
`1e87c74d51ad6c642a79f9383f12d2dda12464d2`, fusion de la
[PR #55](https://github.com/arthurb1348/terrimaint/pull/55) pour #43.
Les branches, modifications et stash de l’environnement initial ont été préservés.
#44 est intégrée par la [PR #56](https://github.com/arthurb1348/terrimaint/pull/56),
fusionnée le 1er novembre 2026 à `5d1867a17a993f1005c87276665b29004787eab6`.
#58 reste en revue jusqu’à fusion ; les photos #57 puis la mémoire partagée #59 suivent.

Le prototype [Agent 188:3](https://www.figma.com/design/0DOu4j0TnWj5wOHKkzTTI8/TerriMaint?node-id=188-3)
et l’écran Scanner `188:17` ont été consultés en lecture seule, avec structure,
capture et contexte détaillé. Adaptations explicites : activation après clic,
saisie visible en permanence et ouverture directe de la fiche reconnue plutôt
qu’un écran intermédiaire de succès. Le shell, ses icônes locales, la charte,
les retours et les jetons de contraste existants sont conservés. Le viseur décoratif
n’avait pas été ajouté dans #56 ; #72 l’introduit sans modifier le décodeur.
L’indicateur Synchronisé n’est pas ajouté. Aucune fidélité
pixel par pixel n’est revendiquée pour ce parcours adapté aux critères validés.
L’accès d’accueil reste masqué à partir de 1200 px inclus ; l’URL directe reste utilisable.
Depuis #72 en revue, Scanner quitte entièrement la navbar.

## Format et données non fiables

Le QR contient **seulement une référence**, par exemple `EQ-OUT-0001`, jamais une URL.
Le même résolveur traite lecture et saisie : `trim()` puis `toUpperCase()`, format
ASCII `EQ-` + trois lettres + `-` + quatre chiffres, puis égalité complète avec
un `id` de `DEMO_EQUIPMENT`. Les espaces internes, caractères supplémentaires,
variantes Unicode, chemins, URL et HTML sont invalides. Aucun rapprochement approximatif.
Un format valide absent de la source produit Référence inconnue.

Le résolveur retourne l’objet existant, sans copie ni équipement inventé.
Seul son `id` construit `['/agent/equipements', id]`. Aucun contenu brut du QR
n’est rendu comme HTML, évalué, journalisé ou passé à une ouverture d’URL.
Une erreur rend le focus au champ ; la correction et la reprise restent disponibles.
Dans #58, le bloc encadré au-dessus de la saisie distingue Référence invalide et
Référence inconnue, conserve `aria-describedby` et une seule région `alert`. Le statut
caméra ne répète plus l’échec QR. Après rendu du bloc, le champ est focalisé puis
dégagé de la navigation fixe ; erreur et saisie restent ensemble dans la fenêtre.
Le callback ignore destruction, nouvelle navigation et erreur déjà effacée. Les limites des jeux locaux restent documentées ici
et dans le README, sans badge de démonstration dans l’écran Scanner.
Un verrou empêche plusieurs navigations à partir de reconnaissances répétées ou
d’une saisie concurrente ; un échec/une annulation de navigation permet de réessayer.

## Décodeur et dépendance examinée

Observation locale sur **Chromium 151.0.7922.173**, Linux, contexte de boucle locale
sécurisé : `isSecureContext=true`, `getUserMedia` disponible, `BarcodeDetector` absent.
Le choix ne dépend donc pas de cette API native. Sources consultées le 31 octobre 2026 :

- [W3C Media Capture and Streams](https://w3c.github.io/mediacapture-main/) : permission, pistes et arrêt.
- [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) : contexte sécurisé et erreurs.
- [MDN BarcodeDetector](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) : API expérimentale et compatibilité à contrôler.
- [jsQR, dépôt officiel](https://github.com/cozmo/jsQR#readme) : décode les pixels RGBA et laisse le flux caméra à l’application.
- [Manifeste npm jsqr 1.4.0](https://registry.npmjs.org/jsqr/1.4.0) : version `latest` observée, licence Apache-2.0.

`jsqr` **1.4.0** est verrouillé exactement, avec URL et intégrité dans le lockfile
régénéré par npm 11.19.0. Il n’a aucune dépendance d’exécution. Le manifeste publié
et celui installé ont été relus : scripts de développement `prebuild` (rimraf),
`build`/`watch` (webpack), `test` (jest), `lint` (tslint), `generate-test-data`
(ts-node). Aucun `preinstall`, `install`, `postinstall` ni `prepare` ; aucun de ces
scripts de développement n’est lancé lors de son installation. `allowScripts` et
le mode strict restent inchangés ; `npm install-scripts ls` ne signale rien de non examiné.
L’audit npm des dépendances d’exécution ne signale aucune vulnérabilité à cette date.
Cela reste un constat limité aux alertes connues, pas une preuve de sécurité complète.

Le décodeur est importé au premier traitement d’image. Son chunk de production
mesure environ 130,5 ko brut / 26,6 ko transféré estimé. Angular signale son format
CommonJS ; l’avertissement reste visible, sans désactivation de contrôle ni hausse
au budget. Les pixels sont limités à 640 × 640 au plus, une seule lecture à la fois,
puis une pause de 200 ms avant la suivante. Les essais de netteté/distance sur vrai
appareil restent nécessaires ; le fonctionnement hors connexion n’est pas garanti.

## Cycle de vie de la caméra

1. Ouvrir Scanner ne demande rien. Démarrer appelle `getUserMedia` avec vidéo seule,
   caméra arrière préférée sans l’exiger, puis relie le flux au lecteur muet `playsinline`.
2. Une fois `play()` terminé, un canvas temporaire fournit les pixels au vrai jsQR.
   Aucun QR dans l’image signifie continuer ; une chaîne décodée arrête le flux avant
   validation, qu’elle soit connue ou non. Reprendre exige un nouveau clic.
3. Arrêter/annuler, reconnaissance, `NavigationStart`, destruction, `pagehide` et
   masquage de l’onglet invalident la génération courante, annulent le minuteur,
   retirent les écouteurs, appellent `stop()` sur toutes les pistes, détachent le
   lecteur et remettent le canvas à zéro. Le retour dans l’onglet ne redémarre rien.
4. `getUserMedia` ne fournit pas d’annulation par `AbortSignal`. Si sa promesse se
   termine après abandon, les pistes du flux tardif sont immédiatement arrêtées.
   Chaque continuation après permission, `play()` ou décodage compare sa génération :
   un ancien résultat ou rejet n’actualise pas le nouvel écran et ne navigue pas.
   Un `AbortSignal` empêche aussi de commencer jsQR si son import se termine après
   l’arrêt. Un traitement synchrone déjà commencé termine avant que le navigateur
   traite l’action suivante ; son résultat reste soumis au contrôle de génération.
   Une autorisation déjà mémorisée par le navigateur reste gérée dans ses réglages.

Aucune image, vidéo, liste de scans ou référence saisie n’est persistée. Les images
intermédiaires existent seulement en mémoire pendant leur traitement ; aucun fichier,
stockage navigateur, historique de scans ou requête d’envoi n’est créé. L’historique
normal des pages consultées reste celui du navigateur. Les photos de déclaration #43
suivent leur propre cycle, conservé par cet incrément.

## Préparer la revue depuis un téléphone

Sur ordinateur, `http://localhost:4200` est un contexte local autorisé. Sur le téléphone,
`localhost` désigne **le téléphone**, pas l’ordinateur : `http://192.168.…:4200` sur le
réseau Wi-Fi n’est généralement pas un contexte sécurisé pour la caméra.

Servir le frontend de la branche de revue par une URL **HTTPS avec certificat valide,
reconnu par le téléphone**, via un hébergement de test ou un reverse proxy HTTPS
configuré et autorisé par Arthur. Le réseau doit permettre d’atteindre cette URL ;
le serveur doit servir le shell aussi pour `/agent/scanner`. Pour une intégration avec Django, il faudrait
router `/api/**` vers lui sur la même origine ; cela ne fait pas partie de l'hébergement
statique prévu ici. Le [guide Firebase Hosting](firebase-hosting.md) prépare les URL
HTTPS de PR pour Pixel, après activation personnelle par Arthur. Sans backend,
l'accueil affiche normalement **API indisponible**. Aucun tunnel n'est publié.
Ne pas ignorer les alertes TLS, désactiver les protections, modifier des flags navigateur
ou considérer une adresse LAN HTTP comme sécurisée. Sans HTTPS prêt, tester la saisie
manuelle et reporter l’essai caméra physique.

Ouvrir l’URL HTTPS **dans le navigateur complet du téléphone**, sans iframe restrictive.
Une politique `Permissions-Policy`, les réglages du navigateur ou ceux du système peuvent
interdire la caméra même en HTTPS. Démarrer, puis accepter/refuser explicitement.
Pour reprendre après un refus durable, autoriser cette origine dans les réglages et
revenir au bouton Reprendre ; aucun contournement dans l’application.

## Revue courte d’Arthur — 1er novembre 2026 au matin

Afficher `/qr-demo/index.html` sur un second écran ou imprimer cette planche. Les PNG
et SVG sont également réutilisables dans `frontend/public/qr-demo/`.

| QR / saisie | Résultat attendu |
| --- | --- |
| `EQ-OUT-0001` | Fiche Agent Tondeuse autoportée, photo et Déclarer un incident disponibles |
| `EQ-VEH-0042` | Fiche Agent Fourgon de voirie |
| `EQ-OUT-9999` | Message Référence inconnue, aucun changement de page, possibilité de reprendre |
| `  eq-veh-0042  ` au clavier | Même fiche Fourgon, sans caméra |
| `https://example.org` ou `<script>alert(1)</script>` au clavier | Référence invalide, aucune ouverture/exécution |

- [ ] Ouvrir Scanner : aucune demande de caméra. Vérifier clavier, libellé et focus visible.
- [ ] Démarrer, accepter, lire les deux QR connus ; vérifier que la caméra se coupe et
  qu’une seule fiche s’ouvre. Depuis la fiche, ouvrir puis annuler la déclaration.
- [ ] Lire le QR inconnu, puis Reprendre avec un connu. Arrêter/reprendre sans QR ;
  quitter pendant la permission ou la lecture, puis accepter tardivement : aucune
  ancienne fiche ne s’ouvre et l’indicateur caméra finit par s’éteindre.
- [ ] Refuser la permission ; lire le message et ouvrir la fiche par saisie manuelle.
  Tester aussi la caméra occupée par une autre application si l’appareil le permet.
- [ ] Vérifier à 320 × 568, 390 × 844, 768 × 1024 et 1440 × 1024 : pas de débordement,
  focus dégagé de la navigation, Scanner masqué dès 1200 px mais URL directe utilisable.
- [ ] Noter appareil, OS, navigateur/version, URL/protocole, résultat et limites de l’essai physique.
- [ ] Arthur a relu le diff, compris le cycle de vie et décidé de la fusion.

## Preuves automatisées et limites

`equipment-reference.spec.ts`, `qr-camera.spec.ts`, `scanner.spec.ts` vérifient les
références, entrées non fiables, répétitions, erreurs, arrêt/reprise et résultats tardifs.
Les flux, permissions, pixels et résultats du décodeur y sont des doubles déterministes.
`e2e/scanner.pw.ts` utilise les vrais PNG locaux dans un canvas `captureStream`, puis
le vrai lecteur vidéo, le canvas applicatif et **jsQR non remplacé**. C’est un décodage
réel d’image et un capteur simulé, pas un essai de caméra physique. Les tests couvrent
également permission refusée, caméra absente/occupée, contexte incompatible, annulation
tardive, départ et saisie valide pendant l’attente. `contrast.pw.ts` ajoute des mesures
sur les styles rendus du champ, des actions et messages ; les tests photos restent présents.

Génération avec le véritable encodeur **Segno 1.6.6**, sans dépendance de l’application :
installer cette version dans un environnement Python séparé, puis exécuter
`python scripts/generate-qr-demo.py`. QR standards (pas Micro QR), correction M et marge
silencieuse de quatre modules. La planche associe chaque image à son texte lisible.

Les commandes et résultats locaux/CI du dernier commit sont rapportés dans la PR.
En local, Chromium système est utilisé via une configuration temporaire hors dépôt :
le binaire Playwright attendu n’est pas installé. La configuration CI reste intacte.
Aucune caméra physique, aucun lecteur d’écran, Safari/iOS, Android réel ou intégration
Django/proxy n’est validé par ces tests ; la santé HTTP des parcours existants est simulée.

## Fichiers à relire et compréhension

- `features/scanner/equipment-reference.ts` : format, source unique et frontière de confiance.
- `qr-camera.ts` et `qr-decoder.ts` : ressources, générations, limites de pixels et vrai décodage.
- `scanner.ts`, template et styles : état affiché, focus, routes et navigation unique.
- Tests Scanner/contrastes, QR locaux, `package*.json` : preuves, dépendance et intégrité.

Pour changer les équipements, modifier la source Matériel existante ; pour changer le
format, adapter le résolveur, l’aide, les fixtures et leurs tests ensemble. Pour changer
la fréquence/taille des lectures, intervenir dans `QrCamera`, puis vérifier sur téléphone.

1. Pourquoi fermer les pistes ne suffit-il pas si la permission n’a pas encore répondu ?
2. Pourquoi construire la route depuis l’objet reconnu plutôt que depuis le texte QR ?
3. Que prouve le décodage des PNG, et que reste-t-il à vérifier avec un vrai téléphone ?
