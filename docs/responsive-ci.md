# Responsive : deux lots parallèles

Optimisation de l'[issue #67](https://github.com/arthurb1348/terrimaint/issues/67), intégrée
par la [PR #68](https://github.com/arthurb1348/terrimaint/pull/68) (`0567919…`). Base distante du 6 novembre 2026 : `8b9318b…`, après fusion de #64/#65/#66.
À l’intégration de #68, les 376 scénarios et les quatre formats de #63 sont conservés : 320 × 568, 390 × 844,
768 × 1024 et 1440 × 1024. Aucun code frontend ni scénario n'est modifié.

## Workers et jobs

Un worker est un processus Playwright qui exécute des tests sur **un même runner**.
L'ancienne configuration utilisait un job et deux workers pour toute la suite.
La matrice lance maintenant deux jobs sur deux runners, chacun avec deux workers :
jusqu'à quatre workers travaillent simultanément sur des scénarios différents.
Chaque runner installe son environnement et démarre son propre serveur Angular.

Le workflow ajoute à `npm run test:responsive` respectivement `--shard=1/2` et
`--shard=2/2`. Playwright calcule ces deux lots complémentaires à partir du même inventaire,
sans liste de fichiers ni filtre manuel. `fullyParallel: true` permet de distribuer les
tests à l'intérieur d'un fichier. Avec l’inventaire historique de #68, chaque lot contient 188 scénarios ;
la répartition peut évoluer quand des tests sont ajoutés. Le nombre ne mesure pas leur coût :
les parcours photo ou clavier peuvent durer davantage qu'une simple ouverture de page.

Les deux workers par job, `retries: 0`, assertions, délais, captures d'échec et traces sont
inchangés. `fail-fast: false` laisse l'autre lot finir après un échec. L'annulation globale
des anciennes exécutions reste active quand un nouveau commit arrive.

En local, `npm run test:responsive` exécute toujours toute la suite et produit son HTML,
puis `npm run test:responsive:report` le sert. Node 24.21.0, npm 11.19.0, lockfile et
installation Chromium sont conservés ; aucun cache de navigateur n'est ajouté.

## Rapports et contrôle final

Le reporter blob est le format Playwright prévu pour fusionner les résultats de sharding.
Le workflow sélectionne `list,blob` en ligne de commande, sans changer la configuration locale.

| Artifact, conservé sept jours | Contenu et utilisation |
| --- | --- |
| `responsive-blob-1`, `responsive-blob-2` | ZIP Playwright du lot avec résultats et pièces jointes, dont les captures attachées explicitement par les scénarios et les traces d'échec. |
| `responsive-results-1`, `responsive-results-2` | Dossier `test-results` brut, utile pour les diagnostics d'échec. Il peut ne contenir aucun média si aucun test n'échoue. |
| `responsive-report` | HTML commun produit par `npx playwright merge-reports --reporter html ./all-blob-reports`. Télécharger et extraire **tout** l'artifact, puis ouvrir `index.html` ou servir son dossier avec `npx playwright show-report chemin/du/rapport`. |

Le job de rapport s'exécute aussi après un échec de tests, sauf annulation de l'exécution.
Il exige les deux fichiers `responsive-shard-1.zip` et `responsive-shard-2.zip` avant fusion.
Un blob manquant ou une publication HTML absente fait échouer ce job. Une panne avant les
tests peut donc empêcher un rapport commun ; le blob disponible et les logs restent consultables.
Pour reconstruire localement un HTML, réunir les ZIP internes des deux artifacts blob dans
un dossier, puis lancer la commande `merge-reports` avec la version Playwright du lockfile.

Le dernier job garde exactement le nom public **Responsive**. Avec `if: always()`, il exige
`needs.responsive-shards.result == success` **et** `needs.responsive-report.result == success`.
Un lot échoué, annulé ou ignoré ne peut produire un succès, même si un HTML partiel existe.
Un rapport valide contenant des tests en échec reste un diagnostic, pas une validation.
Les contrôles obligatoires Backend/Frontend, le ruleset et Firebase Hosting restent inchangés.

## Vérifier la couverture et relire

Depuis `frontend/`, après `npm ci`, les inventaires ne lancent aucun navigateur :

```sh
CI=true npx playwright test --list --reporter=json > /tmp/responsive-full.json
CI=true npx playwright test --list --shard=1/2 --reporter=json > /tmp/responsive-1.json
CI=true npx playwright test --list --shard=2/2 --reporter=json > /tmp/responsive-2.json
```

Comparer les identifiants de scénario **avec leur projet** dans ces JSON, pas seulement les
titres : un même titre est volontairement exécuté aux quatre formats. Vérifier les doublons
internes de chaque inventaire, l'intersection vide des lots et l'égalité de leur union avec
la suite complète. L'inventaire de #67 donne 376 = 188 + 188, sans omission ni doublon.
Le champ `status: skipped` du reporter JSON en mode `--list` signifie que les tests n'ont
pas été exécutés ; il ne constitue pas une instruction d'ignorer les scénarios.

Pour la revue d'Arthur :

1. Lire le diff de `.github/workflows/responsive.yml` et vérifier la matrice `[1, 2]`,
   `fail-fast: false`, les noms d'artifacts et les deux dépendances du contrôle final.
2. Sur **le dernier commit proposé**, ouvrir l'exécution Responsive liée dans la PR : les
   deux lots doivent avoir travaillé en parallèle, chacun avec deux workers et le nombre
   de scénarios attendu par l’inventaire courant.
   Lire aussi Backend et Frontend de ce commit ; une ancienne CI verte ne suffit pas.
3. Extraire le rapport commun, vérifier que ses résultats couvrent l’inventaire courant aux quatre formats et ouvrir
   quelques captures de navigation/clavier, photos et contraste. Vérifier les liens vers
   les pièces jointes ; les traces ne sont attendues qu'en cas d'échec.
4. Lire les durées et limites consignées dans la PR, puis décider de la validation humaine.
   Les cases de validation restent à Arthur. Aucun essai sur appareil n'est revendiqué ici.

## Mesurer sans confondre réseau et tests

Référence saine existante : [Responsive de #64](https://github.com/arthurb1348/terrimaint/actions/runs/42196141956),
réussi le 6 novembre, même code frontend et même configuration Playwright que la base :

| Mesure issue des horodatages GitHub | Durée |
| --- | ---: |
| Création de l'exécution → fin du job | 7 min 20 s |
| Création → début du job (estimation attente/provisionnement) | 3 s |
| Début du job → début de l'étape de tests | 1 min 12 s |
| Dont `npm ci` / Chromium et dépendances Ubuntu | 43 s / 20 s |
| Étape de tests (typage + serveur Angular + tests + reporter) | 5 min 59 s |
| Publication du rapport | 3 s |
| Fin de job et nettoyage après publication | 3 s |
| Somme des durées des jobs Responsive | 7 min 17 s |

La [relance réussie de #66](https://github.com/arthurb1348/terrimaint/actions/runs/42190610477/attempts/2)
donne aussi une référence normale : npm 37 s, Chromium 17 s, étape de tests 5 min 22 s,
job 6 min 31 s. Au contraire, la première tentative de #66 a consacré **11 min 47 s** à
Chromium et aux paquets système Ubuntu, puis a été annulée après plus de quinze minutes : elle ne mesure
pas une suite complète réussie. Le sharding ne corrige pas cette lenteur de téléchargement ;
deux installations peuvent aussi subir un incident réseau.

### Première mesure de #67 : incident réseau reproduit

L'[exécution sur `2bc7a42`](https://github.com/arthurb1348/terrimaint/actions/runs/42198697362)
du 6 novembre donne les mesures suivantes, arrondies à la seconde à partir des horodatages
Actions. Les deux jobs ont commencé à une seconde d'écart, mais leurs étapes de tests
n'ont pas pu se chevaucher à cause de la préparation du lot 2.

| Job | Préparation avant tests | Dont npm / Chromium | Étape de tests | Publication des blobs/diagnostics | Durée totale du job |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lot 1 | 52 s | 29 s / 15 s | 2 min 30 s, 188 succès | 3 s | 3 min 27 s |
| Lot 2 | 11 min 26 s | 50 s / **10 min 26 s** | 3 min 48 s, interrompue | ignorée après annulation | 15 min 17 s |
| Rapport commun | 1 min 1 s avant téléchargement, dont npm 50 s | — | sans tests | fusion refusée, blob 2 absent | 1 min 7 s |
| Responsive final | — | — | sans tests | sans rapport | 3 s, **échec** |

Le runner du lot 2 a rencontré des téléchargements Ubuntu lents (`azure.archive.ubuntu.com`,
polices `fonts-ipafont-gothic` et `fonts-wqy-zenhei` dans les logs). Il a atteint la limite
de **15 minutes inchangée**. Le contrôle de présence a refusé le second blob absent et
le contrôle final a réellement échoué : aucun succès global trompeur, ni HTML incomplet
annoncé comme valide. Le blob du lot 1 reste exploitable : 188 succès et 284 captures PNG
présentes, dont une capture photo ouverte pour vérifier la lecture.

Création → contrôle final : **16 min 38 s**, contre 7 min 20 s pour la référence saine.
Somme des durées des quatre jobs : **19 min 54 s**, contre 7 min 17 s. L'attente/provisionnement
estimée est de 3/4 s avant les lots, 3 s après les lots avant le rapport et 4 s avant le
contrôle final ; les différences restantes comprennent préparation et nettoyage des runners.
**Cette première mesure ne montre aucun gain global et ne valide pas une suite complète** :
elle documente l'incident et les garde-fous. Le lot 1 seul ne permet pas d'estimer le coût
du lot 2. Aucun timeout, retry ou test n'est modifié pour résoudre ce problème réseau.

Les mesures sont ajoutées par un commit documentaire, avec workflow et code applicatif
inchangés ; les contrôles de ce dernier commit sont vérifiés séparément dans la
[PR #68](https://github.com/arthurb1348/terrimaint/pull/68). Cette nouvelle vérification est
nécessaire pour achever les deux lots et valider le rapport commun, restés incomplets ici.

La description de la PR liée à #67 consigne les résultats effectivement observés, les liens
vers l'exécution du dernier commit et la comparaison chiffrée avec cette référence. Pour la
mettre à jour, relever pour **chaque job** les débuts/fins et les étapes via l'API Actions :

- préparation : début du job → début de l'étape de tests ; pour le rapport, installation
  Node/npm avant téléchargement des blobs ;
- tests : durée de l'étape complète, puis durée Playwright propre indiquée dans les logs
  quand disponible (ne pas attribuer le démarrage Angular aux seuls scénarios) ;
- rapports : publication des blobs/diagnostics, téléchargement, fusion et publication HTML ;
- attente/provisionnement : création → début des lots, puis fin des dépendances → début du
  rapport et du contrôle final ; GitHub ne permet pas d'isoler parfaitement la file runner ;
- temps écoulé jusqu'au contrôle final et **somme des durées de tous les jobs** Responsive,
  incluant rapport et contrôle. Cette somme n'est pas une facture de minutes arrondies.

Ne pas additionner les deux lots pour annoncer le délai utilisateur : ils se chevauchent.
En revanche, les additionner pour le calcul cumulé. La troisième installation npm, la fusion
et l'attente d'un runner ajoutent du coût. Une seule paire de mesures ne prouve pas un gain
stable : runners, caches npm et réseau varient, et les lots peuvent être déséquilibrés.
Cette optimisation n'améliore ni ne réduit la couverture fonctionnelle ; les tests gardent
une santé HTTP simulée et ne remplacent pas l'intégration Django ou un essai physique.

Sources : [sharding et fusion Playwright](https://playwright.dev/docs/test-sharding),
[reporter blob](https://playwright.dev/docs/test-reporters#blob-reporter),
[statuts et conditions GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions).
