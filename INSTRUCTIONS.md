# Instructions de modification — EnvJumper

Lis le fichier CLAUDE.md pour le contexte complet du projet.

---

## Mémoriser l'état de navigation à la réouverture de la popup

### Problème :
Quand l'utilisateur est en train d'éditer un projet (vue drill-down ouverte dans l'onglet Projets) et qu'il ferme la popup (clic ailleurs, changement d'onglet Chrome, etc.), à la réouverture la popup revient toujours sur l'onglet Jumper. L'utilisateur perd sa position et doit re-naviguer jusqu'au projet qu'il éditait.

### Solution :
Mémoriser l'état de navigation de la popup et le restaurer à la réouverture.

### Règle :
- **Si l'utilisateur était dans la vue d'édition d'un projet** (drill-down ouvert) → à la réouverture, revenir directement dans cette vue d'édition, sur le même sous-onglet.
- **Dans tous les autres cas** (onglet Jumper, liste des Projets, onglet Paramètres) → revenir sur l'onglet **Jumper** par défaut.

### Implémentation :

Stocker l'état de navigation dans `chrome.storage.session` (mémoire de session, se réinitialise à la fermeture du navigateur) :

```json
{
  "popupState": {
    "editing": true,
    "groupId": "uuid-1",
    "subTab": "environments"
  }
}
```

- `editing: true` + `groupId` → la popup s'ouvre directement sur la vue d'édition de ce projet, sur le sous-onglet indiqué par `subTab` (`"environments"`, `"cms"` ou `"links"`).
- `editing: false` ou absent → la popup s'ouvre sur l'onglet Jumper.

### Quand mettre à jour l'état :
- **Entrer dans l'édition** d'un projet → sauvegarder `editing: true`, `groupId` et `subTab`.
- **Changer de sous-onglet** dans l'édition → mettre à jour `subTab`.
- **Quitter l'édition** (bouton retour) → mettre `editing: false`.
- **Changer d'onglet principal** (Jumper ou Paramètres) → mettre `editing: false`.

### Mise à jour du CLAUDE.md :

Après implémentation, mettre à jour le CLAUDE.md pour documenter la persistance de l'état de navigation via `chrome.storage.session`.