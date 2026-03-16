# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Séparation en 3 onglets

L'onglet "Paramètres" actuel mélange la gestion des environnements et les réglages globaux. Séparer en 3 onglets distincts.

### Nouvel ordre des onglets :

**Jumper** | **Environnements** | **Paramètres**

---

### Onglet "Jumper" (inchangé)
- Comportement actuel : matching de l'URL, cards des environnements, liens rapides, popover multisite, etc.

---

### Onglet "Environnements" (nouveau nom, récupère le contenu de l'ancien "Paramètres")

Contient tout ce qui concerne la gestion des **groupes et environnements** :
- Liste des groupes (cartes dépliables)
- CRUD des groupes (ajouter, renommer, supprimer)
- CRUD des environnements par groupe (nom, domaine, protocole, couleur, basic auth)
- Sélecteur CMS par groupe
- Configuration WordPress Multisite (type, sites du réseau)
- Gestion des liens par groupe (CMS, custom, network, drag & drop, icônes, badges, multisitePrefix)

---

### Onglet "Paramètres" (réglages globaux uniquement)

Contient uniquement les réglages qui s'appliquent à **toute l'extension** :

**Section "Affichage" / "Display" :**
- Position du badge d'environnement (sélecteur visuel 4 coins)

**Section "Données" / "Data" :**
- Export (tout ou par groupe, avec checkbox optionnelle pour les identifiants basic auth)
- Import (avec gestion fusion/remplacement)

---

### Traductions :

Mettre à jour les clés i18n :
- "Environnements" / "Environments" (nouveau nom d'onglet)
- "Paramètres" / "Settings" (reste le même mais change de contenu)
- "Affichage" / "Display"
- "Données" / "Data"

---

### Mise à jour du CLAUDE.md :

Après implémentation, mettre à jour le CLAUDE.md pour refléter la nouvelle structure à 3 onglets et la répartition du contenu.