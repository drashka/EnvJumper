# Politique de confidentialité — EnvJumper

🇬🇧 [English version](PRIVACY.md)

**Dernière mise à jour :** mars 2026

---

EnvJumper est une extension Chrome open source développée de façon indépendante. Cette politique explique clairement et simplement quelles données l'extension manipule et pourquoi.

---

## Données stockées

EnvJumper stocke les données suivantes **localement sur votre appareil**, via les APIs de stockage intégrées à Chrome :

- **Noms de projets et d'environnements** — les noms que vous donnez à vos projets et environnements
- **Domaines des environnements** — les domaines que vous configurez (ex : `staging.exemple.com`)
- **Configuration CMS** — type de CMS, chemin de connexion, chemin admin
- **Identifiants Basic Auth** — nom d'utilisateur et mot de passe pour les environnements où vous activez l'authentification HTTP Basic Auth
- **Préférences utilisateur** — position du badge, état du mode discret
- **Cache des favicons** — favicons des sites configurés, stockés localement

---

## Comment les données sont stockées

| Stockage | Quoi | Portée |
|---|---|---|
| `chrome.storage.sync` | Projets, environnements, config CMS, identifiants Basic Auth, préférences | Synchronisé entre vos appareils Chrome sur le même compte Google |
| `chrome.storage.local` | État du mode discret, cache des favicons | Appareil local uniquement |

**Aucune donnée n'est jamais envoyée à un serveur externe.** EnvJumper fonctionne entièrement en local. Il n'y a pas de backend, pas d'appel API, pas d'analytics, pas de télémétrie.

---

## Identifiants Basic Auth

Les noms d'utilisateur et mots de passe Basic Auth sont stockés dans `chrome.storage.sync`. Cela signifie qu'ils peuvent être synchronisés entre vos appareils Chrome si vous êtes connecté à Chrome. Ils sont :

- **Jamais transmis à un tiers**
- **Jamais envoyés en dehors de l'infrastructure de synchronisation de Chrome** (synchronisation chiffrée de Google)
- **Non inclus dans les exports JSON par défaut** — vous devez explicitement l'activer lors de l'export

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
| `storage` | Stocker la configuration de vos projets et environnements |
| `tabs` | Lire l'URL de l'onglet actif pour la comparer aux environnements configurés |
| `activeTab` | Détecter le type de CMS sur la page courante et injecter la bordure colorée |
| `webRequest` | Répondre automatiquement aux challenges HTTP Basic Auth sur les domaines configurés |
| `contextMenus` | Ajouter un menu clic droit pour switcher d'environnement rapidement |
| `<all_urls>` (host permissions) | Injecter la bordure colorée et le badge sur toutes les pages correspondant aux environnements configurés, et répondre aux challenges Basic Auth sur tous les domaines |

---

## Suppression de vos données

Vous pouvez supprimer toutes les données stockées par EnvJumper à tout moment :

- En supprimant des projets individuels dans l'onglet **Projets**
- En désinstallant l'extension (efface tout le stockage local)
- En supprimant les données de synchronisation de l'extension depuis les paramètres de votre compte Google

---

## Open source

EnvJumper est open source sous licence **GNU General Public License v3 (GPL-3.0)**. Le code source complet est disponible et auditable sur GitHub :

👉 [https://github.com/drashka/EnvJumper](https://github.com/drashka/EnvJumper)

---

## Contact

Pour toute question concernant cette politique de confidentialité, vous pouvez ouvrir une issue sur le dépôt GitHub.

---

*Cette extension est un projet indépendant, pas un produit d'entreprise.*
