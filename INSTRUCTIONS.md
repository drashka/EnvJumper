# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Remplacer le popover "Choisir le site" par une vue pleine popup

### Problème :
Le popover de choix de site multisite est coupé en bas quand il y a beaucoup de sites. L'espace dans la popup est limité.

### Solution :
Remplacer le mini popover par une **vue qui prend toute la place de la popup**, comme une navigation de type "drill-down". Au clic sur un lien avec `multisitePrefix: true`, la liste des liens est remplacée par la vue de sélection du site, avec un bouton retour pour revenir.

### Comportement :

**Au clic sur un lien avec `multisitePrefix: true` :**
1. Le contenu actuel de l'onglet Jumper **slide vers la gauche** avec une animation.
2. La vue "Choisir le site" **slide depuis la droite** et prend toute la place de la popup.
3. Cette vue contient :
    - Un **header** avec :
        - Un bouton retour (icône `arrow-left` Lucide) qui ramène à la vue précédente
        - Le titre "Choisir le site" / "Choose site"
        - Le nom du lien cliqué en sous-titre (ex: "Permaliens")
    - La **liste des sites** du réseau (`wpSites`), scrollable si nécessaire. Chaque site est un bouton sur toute la largeur avec :
        - Le label du site (ex: "Français")
        - Le préfixe entre parenthèses (ex: "(fr)")
    - Un **bouton "Tous les sites"** / **"All sites"** en bas (style distinct, ex: bordure au lieu de fond plein)
    - Un **bouton "Sans préfixe"** / **"Without prefix"** en bas

**Au clic sur un site :**
- Ouvre le lien dans un nouvel onglet avec le préfixe du site choisi.
- La vue revient automatiquement à la liste des liens (animation slide inverse).

**Au clic sur le bouton retour :**
- La vue "Choisir le site" **slide vers la droite**.
- La vue des liens **slide depuis la gauche** pour reprendre sa place.

### Animation :

- Transition CSS `transform: translateX()` avec une durée de **200-250ms** et un easing `ease-in-out`.
- Les deux vues sont dans un conteneur avec `overflow: hidden`.
- Principe :
  ```css
  .view-container {
    position: relative;
    overflow: hidden;
  }
  
  .view {
    transition: transform 0.25s ease-in-out;
  }
  
  /* Vue principale visible */
  .view--active { transform: translateX(0); }
  
  /* Vue principale cachée à gauche */
  .view--left { transform: translateX(-100%); }
  
  /* Vue site cachée à droite */
  .view--right { transform: translateX(100%); }
  ```

### Style :

- Le header de la vue "Choisir le site" reprend le style du reste de la popup (variables CSS, même typographie).
- Les boutons de site ont un hover avec légère élévation, comme les cards d'environnement.
- Le bouton retour est discret mais visible (icône + texte "Retour" / "Back").
- Les boutons "Tous les sites" et "Sans préfixe" sont visuellement distincts des boutons de site (ex: outline au lieu de fond plein, séparés par un petit espace ou un séparateur).

### Traductions :

Mettre à jour les clés i18n si nécessaire :
- "Retour" / "Back"

Les clés "Choisir le site", "Tous les sites" et "Sans préfixe" existent déjà.

---

### Mise à jour du CLAUDE.md :

Après implémentation, mettre à jour le CLAUDE.md pour documenter le pattern de navigation drill-down avec animation dans la popup.