# Instructions — EnvJumper — Audit avant publication Chrome Web Store

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Objectif

Réaliser un **audit complet** du projet EnvJumper en vue de sa publication sur le Chrome Web Store. Ne pas modifier le code à ce stade — uniquement analyser et produire un **rapport détaillé** avec des recommandations classées par priorité.

---

## 1. Analyse des permissions

- Lister toutes les permissions dans `manifest.json` (`permissions`, `host_permissions`, `optional_permissions`).
- Pour **chaque permission**, vérifier si elle est réellement utilisée dans le code. Si une permission n'est pas utilisée → la signaler comme à supprimer.
- Vérifier si certaines permissions peuvent être réduites (ex: `<all_urls>` remplaçable par quelque chose de plus restreint ?).
- Rappel : chaque permission inutile augmente le risque de rejet par Google et effraie les utilisateurs à l'installation.

## 2. Sécurité

- Vérifier qu'il n'y a **aucun `eval()`**, `new Function()`, ou `innerHTML` avec du contenu non sanitisé.
- Vérifier qu'il n'y a **pas de code injecté depuis des sources externes** (CDN, scripts distants). Tout doit être local.
- Vérifier que les identifiants Basic Auth ne sont **jamais loggés** dans la console.
- Vérifier qu'il n'y a **pas de `console.log`** de debug oubliés dans le code (ou les signaler pour suppression).
- Vérifier les Content Security Policy (CSP) : le manifest ne doit pas assouplir la CSP par défaut de Chrome.
- Vérifier que le `content_scripts` n'injecte rien de dangereux dans les pages visitées.

## 3. Code mort et fichiers inutiles

- Identifier les **fonctions, variables, imports** qui ne sont jamais utilisés.
- Identifier les **fichiers JS ou CSS** qui ne sont importés nulle part.
- Identifier les **clés i18n** dans `messages.json` (FR et EN) qui ne sont plus référencées dans le code.
- Identifier les **icônes Lucide** dans le registre qui ne sont utilisées nulle part.
- Vérifier s'il y a des **fichiers temporaires, de test, ou de backup** à supprimer.

## 4. Manifest.json — conformité Chrome Web Store

- Vérifier que `manifest_version` est bien `3`.
- Vérifier que `name`, `version`, `description` sont présents et corrects.
- Vérifier que les `icons` (16, 48, 128) existent et sont au bon format PNG.
- Vérifier que la `version` suit le format attendu (ex: `1.0.0`).
- Vérifier qu'il n'y a pas de champs dépréciés ou invalides.
- Vérifier que `default_locale` est défini et que les fichiers `_locales/` correspondants existent.

## 5. Internationalisation (i18n)

- Vérifier que **tous les textes visibles** dans l'UI utilisent `chrome.i18n.getMessage()` et ne sont pas en dur dans le code.
- Vérifier la **cohérence entre les fichiers FR et EN** : mêmes clés, aucune clé manquante dans l'une ou l'autre langue.
- Signaler les textes en dur trouvés dans le HTML ou le JS.

## 6. Performance

- Identifier les appels à `chrome.storage` qui pourraient être **groupés ou mis en cache** au lieu d'être répétés.
- Vérifier que le service worker ne fait pas de travail inutile (listeners trop larges, etc.).
- Vérifier que le content script est **léger** et ne ralentit pas les pages visitées.
- Vérifier qu'il n'y a pas de **fuites mémoire** évidentes (event listeners non nettoyés, intervalles non clearés).

## 7. Qualité du code

- Vérifier la **cohérence du style** : nommage des variables/fonctions, indentation, langue des commentaires (tout en anglais).
- Identifier les **duplications de code** qui pourraient être factorisées.
- Vérifier que tous les fichiers respectent la **limite de 300 lignes**. Lister ceux qui dépassent.
- Vérifier que les **imports/exports** sont propres (pas d'imports inutilisés, pas de dépendances circulaires).

## 8. Accessibilité

- Vérifier que les éléments interactifs ont des **attributs `aria-label`** ou du texte accessible.
- Vérifier le **contraste des couleurs** dans les deux thèmes (clair et sombre).
- Vérifier que la popup est **navigable au clavier** (tab, enter, escape).

## 9. Prêt pour le Chrome Web Store — checklist

- [ ] `manifest.json` valide et complet
- [ ] Permissions minimales et justifiées
- [ ] Pas de code distant ou `eval()`
- [ ] Pas de `console.log` de debug
- [ ] Pas de code mort
- [ ] Tous les textes internationalisés
- [ ] Icônes au bon format et bon taille
- [ ] Fichier LICENSE présent
- [ ] Version définie (`1.0.0`)
- [ ] Description claire en FR et EN dans le manifest

---

## Format du rapport attendu

Produire un rapport structuré avec :

1. **Résumé** : l'extension est-elle prête ? Combien de problèmes critiques / moyens / mineurs ?
2. **Problèmes critiques** (bloquants pour la publication) : liste avec fichier, ligne, description, action recommandée.
3. **Problèmes moyens** (fortement recommandés) : idem.
4. **Problèmes mineurs** (nice to have) : idem.
5. **Points positifs** : ce qui est déjà bien fait.

Ne pas modifier le code. Uniquement analyser et reporter.