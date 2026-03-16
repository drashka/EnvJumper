# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## 1. Refactoring WordPress Multisite : préfixes au lieu de domaines complets

### Problème actuel :
`wpNetworkDomain` et les domaines dans `wpSites` sont des valeurs fixes, alors que le domaine de base change selon l'environnement. Ça ne fonctionne pas.

### Nouvelle approche :
- **Supprimer** le champ `wpNetworkDomain` — le domaine de base vient de l'environnement sur lequel on se trouve.
- **`wpSites` ne stocke plus des domaines complets** mais des **préfixes** et un label.
- Un champ `wpMultisiteType` au niveau du groupe définit le mode : `"subdomain"` ou `"subdirectory"`. C'est un choix global par groupe.

### Nouveau modèle de données :

```json
{
  "isWordPressMultisite": true,
  "wpMultisiteType": "subdomain",
  "wpSites": [
    { "label": "Français", "prefix": "fr" },
    { "label": "English", "prefix": "en" },
    { "label": "Deutsch", "prefix": "de" },
    { "label": "Principal", "prefix": "" }
  ]
}
```

### Construction des URLs :

Le domaine de base est celui de l'environnement actif (ex: `monsite.com` en prod, `staging.monsite.com` en staging).

**Mode sous-domaines (`"subdomain"`)** :
- Préfixe non vide → `{prefix}.{domaine_env}` → `fr.monsite.com`
- Préfixe vide → `{domaine_env}` → `monsite.com`

**Mode sous-dossiers (`"subdirectory"`)** :
- Préfixe non vide → `{domaine_env}/{prefix}/` → `monsite.com/fr/`
- Préfixe vide → `{domaine_env}` → `monsite.com`

Pour les liens, on ajoute le path après :
- Sous-domaine : `https://fr.monsite.com/wp-admin/options-permalink.php`
- Sous-dossier : `https://monsite.com/fr/wp-admin/options-permalink.php`

### UI dans l'onglet Paramètres :
- Quand WordPress Multisite est activé, afficher un sélecteur **"Type de multisite"** avec deux options : "Sous-domaines" / "Subdomains" et "Sous-dossiers" / "Subdirectories".
- Le formulaire des sites affiche pour chaque site : un champ "Label" et un champ "Préfixe" / "Prefix" (qui peut être vide pour le site principal).
- Un aperçu dynamique montre le résultat pour l'environnement actuel (ex: "→ fr.monsite.com" ou "→ monsite.com/fr/").

---

## 2. Bouton "Ouvrir sur tous les sites" par lien (WordPress Multisite)

Quand un groupe a WordPress Multisite activé, chaque lien (WP prédéfini ou custom) dans l'onglet Jumper doit avoir un **bouton supplémentaire "Ouvrir sur tous les sites"**.

### Comportement :
- Au clic, ouvre **un nouvel onglet par site du réseau** (`wpSites`) avec le même path que le lien.
- La construction d'URL utilise la logique décrite ci-dessus selon le `wpMultisiteType`.
- Fonctionne pour **tous les liens** : WP prédéfinis et custom.

### UI dans l'onglet Jumper :
- Chaque ligne de lien a déjà une icône "nouvel onglet" à droite. Ajouter à côté une **deuxième icône** reconnaissable représentant "ouvrir sur tous les sites" (par exemple une icône de plusieurs onglets ou une icône de grille/réseau).
- Au hover, un tooltip indique "Ouvrir sur tous les sites" / "Open on all sites".
- Ce bouton n'apparaît **que** si le groupe a `isWordPressMultisite: true` et que des `wpSites` sont configurés.

---

## 3. Export / Import

- Le champ `wpNetworkDomain` est supprimé.
- Prendre en compte les nouveaux champs `wpMultisiteType` et `prefix` dans `wpSites`.

---

## 4. Traductions

Ajouter les clés i18n dans les deux langues pour :
- "Type de multisite" / "Multisite type"
- "Sous-domaines" / "Subdomains"
- "Sous-dossiers" / "Subdirectories"
- "Préfixe" / "Prefix"
- "Ouvrir sur tous les sites" / "Open on all sites"

---

## 5. Mise à jour du CLAUDE.md

Après implémentation, mettre à jour le CLAUDE.md pour refléter :
- La suppression de `wpNetworkDomain`
- Le nouveau modèle `wpSites` avec préfixes
- Le champ `wpMultisiteType` (choix global par groupe)
- La logique de construction d'URLs
- Le bouton "Ouvrir sur tous les sites" par lien