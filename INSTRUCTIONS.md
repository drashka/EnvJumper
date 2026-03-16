# Instructions de modification — EnvJump

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Refactoring de popup.js en modules

Le fichier `popup.js` fait ~1600 lignes, ce qui est trop pour un seul fichier. Il faut le découper en modules spécialisés, chacun avec une responsabilité claire.

### Objectif :
- Chaque module fait **200-300 lignes maximum**.
- Aucune régression fonctionnelle : tout doit fonctionner exactement comme avant après le refactoring.
- Le code reste en **Vanilla JS** (pas de bundler, pas de framework).

### Approche technique :

Utiliser les **ES Modules** natifs du navigateur. Dans `popup.html`, changer le script principal en module :

```html
<script type="module" src="popup/popup.js"></script>
```

Chaque fichier exporte ses fonctions/classes et le fichier principal `popup.js` importe et orchestre le tout.

### Découpage proposé :

```
popup/
├── popup.html
├── popup.css
├── popup.js              # Point d'entrée : init, routing entre onglets, orchestration (~100 lignes)
├── modules/
│   ├── storage.js        # Lecture/écriture chrome.storage.sync, helpers CRUD groupes/envs/liens
│   ├── i18n.js           # Initialisation des traductions, helper getMessage
│   ├── tabs.js           # Gestion des onglets Jumper/Paramètres, switch entre vues
│   ├── jumper.js         # Onglet Jumper : matching, rendu des cards, dépliage, liens rapides, navigation
│   ├── settings.js       # Onglet Paramètres : rendu des groupes, formulaires CRUD
│   ├── wordpress.js      # Logique WordPress : toggle WP, liens prédéfinis, multisite, détection connexion
│   ├── links.js          # Gestion des liens : ajout, suppression, drag & drop, réordonnancement
│   ├── import-export.js  # Export/import JSON, validation, rétrocompatibilité, fusion
│   └── ui-helpers.js     # Fonctions UI réutilisables : modales de confirmation, toasts, création d'éléments
```

### Règles de refactoring :

1. **Identifier les blocs logiques** dans le `popup.js` actuel avant de commencer le découpage.
2. **Extraire chaque bloc** dans son module sans modifier la logique métier.
3. **Les dépendances entre modules** doivent être explicites (imports/exports). Pas de variables globales.
4. **Le fichier `popup.js` principal** devient un orchestrateur léger : il importe les modules, initialise l'app, et branche les event listeners de haut niveau.
5. **Tester après chaque extraction** : vérifier que l'extension charge correctement et que la fonctionnalité extraite fonctionne toujours.
6. **Le manifest.json** n'a pas besoin de changer (le content script est un fichier séparé, seul le popup est concerné).
7. **Traduire tous les commentaires en anglais** : profiter du refactoring pour passer tous les commentaires du code en anglais, dans tous les fichiers du projet (popup, content script, service worker, shared). Les noms de variables et fonctions restent inchangés s'ils sont déjà explicites.

### Attention :

- `chrome.i18n.getMessage()` est disponible partout dans le contexte de l'extension, pas besoin de le passer en paramètre — mais le helper dans `i18n.js` centralise l'initialisation des attributs `data-i18n`.
- `chrome.storage.sync` est aussi disponible partout, mais les appels doivent être centralisés dans `storage.js` pour éviter la duplication.
- Le drag & drop (liens) doit rester fonctionnel après extraction dans `links.js`.

### Mise à jour du CLAUDE.md :

Après refactoring, mettre à jour le CLAUDE.md pour refléter la nouvelle architecture des fichiers popup et la convention que tous les commentaires du projet sont en anglais.