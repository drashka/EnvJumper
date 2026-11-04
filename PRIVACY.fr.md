# Politique de confidentialité — EnvJumper

🇬🇧 [English version](PRIVACY.md) · 🇪🇸 [Versión en español](PRIVACY.es.md)

**Dernière mise à jour :** novembre 2026

---

EnvJumper est une extension Chrome open source développée de façon indépendante. Cette politique explique clairement et simplement quelles données l'extension manipule et pourquoi.

---

## Données stockées

EnvJumper stocke les données suivantes via les APIs de stockage intégrées à Chrome :

- **Noms de projets et d'environnements** — les noms que vous donnez à vos projets et environnements
- **Domaines des environnements** — les domaines que vous configurez (ex : `staging.exemple.com`)
- **Configuration CMS et liens rapides** — type de CMS, chemin admin, sites WordPress Multisite, liens personnalisés
- **Identifiants Basic Auth** — nom d'utilisateur et mot de passe pour les environnements où vous activez l'authentification HTTP Basic Auth
- **Préférences d'affichage** — affichage de la bordure et du badge, position et taille du badge, thème
- **Cache des favicons** — adresse du favicon de chaque projet, conservée 24 heures

---

## Comment les données sont stockées

| Stockage | Quoi | Portée |
|---|---|---|
| `chrome.storage.local` | Projets, environnements, config CMS, liens, identifiants Basic Auth, cache des favicons | Appareil local uniquement |
| `chrome.storage.sync` | Préférences d'affichage | Synchronisé entre vos appareils Chrome si vous êtes connecté à Chrome |

Vos projets et vos identifiants **ne sont pas synchronisés** : ils restent sur l'appareil où vous les avez saisis. Pour les transférer, utilisez l'export JSON.

---

## Requêtes réseau

EnvJumper n'a pas de backend, pas d'analytics et pas de télémétrie. Les seules requêtes effectuées par l'extension elle-même servent à afficher l'icône de vos projets :

- **Vos domaines configurés** — EnvJumper tente de récupérer `/favicon.ico` sur les domaines de vos environnements.
- **Service de favicons de Google** — si aucun favicon n'est trouvé, EnvJumper charge l'icône depuis `https://www.google.com/s2/favicons`. Le **nom de domaine** du premier environnement du projet est alors transmis à Google. Aucune autre donnée (chemin, identifiants, nom du projet) n'est envoyée.

---

## Contenu des pages

Lorsque vous créez un projet depuis un site, EnvJumper analyse la page courante **localement** pour détecter le CMS utilisé (WordPress, Joomla, Drupal…). Sur les sites WordPress configurés, il vérifie aussi si vous êtes connecté, pour adapter les liens d'administration. Ces informations ne sont ni stockées en dehors de la configuration du projet, ni transmises à qui que ce soit.

---

## Identifiants Basic Auth

Les noms d'utilisateur et mots de passe Basic Auth sont stockés dans `chrome.storage.local`, sur votre appareil uniquement. Ils sont :

- **Envoyés uniquement au domaine pour lequel vous les avez configurés**, en réponse à une demande d'authentification de ce domaine
- **Jamais transmis à un tiers**
- **Inclus dans les exports JSON par défaut** — une case à cocher permet de les exclure avant l'export. Si vous les incluez, le fichier exporté contient les mots de passe en clair : partagez-le avec précaution.

---

## Aucun tracking

EnvJumper ne collecte **aucune donnée d'usage** de quelque nature que ce soit :

- Aucun analytics
- Aucun cookie
- Aucun identifiant publicitaire
- Aucun rapport de crash envoyé à l'extérieur
- Aucune télémétrie

---

## Explication des permissions

| Permission | Pourquoi elle est nécessaire |
|---|---|
| `storage` | Stocker la configuration de vos projets, environnements et préférences |
| `tabs` | Lire l'URL de l'onglet actif pour la comparer aux environnements configurés et ouvrir un environnement dans un nouvel onglet |
| `activeTab` | Accéder à l'onglet courant lorsque vous utilisez l'extension |
| `scripting` | Détecter le CMS de la page courante lors de la création d'un projet |
| `webRequest`, `webRequestAuthProvider` | Répondre automatiquement aux demandes HTTP Basic Auth sur les domaines configurés |
| `contextMenus` | Ajouter un menu clic droit pour ouvrir un lien dans un autre environnement |
| `<all_urls>` (host permissions) | Afficher la bordure colorée et le badge sur les pages correspondant à vos environnements, quel que soit leur domaine, et y gérer le Basic Auth |

---

## Suppression de vos données

Vous pouvez supprimer toutes les données stockées par EnvJumper à tout moment :

- En supprimant des projets individuels dans l'onglet **Projets**
- En désinstallant l'extension (efface tout le stockage local)
- En supprimant les données de synchronisation de Chrome depuis les paramètres de votre compte Google (préférences d'affichage uniquement)

---

## Open source

EnvJumper est open source sous licence **GNU General Public License v3 (GPL-3.0)**. Le code source complet est disponible et auditable sur GitHub :

👉 [https://github.com/drashka/EnvJumper](https://github.com/drashka/EnvJumper)

---

## Contact

Pour toute question concernant cette politique de confidentialité, vous pouvez ouvrir une issue sur le dépôt GitHub.

---

*Cette extension est un projet indépendant, pas un produit d'entreprise.*
