# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Fix scrollbar + sous-onglets sticky dans l'édition projet

### Problème 1 : Scrollbar décalée
La scrollbar n'est pas collée au bord droit de la popup. Il y a probablement un `padding-right` sur le conteneur scrollable. La scrollbar doit être tout à droite, au bord de la popup.

### Problème 2 : Sous-onglets non sticky
Les sous-onglets (Environnements / CMS / Liens rapides / Paramètres) disparaissent au scroll. Ils doivent rester visibles en haut pour que l'utilisateur puisse naviguer entre les sous-onglets sans remonter.

### Fix :

**Structure de layout à respecter dans la vue d'édition :**

```
┌─────────────────────────────┐
│ Header (← Retour  Cegid)   │  ← fixe, ne scrolle pas
├─────────────────────────────┤
│ Sous-onglets (Envs/CMS/...) │  ← sticky, reste visible au scroll
├─────────────────────────────┤
│                             │
│ Contenu scrollable          │  ← seule cette zone scrolle
│                             │
│                        ▮    │  ← scrollbar collée au bord droit
└─────────────────────────────┘
```

**CSS à appliquer :**

- Le **header** (bouton retour + favicon + titre) est en dehors de la zone scrollable.
- Les **sous-onglets** sont en `position: sticky; top: 0; z-index: 10;` avec un fond opaque (`var(--bg-primary)`) pour ne pas laisser le contenu transparaître derrière.
- Le **conteneur scrollable** est la zone sous les sous-onglets, avec `overflow-y: auto`.
- Le conteneur scrollable n'a **pas de padding-right** (ou le padding est à l'intérieur du contenu, pas sur le conteneur). La scrollbar doit toucher le bord droit de la popup.
- Le contenu à l'intérieur du conteneur scrollable a son propre padding pour l'espacement.

**Principe :**
```css
.editing-header {
  /* Fixe en haut, pas de scroll */
}

.editing-subtabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-primary);
  /* Ajouter une ombre ou bordure en bas pour marquer la séparation */
  border-bottom: 1px solid var(--border);
}

.editing-content {
  overflow-y: auto;
  flex: 1;
  /* PAS de padding-right ici */
}

.editing-content-inner {
  padding: 16px;
  /* Le padding est ici, à l'intérieur */
}
```