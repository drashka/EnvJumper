# CLAUDE.md — Instructions pour Claude Code

> Ce fichier est lu automatiquement par Claude Code. Il contient la spécification complète du projet EnvJumper.

## Contexte

Crée une extension Chrome (Manifest V3) appelée **EnvJumper**. Elle est destinée à toute personne travaillant sur des projets web multi-environnements : développeurs, designers, chefs de projet, QA, etc. Chaque projet peut avoir plusieurs environnements (production, staging, dev, local…). L'extension permet de "sauter" d'un environnement à l'autre en un clic tout en conservant le path de l'URL, et d'identifier visuellement l'environnement actif grâce à une bordure colorée. L'interface doit être intuitive et accessible à des profils non-techniques.

---

## Architecture générale

```
envjump/
├── manifest.json
├── popup/
│   ├── popup.html           (script tag uses type="module")
│   ├── popup.css
│   ├── popup.js             (lightweight orchestrator ~50 lines)
│   └── modules/
│       ├── i18n.js          (t(), applyI18n())
│       ├── storage.js       (getGroups, saveGroups, getSettings, saveSettings, generateId, COLOR_PALETTE, migrateData)
│       ├── ui-helpers.js    (el, show, hide, confirm, buildTargetUrl, showImportError, showImportSuccess, showImportModal)
│       ├── tabs.js          (initTabs, switchTab, setSettingsRenderer)
│       ├── jumper.js        (renderJumperPanel, findMatch, buildJumperCard)
│       ├── wordpress.js     (WP_ICONS, getDefaultWpLinks, getWpLoginStatus)
│       ├── links.js         (buildLinksSection, buildLinkSettingsRow, reorderLinks, saveLinkField)
│       ├── settings.js      (renderSettingsPanel, updateExportGroupSelect)
│       └── import-export.js (initExportImport, downloadJson, convertOldFormat, validateImportData)
├── content/
│   └── content.js        # Injecte la bordure colorée, détecte le statut WP
├── background/
│   └── service-worker.js  # Gère les événements de navigation et le badge
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── shared/
    └── storage.js         # Helpers d'accès à chrome.storage.sync
```

### Conventions de code

- **ES Modules natifs** (`import`/`export`) — pas de bundler.
- **Commentaires en anglais** dans tous les fichiers JS du popup.
- **Pas de variables globales** — toutes les dépendances passent par imports/exports.
- **Dépendance circulaire tabs ↔ settings** résolue via `setSettingsRenderer(fn)` dans `tabs.js`.

---

## Modèle de données

