# Revue de stabilisation #48

Base contrôlée : `origin/main` **5ae809590cbb9e56a96eafd606df65ddee07ab4f**, fusion #108,
13 novembre 2026. Branche `fix/48-demo-stabilization`, créée dans un worktree séparé ;
les autres checkouts sont préservés. Les preuves finales (SHA de tête, fusion de test,
commandes, jobs, rapport et Hosting) sont consignées dans la PR liée à #48.

Chromium local **151.0.7922.173**, Linux, Playwright 1.64.1 ; Node 24.21.0 / npm 11.19.0.
Un échange réel séparé navigateur → proxy Angular → Django a donné HTTP 200
`{"status":"ok"}` et API disponible ; après arrêt de Django, HTTP 502 du proxy et
API indisponible. Aucune réponse interceptée pour cet essai de santé, sans preuve de base métier.
Les suites navigateur restent, elles, basées sur la santé simulée.

Les prototypes Figma Agent `188:3` et Responsable `188:6` ont été consultés en lecture
seule. Les adaptations déjà validées priment : formulaire commun, priorités Basse/Haute/Urgente,
description facultative, Scanner sous 1200 px, mémoire partagée et absence de faux état synchronisé.
Le retour unique et les actions finales groupées suivent les compléments actuels de #48 ;
aucune fidélité pixel par pixel aux anciens écrans n’est revendiquée.

## Périmètre des preuves

| Critères / parcours | Méthode reproductible | Limites |
| --- | --- | --- |
| Déclarations matériel/lieu dans les deux espaces ; erreurs, Modifier, confirmation, retours filtrés, abandon, recharge | Unitaires existants, `responsive`, `responsible-place-incident`, `stabilization`, `shared-memory`, `place-incident` | Mémoire du même onglet ; pas d’envoi métier. |
| Programmation matériel/signalement/lieu, date locale, affectation et consultation Agent | `responsive`, `equipment-planning`, `place-planning`, `agents` | Horloge/fuseaux contrôlés ; identité présentée Camille, sans connexion. |
| Terminer une affectation En cours ; clôturer un signalement ; relations et dashboard | `intervention-completion`, `incident-closure`, `incident-interventions`, `dashboard` | Pas de transition Planifiée → En cours dans cette démo. |
| Caméra, photo/galerie, micro, GPS : refus/absence, réponses tardives, ressources | Suites Scanner/photos/audio/localisation, unitaires des services | Flux et permissions simulés ; vrai QR de fichier décodé, pas caméra physique. |
| Titres de document, langue française, régions, lien d’évitement, contrôles/erreurs, statuts et alternatives d’images | Templates, angular-eslint, suites responsive/contraste et parcours clavier | Les annonces exactes par lecteur d’écran restent manuelles. |
| Tab/Maj+Tab, Entrée/Échap, menus et focus après navigation/erreur, confirmations et barres fixes | Suites existantes et `stabilization.pw.ts`, captures à 320/390/768/1440 px | Chromium Linux ; pas de validation Windows/Safari/Pixel. |
| Contrastes texte/contrôle/focus, information indépendante de la couleur | `contrast.pw.ts`, badges textuels ; [mesures](contrast-accessibility.md) | Sondes CSS ciblées, contrôles natifs et audit global non certifiés. |
| Texte 200 %, reflow 320 px CSS, espacement personnalisé, paysage | `stabilization.pw.ts` : taille racine 200 %, interligne 1,5, paragraphes 2 em, lettres 0,12 em, mots 0,16 em ; 844 × 390 en paysage | Agrandissement CSS, pas commande de zoom d’un navigateur physique. 320 px CSS correspond au reflow 1280/400 %, pas à un essai de zoom réel. |
| Cibles et confirmation sans chevauchement, titres/lieux longs dans tableaux/cartes | Géométrie des actions ≥24 × 24 px, tests existants à cibles 44/48 px et captures ; `stabilization` | Pas de mesure exhaustive des pixels de tous les contrôles natifs. Textes longs injectés dans le DOM pour les captures de tableaux uniquement. |
| Carte, Confidentialité et échanges | `incident-map`, `privacy`, `place-incident`, observation des requêtes | Réponses OSM interceptées (SVG ou abandon), coordonnées fictives ; santé HTTP simulée. Ni disponibilité distante ni intégration Django prouvée. |

