# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## 1. Support multi-CMS

Actuellement, seul WordPress est supporté comme CMS. Étendre le système pour supporter **6 CMS** au total. Le toggle "WordPress" devient un sélecteur de CMS au niveau du groupe.

### Nouveau modèle de données :

Le champ `isWordPress` est remplacé par un champ `cms` au niveau du groupe :

```json
{
  "cms": "wordpress",
  "cmsLoginPath": "/wp-login.php",
  "links": [...]
}
```

Valeurs possibles pour `cms` : `"none"`, `"wordpress"`, `"joomla"`, `"drupal"`, `"prestashop"`, `"magento"`, `"shopify"`.

### UI dans l'onglet Paramètres :

- Remplacer le toggle "WordPress" par un **sélecteur déroulant "CMS"** avec les options : Aucun, WordPress, Joomla, Drupal, PrestaShop, Magento, Shopify.
- Le champ **"URL de connexion"** (`cmsLoginPath`) reste personnalisable, pré-rempli avec la valeur par défaut du CMS choisi.
- L'option **WordPress Multisite** n'apparaît que si le CMS sélectionné est WordPress (c'est le seul à avoir cette fonctionnalité).
- La détection de connexion (classe `logged-in` sur `<body>` / `#wpadminbar`) ne fonctionne que pour WordPress. Pour les autres CMS, ne pas afficher l'état de connexion (les liens restent toujours actifs).

### Liens prédéfinis par CMS :

Quand un CMS est sélectionné, ajouter automatiquement ses liens prédéfinis (comme on le fait déjà pour WordPress). L'utilisateur peut les supprimer, réordonner, et ajouter des liens custom en plus.

**WordPress** (existant) :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Connexion | Login | `/wp-login.php` | `log-in` |
| Tableau de bord | Dashboard | `/wp-admin/` | `layout-dashboard` |
| Articles | Posts | `/wp-admin/edit.php` | `file-text` |
| Pages | Pages | `/wp-admin/edit.php?post_type=page` | `file` |
| Médias | Media | `/wp-admin/upload.php` | `image` |
| Extensions | Plugins | `/wp-admin/plugins.php` | `puzzle` |
| Apparence | Appearance | `/wp-admin/themes.php` | `palette` |
| Réglages | Settings | `/wp-admin/options-general.php` | `settings` |
| Permaliens | Permalinks | `/wp-admin/options-permalink.php` | `link` |

**Joomla** :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Connexion | Login | `/administrator/index.php` | `log-in` |
| Tableau de bord | Dashboard | `/administrator/` | `layout-dashboard` |
| Articles | Articles | `/administrator/index.php?option=com_content` | `file-text` |
| Catégories | Categories | `/administrator/index.php?option=com_categories` | `folder` |
| Médias | Media | `/administrator/index.php?option=com_media` | `image` |
| Extensions | Extensions | `/administrator/index.php?option=com_installer` | `puzzle` |
| Utilisateurs | Users | `/administrator/index.php?option=com_users` | `users` |
| Configuration | Configuration | `/administrator/index.php?option=com_config` | `settings` |

**Drupal** :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Connexion | Login | `/user/login` | `log-in` |
| Administration | Administration | `/admin` | `layout-dashboard` |
| Contenu | Content | `/admin/content` | `file-text` |
| Structure | Structure | `/admin/structure` | `blocks` |
| Apparence | Appearance | `/admin/appearance` | `palette` |
| Modules | Modules | `/admin/modules` | `puzzle` |
| Configuration | Configuration | `/admin/config` | `settings` |
| Personnes | People | `/admin/people` | `users` |
| Rapports | Reports | `/admin/reports` | `bar-chart-2` |

**PrestaShop** :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Connexion | Login | `/admin-dev/index.php` | `log-in` |
| Tableau de bord | Dashboard | `/admin-dev/` | `layout-dashboard` |
| Commandes | Orders | `/admin-dev/index.php?controller=AdminOrders` | `shopping-cart` |
| Catalogue | Catalog | `/admin-dev/index.php?controller=AdminProducts` | `package` |
| Clients | Customers | `/admin-dev/index.php?controller=AdminCustomers` | `users` |
| Modules | Modules | `/admin-dev/index.php?controller=AdminModules` | `puzzle` |
| Design | Design | `/admin-dev/index.php?controller=AdminThemes` | `palette` |
| Paramètres | Settings | `/admin-dev/index.php?controller=AdminPreferences` | `settings` |

**Magento** :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Connexion | Login | `/admin/` | `log-in` |
| Tableau de bord | Dashboard | `/admin/dashboard/` | `layout-dashboard` |
| Catalogue | Catalog | `/admin/catalog/product/` | `package` |
| Commandes | Orders | `/admin/sales/order/` | `shopping-cart` |
| Clients | Customers | `/admin/customer/index/` | `users` |
| Contenu | Content | `/admin/cms/page/` | `file-text` |
| Système | System | `/admin/admin/system_config/` | `settings` |

**Shopify** :
| Label FR | Label EN | Path | Icône Lucide |
|----------|----------|------|-------------|
| Admin | Admin | `/admin` | `layout-dashboard` |
| Produits | Products | `/admin/products` | `package` |
| Commandes | Orders | `/admin/orders` | `shopping-cart` |
| Clients | Customers | `/admin/customers` | `users` |
| Thèmes | Themes | `/admin/themes` | `palette` |
| Applications | Apps | `/admin/apps` | `puzzle` |
| Paramètres | Settings | `/admin/settings` | `settings` |

### Note sur PrestaShop :
Le dossier admin de PrestaShop est souvent renommé pour des raisons de sécurité (ex: `/admin-xyz/` au lieu de `/admin-dev/`). Le champ `cmsLoginPath` sert aussi de base pour ce cas, mais il faudrait un champ supplémentaire `cmsAdminPath` personnalisable, pré-rempli avec la valeur par défaut du CMS. Pour PrestaShop, la valeur par défaut est `/admin-dev/`.

Ajouter ce champ `cmsAdminPath` au modèle de données du groupe :

```json
{
  "cms": "prestashop",
  "cmsLoginPath": "/admin-dev/index.php",
  "cmsAdminPath": "/admin-dev",
  "links": [...]
}
```

Quand l'utilisateur change `cmsAdminPath`, les liens prédéfinis du CMS sont automatiquement recalculés avec le nouveau chemin de base.

---

## 2. Bibliothèque d'icônes pour les liens custom

### Librairie : Lucide Icons

Utiliser **Lucide Icons** (https://lucide.dev) comme librairie d'icônes. Licence ISC, compatible GPL v3.

### Implémentation :

- Embarquer **une sélection de ~40 icônes SVG Lucide** directement dans le code de l'extension (pas de dépendance externe, pas de CDN). Chaque icône est stockée comme un string SVG dans un fichier JS dédié.
- Les icônes des CMS (listées ci-dessus) font partie de cette sélection.

### Sélection initiale d'icônes (~40) :

**Navigation & UI :**
`home`, `search`, `menu`, `external-link`, `link`, `log-in`, `log-out`

**Contenu :**
`file`, `file-text`, `image`, `video`, `music`, `folder`, `archive`

**E-commerce :**
`shopping-cart`, `package`, `credit-card`, `receipt`, `tag`, `percent`

**Utilisateurs :**
`user`, `users`, `shield`, `lock`, `key`

**Admin & technique :**
`layout-dashboard`, `settings`, `puzzle`, `palette`, `blocks`, `database`, `server`, `code`, `terminal`

**Communication :**
`mail`, `message-square`, `bell`, `phone`

**Données :**
`bar-chart-2`, `trending-up`, `activity`

### Sélecteur d'icônes dans les paramètres :

Quand l'utilisateur ajoute ou modifie un lien (custom ou CMS), afficher un **sélecteur d'icônes** :

- Un bouton qui affiche l'icône actuelle. Au clic, ouvre un **popover/dropdown** avec :
    - Un **champ de recherche** en haut (filtre les icônes par nom).
    - La **grille d'icônes** en dessous (~40 icônes affichées en miniatures cliquables).
- Au clic sur une icône, elle est sélectionnée et le popover se ferme.
- Le nom de l'icône Lucide est stocké dans le modèle de données du lien :

```json
{ "id": "link-1", "label": "Mon lien", "path": "/ma-page", "icon": "home", "type": "custom", "order": 5 }
```

- Si pas d'icône sélectionnée, utiliser une icône par défaut (`link`).

### Icônes dans l'onglet Jumper :

- Chaque lien dans la liste affiche son icône Lucide à gauche du label.
- Remplacer les icônes "dashicons WordPress" actuelles par les icônes Lucide correspondantes pour tous les CMS.

---

## 3. Traductions

Ajouter les clés i18n pour :
- Les noms des CMS dans le sélecteur
- "Aucun" / "None" pour l'option sans CMS
- "Chemin admin" / "Admin path" pour le champ `cmsAdminPath`
- "Choisir une icône" / "Choose an icon" pour le sélecteur d'icônes
- "Rechercher une icône" / "Search icon" pour le champ de recherche
- Tous les labels des liens prédéfinis des nouveaux CMS

---

## 4. Export / Import

- Le champ `isWordPress` est remplacé par `cms`.
- Ajouter le champ `cmsAdminPath`.
- Le champ `icon` est ajouté dans chaque lien.
- Pas de rétrocompatibilité nécessaire.

---

## 5. Mise à jour du CLAUDE.md

Après implémentation, mettre à jour le CLAUDE.md pour refléter :
- Le support multi-CMS avec le nouveau modèle de données
- La liste des CMS supportés et leurs liens prédéfinis
- La bibliothèque Lucide Icons et la sélection d'icônes
- Le champ `cmsAdminPath` personnalisable