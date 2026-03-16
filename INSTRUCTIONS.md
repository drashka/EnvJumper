# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Choix du site multisite + liens network (mode sous-dossiers)

### Contexte :
En WordPress Multisite sous-dossiers, il y a 3 comportements différents pour les liens :
1. Les liens admin WP ont besoin du préfixe site (`/fr/wp-admin/...`)
2. Les liens custom n'en ont pas besoin par défaut (mais c'est activable)
3. Les liens network n'en ont jamais besoin (ils sont au niveau du réseau global)

Ce système ne s'applique qu'en mode **sous-dossiers**. En mode **sous-domaines**, pas de changement.

---

### 1. Nouveau type de lien : "network"

Quand WordPress Multisite est activé, ajouter automatiquement des **liens network prédéfinis** dans la liste des liens du groupe. Ces liens s'ouvrent toujours sur le domaine de base de l'environnement, sans préfixe de site.

**Liens network prédéfinis :**

| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Admin réseau | Network Admin | `/wp-admin/network/` | `network` |
| Extensions réseau | Network Plugins | `/wp-admin/network/plugins.php` | `puzzle` |
| Thèmes réseau | Network Themes | `/wp-admin/network/themes.php` | `palette` |
| Sites du réseau | Network Sites | `/wp-admin/network/sites.php` | `globe` |
| Utilisateurs réseau | Network Users | `/wp-admin/network/users.php` | `users` |
| Réglages réseau | Network Settings | `/wp-admin/network/settings.php` | `settings` |

**Modèle de données :**

```json
{
  "id": "wp-network-1",
  "label": "Admin réseau",
  "path": "/wp-admin/network/",
  "icon": "network",
  "type": "network",
  "order": 20
}
```

- `type: "network"` → jamais de préfixe, pas de popover, pas de checkbox `multisitePrefix`.
- Les liens network sont ajoutés automatiquement quand WordPress Multisite est activé.
- Ils sont supprimés automatiquement quand WordPress Multisite est désactivé.
- Ils sont réordonnables par drag & drop avec les autres liens.
- Ils peuvent être supprimés individuellement par l'utilisateur.

---

### 2. Champ `multisitePrefix` par lien (mode sous-dossiers uniquement)

**Valeurs par défaut selon le type de lien :**

| Type de lien | `multisitePrefix` par défaut | Modifiable |
|-------------|------------------------------|------------|
| `wordpress` (liens admin CMS) | `true` | Oui |
| `custom` | `false` | Oui |
| `network` | Toujours `false`, non applicable | Non (pas de checkbox) |

---

### 3. UI dans l'onglet Paramètres :

- La checkbox "Inclure le préfixe multisite" / "Include multisite prefix" apparaît **uniquement si** :
  - Le groupe a WordPress Multisite activé **ET**
  - Le type de multisite est **sous-dossiers** (`"subdirectory"`) **ET**
  - Le lien n'est **pas** de type `network`
- **Cochée par défaut** pour les liens de type `wordpress`.
- **Décochée par défaut** pour les liens de type `custom`.
- Les liens de type `network` n'affichent pas cette checkbox.

---

### 4. UI dans l'onglet Jumper :

**Lien de type `network` :**
- Affiché dans la même liste que les autres liens.
- Un petit **badge "Network"** coloré et discret est affiché à côté du label.
- Au clic → s'ouvre directement dans un nouvel onglet sur le domaine de base de l'env, sans préfixe. Pas de popover.

**Lien avec `multisitePrefix: false` (ou non applicable) :**
- Comportement actuel. Au clic → ouvre directement le lien.

**Lien avec `multisitePrefix: true` (mode sous-dossiers) :**
- Au clic → **mini popover** ancré au lien :
  - Titre "Choisir le site" / "Choose site"
  - Liste des sites (`wpSites`) sous forme de boutons compacts avec label + préfixe entre parenthèses
  - Bouton "Tous les sites" / "All sites" → ouvre le lien sur tous les sites dans des onglets séparés
  - Bouton "Sans préfixe" / "Without prefix" → ouvre sans préfixe (site principal / contournement)
- Au clic sur un site → ouvre `https://monsite.com/fr/wp-admin/options-permalink.php`
- Au clic en dehors → ferme le popover
- Indicateur visuel : icône `globe` Lucide à côté de l'icône "nouvel onglet"

---

### 5. Traductions :

Ajouter les clés i18n pour :
- "Inclure le préfixe multisite" / "Include multisite prefix"
- "Choisir le site" / "Choose site"
- "Tous les sites" / "All sites"
- "Sans préfixe" / "Without prefix"
- "Network" (identique FR/EN pour le badge)
- Labels des 6 liens network prédéfinis (FR et EN)

---

### 6. Badge personnalisable sur les liens custom

Les liens de type `custom` peuvent avoir un **badge texte libre** pour les catégoriser. Même principe que le badge "Network" des liens network, mais avec un texte défini par l'utilisateur.

**Modèle de données :**

Ajouter un champ optionnel `badge` (string) sur les liens :

```json
{
  "id": "link-custom-1",
  "label": "UI Kit",
  "path": "/ui-kit",
  "icon": "palette",
  "type": "custom",
  "order": 10,
  "badge": "Design"
}
```

- `badge` est un texte libre, optionnel. Si vide ou absent → pas de badge affiché.
- Exemples : "Design", "SEO", "Dev", "Contenu", "API", "Tests"...
- Les liens de type `wordpress` et `network` gardent leurs badges automatiques (pas de champ `badge` modifiable).

**UI dans l'onglet Paramètres :**
- Pour chaque lien custom, ajouter un champ texte **"Badge"** / **"Badge"** (court, max ~15 caractères).
- Placeholder : "Ex: Design, SEO, API..." / "E.g.: Design, SEO, API..."

**UI dans l'onglet Jumper :**
- Le badge s'affiche à côté du label du lien, dans le même style que le badge "Network" (petit tag discret, même couleur neutre pour tous les badges custom).

**Traductions :**
- "Badge" (identique FR/EN)
- Placeholder du champ

---

### 7. Mise à jour du CLAUDE.md :

Après implémentation, mettre à jour le CLAUDE.md pour refléter :
- Les 3 types de liens : `wordpress`, `custom`, `network`
- Les 6 liens network prédéfinis
- Le champ `multisitePrefix` avec ses valeurs par défaut par type
- Le popover uniquement en mode sous-dossiers
- Le champ `badge` texte libre sur les liens custom