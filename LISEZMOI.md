# Bibliothèque commune des cartes interactives (maths et français)

Un seul code pour les deux cartes. Rien ici ne connaît les maths ni le français : on lui donne des données.

## Contenu
- `interface.js` + `interface.css` (14/11/2026) : en-tête d'activité sur une ligne (`CartesUI.entete`), page des activités (`entetePage`, `accueil` = bandeau avec personnage, message et étoiles, `cartes`), pastilles d'étapes (`majEtapes`), un seul écouteur de clics (`surClic`), fenêtre « Je retiens » (`retiens`), réussites gardées sur l'appareil (`reussies`). Mode d'emploi en tête de `interface.js`.
- `inserer.py` : colle la bibliothèque dans un fichier de carte (repères `/*BIB-CSS*/…/*BIB-CSS-FIN*/` et `/*BIB-JS*/…/*BIB-JS-FIN*/`, retirés puis remis à chaque lancement). Le résultat reste un fichier unique (clé USB, `file://`).
- À venir : `exercices.js`, le moteur d'exercices du français rendu commun (voir plus bas). `inserer.py` l'ajoute tout seul dès qu'il existe.

## Utilisée par
- **Maths** : `cartes-mentales-maths/carte interactives maths en construction/integrer.py` (étape 14). Relancer `python3 integrer.py` après toute modification de la bibliothèque.
- **Français** : `cartes-mentales-fr/index.html` (pas de générateur) : après une modification de la bibliothèque, relancer
  `python3 -c "import sys,pathlib;sys.path.insert(0,'../cartes-bibliotheque');import inserer as B;p=pathlib.Path('index.html');p.write_text(B.inserer(p.read_text(encoding='utf8'),'</style>','const retiensFr='),encoding='utf8')"` depuis `cartes-mentales-fr/`.

## Règles
- Modifier la bibliothèque ICI, jamais dans les blocs `BIB` des cartes (ils sont remplacés au prochain lancement).
- Couleur de la leçon : variable `--z`. Taille du texte : `--cu-u` (1rem par défaut). Classes préfixées `cu-`.

## Moteur d'exercices commun (`exercices.js`, 14/11/2026)
Le moteur du français, extrait de `startAtoi` : `CartesExo.html()` (balisage de l'exercice) et `CartesExo.session({...})` (file d'exercices, exercices « à revoir », personnage qui commente, sons, voix 🔊, étoile, aide en deux temps, passage automatique, bilan, « Refaire une série », bouton de l'étape suivante). Mode d'emploi complet en tête de `exercices.js`. Les types d'exercices (cliquer des mots, choisir, remettre en ordre, dictée, « a-t-il raison ? ») restent dans la carte qui les connaît : elle les branche par `charger(ex, ctx)`.
- **Français : fait.** `startAtoi` (`cartes-mentales-fr/index.html`) est construit sur `CartesExo.session`. Vérifié par un robot qui répond aux exercices (étapes Avec aide, Seul, Je corrige).
- **Maths : fait (14/11/2026).** `sources/coeur.js` : `serie` (Avec aide / Seul) et `trouver` (Je corrige) sont construits sur `CartesExo.session` ; ne restent que les types de réponse des maths (`repQ` : clavier, choix, grille, étiquettes, mots qui prennent un s). Règle des deux essais comme en français (1re erreur : encouragement + indice 💡 ; 2e : réponse montrée, il faut la donner ; exercice raté reproposé). `assembler.py` colle `exercices.css` + `exercices.js` dans les pages. Reste : le français garde sa copie du CSS des exercices dans sa feuille de style (à retirer pour n'avoir qu'une source).
- Pour les tests automatiques : `CartesExo.derniere` donne la dernière session (`.cur()` = exercice en cours).
