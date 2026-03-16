# Backlog — EnvJumper — Prochaines améliorations

---

## 1. Menu clic droit contextuel ✅

**Objectif :** Pouvoir ouvrir n'importe quel lien d'une page sur un autre environnement sans passer par la popup.

**Comportement :**
- Clic droit sur un lien (`<a>`) dans une page correspondant à un environnement connu.
- Menu contextuel EnvJumper avec un sous-menu listant les autres environnements du groupe.
- Au clic sur un environnement → ouvre le lien dans un nouvel onglet en remplaçant le domaine par celui de l'environnement cible (en conservant le path du lien cliqué, pas de la page).
- Si basic auth activé sur l'env cible → l'injecter dans l'URL.
- Si la page ne correspond à aucun environnement connu → ne pas afficher le menu EnvJumper.

**Technique :**
- Utiliser `chrome.contextMenus` API.
- Le service worker crée/met à jour les menus contextuels dynamiquement en fonction des groupes et environnements configurés.
- Permission nécessaire : `"contextMenus"` dans le manifest.

---

## 2. Mode discret (désactiver bordure + badge) ✅

**Objectif :** Masquer temporairement les indicateurs visuels (bordure colorée + badge) sans les supprimer de la config. Utile pour les démos client, les screenshots, ou les présentations.

**Comportement :**
- Un bouton/toggle **"Mode discret"** / **"Stealth mode"** accessible depuis :
  - Le header de la popup (toujours visible, quel que soit l'onglet)
  - Et/ou via un raccourci clavier dédié
- Quand activé :
  - La bordure colorée disparaît
  - Le badge d'environnement disparaît
  - L'icône de l'extension dans la barre Chrome pourrait devenir grisée ou avoir un indicateur visuel subtil pour rappeler que le mode discret est actif
  - Le switch d'environnement continue de fonctionner normalement
- Quand désactivé → tout revient à la normale
- L'état est stocké en mémoire de session (`chrome.storage.session`) — il se réinitialise à la fermeture du navigateur (on ne veut pas oublier qu'on est en mode discret).

---

## 3. Détection du protocole HTTP / HTTPS par environnement ✅

**Objectif :** Gérer le fait que certains environnements sont en HTTP (local, dev) et d'autres en HTTPS (staging, prod).

**Comportement :**
- Ajouter un champ `protocol` par environnement : `"https"` (par défaut) ou `"http"`.
- Lors du switch d'environnement, l'URL générée utilise le protocole défini pour l'env cible.
- Exemple :
  - Prod (`https`) : `https://monsite.com/page`
  - Dev local (`http`) : `http://localhost:3000/page`

**UI dans les paramètres :**
- Un sélecteur simple (HTTPS / HTTP) à côté du champ domaine de chaque environnement.
- HTTPS sélectionné par défaut.

**Modèle de données :**
```json
{
  "id": "env-uuid-3",
  "name": "Dev local",
  "domain": "localhost:3000",
  "protocol": "http",
  "color": "#10B981"
}
```

**Note :** le matching d'environnement doit aussi prendre en compte le port si présent dans le domaine (ex: `localhost:3000` ≠ `localhost:8080`).
