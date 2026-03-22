<p align="center">
  <img src="icons/logo-envjumper.png" alt="EnvJumper" width="200">
</p>

<p align="center">
  <strong>Sautez entre vos environnements web en un clic.</strong>
</p>

<p align="center">
  🇬🇧 <a href="README.md">English version</a>
</p>

---

EnvJumper est une extension Chrome qui permet de naviguer instantanément entre les différents environnements d'un projet web (production, staging, dev…) tout en conservant la page en cours. Une bordure colorée vous indique en permanence sur quel environnement vous vous trouvez.

---

## Fonctionnalités

- **Switch en un clic** — Passez de `prod.exemple.com/ma-page` à `staging.exemple.com/ma-page` sans retaper l'URL
- **Bordure colorée** — Identifiez visuellement l'environnement actif grâce à une bordure autour de la page (6 couleurs au choix)
- **Multi-projets** — Gérez plusieurs projets, chacun avec ses propres environnements
- **Détection automatique** — Créez un projet depuis l'onglet actif : EnvJumper détecte l'URL, le CMS et les onglets connexes ouverts pour pré-remplir vos environnements
- **Multi-CMS** — Liens rapides prédéfinis pour WordPress, Joomla, Drupal, PrestaShop, Magento et Shopify, avec détection automatique du CMS sur la page
- **WordPress Multisite** — Ouvrez un permalien sur tous les sites du réseau en un clic, accédez au Network Admin et aux plugins (modes sous-domaines et sous-dossiers), avec détection automatique des sites du réseau
- **Basic Auth** — Stockez les identifiants HTTP Basic Auth par environnement, synchronisés entre vos appareils
- **Menu clic droit** — Accédez à n'importe quel environnement directement depuis le menu contextuel du navigateur
- **Affichage personnalisable** — Activez ou désactivez indépendamment la bordure colorée et le badge depuis les Paramètres
- **Export / Import** — Partagez votre configuration entre collègues via un fichier JSON
- **Raccourci clavier** — Ouvrez la popup sans quitter le clavier (configurable dans les paramètres Chrome)
- **Thème clair / sombre** — Détection automatique selon la préférence système
- **Réglages synchronisés** — Les préférences d'affichage (bordure, badge, position) se synchronisent entre vos appareils Chrome via `chrome.storage.sync`

## Pour qui ?

EnvJumper est conçu pour toute personne travaillant sur des projets web multi-environnements : développeurs, designers, chefs de projet, QA, intégrateurs…

---

## Installation

### Depuis les sources (mode développeur)

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/drashka/EnvJumper.git
   ```
2. Ouvrez Chrome et allez sur `chrome://extensions/`
3. Activez le **Mode développeur** (en haut à droite)
4. Cliquez sur **Charger l'extension non empaquetée**
5. Sélectionnez le dossier `envjumper/`

L'icône EnvJumper apparaît dans votre barre d'extensions.

---

## Utilisation

### Ajouter un projet et ses environnements

Deux façons de créer un projet :

- **Manuellement** — Onglet Projets → **+ Ajouter un projet** : crée un projet vierge prêt à remplir
- **Depuis vos onglets** — Sur une page de votre projet, ouvrez EnvJumper → **Nouveau projet** (ou utilisez le bouton **Détecter depuis mes onglets** à la première ouverture) : EnvJumper détecte automatiquement le domaine, le CMS et les autres onglets ouverts du même projet pour pré-remplir vos environnements

Exemple de configuration :
- Production → `exemple.com` → 🔴 Rouge
- Staging → `staging.exemple.com` → 🟠 Orange
- Dev → `dev.exemple.com` → 🟢 Vert

### Naviguer entre environnements

1. Rendez-vous sur une page d'un environnement configuré (ex : `staging.exemple.com/mon-article`)
2. Cliquez sur l'icône EnvJumper
3. L'onglet **Jumper** affiche votre environnement actuel et les alternatives
4. Cliquez sur un environnement pour y accéder :
   - Bouton **onglet courant** — remplace l'URL dans l'onglet actif
   - Bouton **nouvel onglet** — ouvre dans un nouvel onglet

La bordure colorée autour de la page vous confirme l'environnement actif.

### Liens rapides CMS

Activez un CMS sur un projet pour obtenir des liens prédéfinis (connexion, tableau de bord, médias, réglages…) :
- **WordPress** — incluant le support Multisite (sous-domaines & sous-dossiers)
- **Joomla, Drupal, PrestaShop, Magento, Shopify**

Lors de l'édition d'un projet sans CMS configuré, EnvJumper analyse automatiquement la page active et propose d'activer le CMS détecté en un clic.

### Basic Auth

Dans les paramètres d'un environnement, activez Basic Auth et renseignez vos identifiants. EnvJumper gérera automatiquement les challenges d'authentification HTTP pour ce domaine.

### WordPress Multisite

1. Activez **WordPress** puis **WordPress Multisite** dans l'onglet CMS du projet
2. Choisissez le type de multisite (sous-domaines ou sous-dossiers) et ajoutez vos sites (FR, EN, DE…)
3. Des actions rapides apparaissent dans la popup :
   - Ouvrir le permalien en cours sur tous les sites
   - Accéder au Network Admin, aux extensions, thèmes, sites, utilisateurs et réglages réseau

EnvJumper peut également détecter automatiquement les sites du réseau depuis la barre d'administration WordPress et vous proposer de les ajouter directement.

### Partager sa configuration

- **Exporter** : onglet Paramètres → exporter tout ou un seul groupe → fichier JSON téléchargé (avec option d'inclure les identifiants Basic Auth)
- **Importer** : onglet Paramètres → importer → sélectionnez un fichier JSON → choisissez de remplacer ou fusionner

---

## Stack technique

- **Manifest V3**
- **Vanilla JS** — pas de framework, ES Modules natifs
- **CSS custom** — design sobre et professionnel, sans framework
- **Lucide Icons** — jeu d'icônes SVG léger
- **chrome.storage.sync** — configuration synchronisée entre appareils

---

## Développement

### Installation

```bash
git clone https://github.com/drashka/EnvJumper.git
cd EnvJumper
npm install
npx playwright install chromium
```

### Lancer les tests

```bash
npm test
```

La suite de tests utilise [Playwright](https://playwright.dev/) pour exécuter des tests end-to-end sur une instance Chrome réelle avec l'extension chargée. 59 tests couvrent le panneau Jumper, l'édition des environnements, la configuration CMS, la détection automatique, les réglages et l'export/import.

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

Vibe codé avec ❤️ par [Drashka](https://github.com/drashka) et Claude Code pour simplifier le quotidien des équipes web.