Tout est stocké dans `chrome.storage.sync`. **WordPress, les liens et le Multisite sont au niveau du groupe** (pas de l'environnement).

### Réglages globaux

```json
{
  "settings": {
    "badgePosition": "top-left"
  }
}
```

- **badgePosition** : position du badge d'environnement sur la page. Valeurs possibles : `top-left`, `top-right`, `bottom-left`, `bottom-right`. Par défaut : `top-left`.
- Ces réglages sont inclus dans l'export JSON et restaurés à l'import (champ optionnel).

### Groupes et environnements

```json
{
  "groups": [
    {
      "id": "uuid-1",
      "name": "Mon Projet Client",
      "isWordPress": false,
      "wpLoginPath": "/wp-login.php",
      "isWordPressMultisite": false,
      "wpNetworkDomain": "",
      "wpSites": [],
      "links": [
        { "id": "link-1", "label": "Accueil", "path": "/", "type": "custom", "iconKey": null, "order": 0 }
      ],
      "environments": [
        { "id": "env-uuid-1", "name": "Production", "domain": "exemple.com",         "color": "#EF4444" },
        { "id": "env-uuid-2", "name": "Staging",    "domain": "staging.exemple.com", "color": "#F59E0B" }
      ]
    },
    {
      "id": "uuid-2",
      "name": "Site WordPress Multilang",
      "isWordPress": true,
      "wpLoginPath": "/wp-login.php",
      "isWordPressMultisite": true,
      "wpMultisiteType": "subdomain",
      "wpSites": [
        { "label": "Français", "prefix": "fr" },
        { "label": "English",  "prefix": "en" },
        { "label": "Principal", "prefix": "" }
      ],
      "links": [
        { "id": "wp-login-xxx", "label": "Connexion",       "path": "/wp-login.php", "type": "wordpress", "iconKey": "login",     "order": 0 },
        { "id": "wp-dash-xxx",  "label": "Tableau de bord", "path": "/wp-admin/",    "type": "wordpress", "iconKey": "dashboard", "order": 1 }
      ],
      "environments": [
        { "id": "env-uuid-4", "name": "Production", "domain": "monsite.com",         "color": "#EF4444" },
        { "id": "env-uuid-5", "name": "Staging",    "domain": "staging.monsite.com", "color": "#F59E0B" }
      ]
    }
  ]
}
```

Un environnement ne contient que : `id`, `name`, `domain`, `color`. Tous les champs WordPress (`isWordPress`, `wpLoginPath`, `isWordPressMultisite`, `wpMultisiteType`, `wpSites`) et les `links` sont portés par le **groupe**.

`wpNetworkDomain` est supprimé. `wpSites` contient désormais `{ label, prefix }` au lieu de `{ label, domain }`. `wpMultisiteType` vaut `"subdomain"` ou `"subdirectory"`. Les URLs multisite sont construites via `buildMultisiteUrl(envDomain, prefix, type, path)` dans `wordpress.js`.

---

## Palette de 12 couleurs

Les couleurs proposées pour les environnements (l'utilisateur en choisit une par environnement) :

| Nom         | Hex       |
|-------------|-----------|
| Rouge       | `#EF4444` |
| Orange      | `#F97316` |
| Ambre       | `#F59E0B` |
| Jaune       | `#EAB308` |
| Vert clair  | `#84CC16` |
| Vert        | `#10B981` |
| Cyan        | `#06B6D4` |
| Bleu        | `#3B82F6` |
| Indigo      | `#6366F1` |
| Violet      | `#8B5CF6` |
| Rose        | `#EC4899` |
| Gris        | `#6B7280` |

---

## Fonctionnalités détaillées

### 1. Bordure colorée (content script)

- Quand l'URL de l'onglet actif correspond à un `domain` d'un environnement connu, injecter une **bordure visible autour de toute la page** avec la couleur de cet environnement.
- Technique : overlay `position: fixed` avec `border: 4px solid <couleur>` et `pointer-events: none`.
- Si aucune correspondance → ne rien injecter.
- La bordure se met à jour dynamiquement si l'utilisateur navigue (message `URL_CHANGED` du service worker).
- Le content script répond également au message `GET_WP_STATUS` pour détecter si l'utilisateur est connecté à WordPress (classe `logged-in` sur `body` ou présence de `#wpadminbar`).

### 2. Popup — Dimensions et design

- **Dimensions** : 510px de large, hauteur adaptée au contenu (max ~500px, scrollable).
- **Style** : sobre, propre, professionnel. Palette neutre (blancs, gris doux) avec les couleurs d'environnement comme accents. Typographie Inter ou system-ui. CSS custom, pas de framework.
- **2 onglets** en haut de la popup : **"Jumper"** et **"Paramètres"**.

### 3. Popup — Onglet "Jumper" (ex "Environnement actuel")

**Cas 1 : correspondance trouvée**
- Afficher le **nom du groupe** en label au-dessus.
- Lister **tous les environnements** du groupe sous forme de **cards repliables**.
  - **Collapsed** (par défaut) : nom + pastille de couleur + 2 boutons de navigation (même onglet / nouvel onglet).
  - **L'env actif** : badge "Actuel" à la place des boutons de navigation, fond légèrement mis en évidence.
  - **Expanded** (clic sur le header) : liste des liens rapides du groupe (`group.links`). L'URL est construite avec le domaine de l'env de la card. Chaque lien ouvre un nouvel onglet.
  - Si groupe WordPress non connecté : liens admin grisés + notice "Non connecté", seul le lien de connexion est actif.
  - Si groupe WordPress Multisite : section supplémentaire avec boutons "Ouvrir permalien sur tous les sites", "Network Admin", "Extensions du network".
- Navigation : les boutons conservent le **path + query string + hash** de l'URL actuelle en remplaçant seulement le domaine.

**Cas 2 : aucune correspondance**
- Message clair + hostname détecté.
- Bouton "Ajouter un environnement →" qui bascule vers l'onglet Paramètres.

### 4. Popup — Onglet "Paramètres" (ex "Gestion")

- **Liste des groupes** : chaque groupe est une carte/section dépliable.
- Pour chaque groupe :
  - Nom du groupe (éditable inline).
  - Liste de ses environnements avec : nom, domaine, couleur (sélecteur visuel avec les 12 pastilles). Les environnements ne portent plus aucun champ WordPress ni liens.
  - **Toggle WordPress** au niveau du groupe :
    - Si ON : ajoute automatiquement 8 liens WP prédéfinis (connexion + 7 liens admin) dans `group.links`, affiche champ `wpLoginPath`.
    - Si ON : affiche toggle **WordPress Multisite** → sélecteur `wpMultisiteType` (`subdomain`/`subdirectory`) + liste `wpSites` (label + préfixe) avec aperçu dynamique de l'URL construite.
    - Si OFF : demande confirmation si des liens WP existent, puis les supprime de `group.links`.
  - **Section Liens** : liste des liens du groupe (`group.links`), avec drag & drop natif HTML5 pour réordonner.
    - Chaque ligne : handle drag (⠿) + input label + input path + badge type (WP/custom) + bouton supprimer.
  - Boutons : "Ajouter un environnement", "Supprimer l'environnement" (avec confirmation).
- **Bouton "Ajouter un groupe"** en bas.
- **Supprimer un groupe** (avec confirmation).

### 5. Liens par groupe

Chaque groupe possède un tableau `links` (partagé entre tous ses environnements) :
```json
[
  { "id": "uuid", "label": "Accueil", "path": "/", "type": "custom", "iconKey": null, "order": 0 },
  { "id": "wp-login-xxx", "label": "Connexion", "path": "/wp-login.php", "type": "wordpress", "iconKey": "login", "order": 1 }
]
```
- **type** : `"wordpress"` (lien prédéfini WP) ou `"custom"` (lien personnalisé).
- **iconKey** : clé dans l'objet `WP_ICONS` (login, dashboard, posts, pages, media, plugins, appearance, settings, custom, newtab).
- **order** : entier pour trier les liens.
- Dans le Jumper, l'URL de chaque lien est construite avec le domaine de l'env de la card : `https://{env.domain}{link.path}`.
- Drag & drop natif HTML5 pour réordonner dans les Paramètres.

### 6. Liens WordPress prédéfinis (8 au total)

Activés automatiquement quand `isWordPress: true` :
| Label           | Path                                | iconKey    |
|-----------------|-------------------------------------|------------|
| Connexion       | `/wp-login.php` (ou `wpLoginPath`)  | login      |
| Tableau de bord | `/wp-admin/`                        | dashboard  |
| Articles        | `/wp-admin/edit.php`                | posts      |
| Pages           | `/wp-admin/edit.php?post_type=page` | pages      |
| Médias          | `/wp-admin/upload.php`              | media      |
| Extensions      | `/wp-admin/plugins.php`             | plugins    |
| Apparence       | `/wp-admin/themes.php`              | appearance |
| Réglages        | `/wp-admin/options-general.php`     | settings   |

### 7. Détection connexion WordPress

- Le content script détecte `document.body.classList.contains('logged-in')` OU `!!document.getElementById('wpadminbar')`.
- La popup demande le statut via `chrome.tabs.sendMessage(tabId, { type: 'GET_WP_STATUS' })`.
- Réponse : `{ isLoggedIn: bool }`.
- Si non connecté : les liens admin WP sont grisés dans le Jumper, seul le lien Connexion reste actif.

### 8. Migration des données existantes

Au démarrage, `migrateData()` migre automatiquement l'ancien format :
- WordPress (`isWordPress`, `wpLoginPath`, `isWordPressMultisite`, `wpNetworkDomain`, `wpSites`) et `links` au niveau env → remontés au niveau groupe.
- Ajout des champs manquants (`links`, `isWordPress`, `wpLoginPath`, etc.) pour les groupes existants.
- Nettoyage des champs WP/liens dans les environnements (qui ne doivent plus les porter).

### 9. Export / Import JSON

- Dans l'onglet "Paramètres", section Export/Import :
  - **Exporter tout** : télécharge un JSON avec tous les groupes (nouveau format).
  - **Exporter un groupe** : menu déroulant + bouton.
  - **Importer** : bouton pour importer un fichier JSON.
    - Si JSON contient un seul groupe → ajoute aux groupes existants.
    - Si JSON contient plusieurs groupes → demander remplacer ou fusionner.
    - **Rétrocompatibilité** : si JSON en ancien format (WP/liens au niveau env, ou WP Multisite au niveau groupe) → `convertOldFormat()` migre automatiquement vers le nouveau format (WP/liens au niveau groupe).
  - Validation du JSON avec message d'erreur clair.

---

## Comportement de matching des domaines

Pour savoir si l'URL active correspond à un environnement :
1. Extraire le **hostname** de l'URL active (sans port).
2. Comparer avec le champ `domain` de chaque environnement de chaque groupe.
3. Le matching est **exact**. Exemples :
   - URL `https://staging.exemple.com/page` → matche `staging.exemple.com`
   - URL `https://exemple.com/page` → matche `exemple.com`
   - URL `https://other.exemple.com/page` → ne matche pas `exemple.com`
4. Pour WordPress Multisite (au niveau groupe) en mode `subdomain`, reconstruire les hostnames via `${prefix}.${env.domain}` pour chaque site et chaque env. En mode `subdirectory`, le hostname est `env.domain` (déjà couvert par la règle directe).

---

## Permissions requises (manifest.json)

```json
{
  "name": "EnvJumper",
  "description": "Sautez entre vos environnements web en un clic. Bordure colorée, gestion de projets, support WordPress Multisite.",
  "manifest_version": 3,
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/content.js"],
    "run_at": "document_start"
  }],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "background/service-worker.js"
  }
}
```

---

## Contraintes techniques

- **Manifest V3** obligatoire (V2 est déprécié).
- **Pas de framework JS** (pas de React, Vue, etc.) — Vanilla JS uniquement.
- **Pas de framework CSS** — CSS custom, propre, bien structuré.
- **Thème clair/sombre** : détection automatique via `prefers-color-scheme`. Variables CSS : `--bg-primary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border`, `--accent-blue` (#4299E1), `--accent-green` (#48BB78), `--accent-red` (#E53E3E), `--accent-orange` (#F6AD55).
- **Logo** : `icons/logo-EnvJumper-small.png` utilisé dans le header de la popup et comme icône 48/128px. `icons/logo-EnvJumper.png` utilisé dans le README.
- **i18n** : système `chrome.i18n` natif. Fichiers de traduction dans `_locales/fr/messages.json` et `_locales/en/messages.json`. Langue par défaut : français. Fonction helper `t(key, subs)` dans popup.js. Éléments HTML statiques traduits via `data-i18n="clé"` + `applyI18n()` au chargement.
- **`chrome.storage.sync`** pour la persistance (synchronisé entre appareils).
- Le code doit être propre, commenté en anglais, et bien structuré.
- **Licence GPL v3** : inclure un fichier `LICENSE` à la racine du projet. En-tête de licence en haut de chaque fichier JS :
  ```
  // EnvJumper - https://github.com/<votre-repo>/envjumper
  // Copyright (C) 2026 <Votre Nom>
  // Licence : GPL v3 — voir le fichier LICENSE
  ```

---

## Priorité d'implémentation

1. Modèle de données + stockage (`chrome.storage.sync`) + migration
2. Onglet "Paramètres" (CRUD groupes, environnements, liens, toggle WP)
3. Content script (bordure colorée + détection statut WP)
4. Onglet "Jumper" (cards repliables, liens rapides, statut WP)
5. Fonctionnalités WordPress Multisite (au niveau env)
6. Export / Import JSON (avec rétrocompatibilité ancien format)