Les noms de suites ci-dessus sont les fichiers `frontend/e2e/*.pw.ts`. Les résultats
exécutés, nombres et éventuels écarts sont dans la PR ; cette matrice n’est pas une
certification WCAG AA ni une validation sur appareil réel.

Captures locales de la correction avec les données fictives, sans capteur :
[confirmation Agent, 320 × 568](images/stabilization/confirmation-agent-320.png) et
[tableau Responsable, 1440 × 1024](images/stabilization/tableau-interventions-1440.png).
Les autres formats, les textes agrandis et les deux tableaux sont joints au rapport Responsive.

## Défaut constaté pendant la revue visuelle

À 320 px avec taille de texte 200 % et espacements personnalisés, les libellés de la
barre Agent se chevauchaient malgré l’absence de débordement du document. La correction
permet le retour à la ligne dans chaque cible et adapte l’espace réservé sous le contenu.
Les marges de défilement suivent aussi le texte agrandi afin de garder le focus hors de
la barre fixe, y compris sur une action finale de plusieurs lignes.
Le test renforcé mesure les textes dans leurs cibles et vérifie l’accès clavier au lien
Confidentialité au-dessus de la barre. La suite complète a été interrompue pour appliquer
cette correction ; seule l’exécution finale complète est retenue comme preuve de succès.

## Diagnostic recherche #33

#33 était déjà **fermée** lors de cette revue ; aucune fermeture ou réouverture effectuée.
Le code Matériel possède un `input type="search"` natif, sans `datalist`, liste de
suggestions applicative ni désactivation de l’autocomplétion. Le filtre agit sur les cartes.

`stabilization.pw.ts` utilise des contextes Chromium vierges, avec puis sans émulation
mobile/tactile à chaque largeur. Saisir `  tONDeUSE  ` donne une seule carte Tondeuse,
effacer redonne les six ; focus, débordement et absence de suggestions applicatives sont
contrôlés. Le rapport joint user-agent, largeur, `visualViewport.scale` et DPR (1).
Ces contextes sans historique et sans DevTools ne reproduisent pas une fenêtre native
d’autocomplétion de saisies mémorisées. Aucun défaut applicatif de suggestion n’est établi ;
aucun `autocomplete="off"` ou correctif CSS de contournement ajouté.

À rejouer sur le navigateur d’origine : noter navigateur/version, OS, zoom réel, largeur,
DPR et mode DevTools ; comparer une fenêtre normale et l’émulation à zoom 100 %, puis
un profil vierge. Une suggestion native relève du navigateur, hors DOM de l’application.
Conserver une capture et la séquence exacte si elle apparaît ; ne pas attribuer son
placement à une carte applicative sans cette comparaison.

## Vérifications restant à Arthur

Sur Pixel, ouvrir la preview et comparer `/deployment.json` au SHA de la PR avant le
[scénario de six minutes](demo-oral.md). Dans le même onglet, vérifier aussi capteurs
physiques, refus puis nouvelle demande, clavier virtuel, barre basse, rotation et fond OSM
réel. Les parcours récents de fin d’intervention, clôture et programmation matériel doivent
être revus **sur cette preview** ; un test local ne valide pas son URL ni son hébergement.

Avec NVDA sous Windows, dans Agent : lien d’évitement → Signalements → Nouveau →
soumettre vide, écouter l’erreur et le champ ciblé → compléter → Vérifier → Modifier →
Envoyer → Voir le signalement. Dans Responsable : menus → fiche signalement → Programmer,
soumettre vide puis compléter → confirmer → Voir l’intervention → retour filtré. Écouter
titres, régions, noms/états, erreurs et annonces dynamiques ; Tab/Maj+Tab/Entrée/Échap sans
piège. Tester zoom navigateur 200 % et reflow 400 % sur 1280 px, plus espacements et
portrait/paysage. Consigner version, OS, résultats et anomalies. **Essai NVDA non réalisé
dans l’environnement Linux sans lecteur d’écran.**

Les contrôles automatisés ne cochent aucune validation humaine. Arthur relit le diff,
les preuves et les limites avant de décider du passage en revue et de la fusion.
