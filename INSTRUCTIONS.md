# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Refactoring de l'architecture — Découpage strict à 300 lignes max

### Problème :
Plusieurs fichiers dans `popup/modules/` dépassent les 1000 lignes. Le code devient difficile à maintenir et Claude Code perd le contexte. Il faut découper de manière stricte et organisée.

### Règle absolue :
**Aucun fichier ne doit dépasser 300 lignes.** Si un fichier dépasse, il doit être découpé en sous-modules avec des responsabilités claires.

---

### Étape 1 : Analyser les fichiers actuels

Avant toute modification, lister tous les fichiers JS du projet avec leur nombre de lignes. Identifier ceux qui dépassent 300 lignes. Afficher le résultat sous forme de tableau.

---

### Étape 2 : Nouvelle architecture cible

Réorganiser `popup/modules/` avec des sous-dossiers par domaine fonctionnel et un dossier `helpers/` dédié :

```
popup/
├── popup.html
├── popup.css
├── popup.js                          # Point d'entrée, orchestration
├── modules/
│   ├── tabs.js                       # Gestion des onglets principaux (Jumper/Projets/Paramètres)
│   ├── i18n.js                       # Traductions
│   ├── icons.js                      # Registre des icônes Lucide SVG
│   │
│   ├── jumper/
│   │   ├── jumper.js                 # Vue Jumper principale (matching, rendu des cards)
│   │   ├── jumper-links.js           # Rendu des liens rapides dans les cards
│   │   └── jumper-multisite.js       # Vue drill-down "Choisir le site" + logique multisite
│   │
│   ├── projects/
│   │   ├── projects.js               # Liste des projets (cards avec favicon, navigation)
│   │   ├── editing.js                # Vue d'édition d'un projet (header, titre, sous-onglets, state)
│   │   ├── editing-envs.js           # Sous-onglet Environnements (CRUD envs, couleur, protocole, basic auth)
│   │   ├── editing-cms.js            # Sous-onglet CMS (sélecteur CMS, paths, WordPress Multisite)
│   │   └── editing-links.js          # Sous-onglet Liens rapides (CRUD liens, drag & drop, icônes, badges)
│   │
│   ├── settings/
│   │   ├── settings.js               # Onglet Paramètres (assemblage des sections)
│   │   └── import-export.js          # Export/import JSON
│   │
│   └── helpers/
│       ├── ui-helpers.js             # Éléments UI réutilisables (modales, toasts, boutons, toggles)
│       ├── dom-helpers.js            # Création d'éléments DOM, templates, classes CSS
│       ├── url-helpers.js            # Construction d'URLs (multisite, basic auth, protocole)
│       └── storage-helpers.js        # Wrappers chrome.storage (get, set, cache favicon, session state)
│
├── shared/
│   └── storage.js                    # Helpers storage partagés avec le service worker
```

---

### Étape 3 : Règles de découpage

1. **Analyser chaque fichier qui dépasse 300 lignes** et identifier les blocs logiques.
2. **Extraire chaque bloc** dans son nouveau fichier sans modifier la logique métier.
3. **Un fichier = une responsabilité claire.** Si tu ne peux pas décrire ce que fait le fichier en une phrase, c'est qu'il fait trop de choses.
4. **Les dépendances** entre modules sont explicites (imports/exports ES modules). Pas de variables globales.
5. **Les helpers** sont des fonctions pures autant que possible (entrée → sortie, pas d'effets de bord).
6. **Le dossier `helpers/`** contient uniquement des fonctions utilitaires réutilisables. Pas de logique métier, pas de rendu spécifique à un onglet.
7. **Tester après chaque extraction** : recharger l'extension dans Chrome et vérifier que tout fonctionne.
8. **Ne pas changer le comportement** — c'est un refactoring pur, zéro régression fonctionnelle.

### Découpage type pour un gros fichier :

Si par exemple `jumper.js` fait 800 lignes :
- Les fonctions de matching d'URL et rendu des cards → `jumper.js`
- Le rendu des liens dans les cards dépliables → `jumper-links.js`
- La vue drill-down multisite + popover → `jumper-multisite.js`

Si `settings.js` fait 600 lignes :
- L'assemblage de l'onglet Paramètres → `settings.js`
- L'export/import JSON → `import-export.js`

### Répartition des helpers :

**`ui-helpers.js`** — déjà existant, contient :
- Modales de confirmation
- Toasts / notifications
- Boutons réutilisables
- Toggles

**`dom-helpers.js`** — nouveau :
- `createElement(tag, classes, attrs)` et helpers similaires
- Templates de composants répétitifs (rows, cards, badges)
- Gestion des classes CSS (toggle, add, remove)

**`url-helpers.js`** — nouveau :
- Construction d'URL avec protocole
- Ajout préfixe multisite (sous-domaine ou sous-dossier)
- Matching de domaine (hostname, port)
- Ne gère plus l'injection basic auth dans l'URL (c'est le service worker qui s'en charge)

**`storage-helpers.js`** — nouveau :
- Wrappers autour de `chrome.storage.sync` et `chrome.storage.local`
- Gestion du cache favicon
- Gestion du state de la popup (`chrome.storage.session`)
- CRUD groupes, environnements, liens

---

### Étape 4 : Vérifier le résultat

Après le refactoring complet :
1. Lister à nouveau tous les fichiers JS avec leur nombre de lignes.
2. **Aucun fichier ne doit dépasser 300 lignes.**
3. Recharger l'extension et vérifier que toutes les fonctionnalités marchent.

---

### Étape 5 : Mettre à jour le CLAUDE.md

Mettre à jour le CLAUDE.md avec la nouvelle architecture complète des fichiers.