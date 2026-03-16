<p align="center">
  <img src="envjumper/icons/logo-envjumper-small.png" alt="EnvJumper" width="200">
</p>

<p align="center">
  <strong>Sautez entre vos environnements web en un clic.</strong>
</p>

---

EnvJumper est une extension Chrome qui permet de naviguer instantanément entre les différents environnements d'un projet web (production, staging, dev…) tout en conservant la page en cours. Une bordure colorée vous indique en permanence sur quel environnement vous vous trouvez.

---

## Fonctionnalités

- **Switch en un clic** — Passez de `prod.exemple.com/ma-page` à `staging.exemple.com/ma-page` sans retaper l'URL
- **Bordure colorée** — Identifiez visuellement l'environnement actif grâce à une bordure autour de la page (12 couleurs au choix)
- **Multi-projets** — Gérez plusieurs projets, chacun avec ses propres environnements
- **WordPress Multisite** — Ouvrez un permalien sur tous les sites du réseau en un clic, accédez au Network Admin et aux extensions
- **Export / Import** — Partagez votre configuration entre collègues via un fichier JSON
- **Synchronisé** — La configuration se synchronise entre vos appareils Chrome

## Pour qui ?

EnvJump est conçu pour toute personne travaillant sur des projets web multi-environnements : développeurs, designers, chefs de projet, QA, intégrateurs…

---

## Installation

### Depuis les sources (mode développeur)

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/<votre-repo>/envjump.git
   ```
2. Ouvrez Chrome et allez sur `chrome://extensions/`
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier `envjump/`

L'icône EnvJump apparaît dans votre barre d'extensions.

---

## Utilisation

### Ajouter un projet et ses environnements

1. Cliquez sur l'icône EnvJump
2. Allez dans l'onglet **Gestion**
3. Cliquez sur **Ajouter un groupe**
4. Donnez un nom au projet (ex: "Mon site client")
5. Ajoutez vos environnements avec leur domaine et une couleur :
   - Production → `exemple.com` → 🔴 Rouge
   - Staging → `staging.exemple.com` → 🟠 Orange
   - Dev → `dev.exemple.com` → 🟢 Vert

### Naviguer entre environnements

1. Rendez-vous sur une page d'un environnement configuré (ex: `staging.exemple.com/mon-article`)
2. Cliquez sur l'icône EnvJump
3. L'onglet **Environnement actuel** affiche votre environnement et les alternatives
4. Cliquez sur un environnement pour y accéder :
   - 🔄 Bouton **onglet courant** — remplace l'URL dans l'onglet actif
   - ➕ Bouton **nouvel onglet** — ouvre dans un nouvel onglet

La bordure colorée autour de la page vous confirme l'environnement actif.

### WordPress Multisite

1. Dans la gestion d'un groupe, activez **WordPress Multisite**
2. Renseignez le domaine du network et les sites (FR, EN, DE…)
3. Les actions rapides apparaissent dans la popup :
   - Ouvrir le permalien sur tous les sites
   - Accéder au Network Admin
   - Accéder aux extensions du site ou du network

### Partager sa configuration

- **Exporter** : onglet Gestion → Export (tout ou un seul groupe) → fichier JSON téléchargé
- **Importer** : onglet Gestion → Import → sélectionnez un fichier JSON → choisissez de remplacer ou fusionner

---

## Stack technique

- **Manifest V3**
- **Vanilla JS** — pas de framework, extension légère
- **CSS custom** — design sobre et professionnel
- **chrome.storage.sync** — configuration synchronisée entre appareils

---

## Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m "Ajout de ma fonctionnalité"`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## Licence

Ce projet est distribué sous licence **GNU General Public License v3 (GPL-3.0)**.

Vous êtes libre d'utiliser, modifier et redistribuer ce logiciel, à condition que toute version dérivée soit également distribuée sous GPL v3. Voir le fichier [LICENSE](LICENSE) pour le texte complet.

---

## Auteur

Créé avec ❤️ pour simplifier le quotidien des équipes web.
