// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Helper : enveloppe un chemin SVG dans un élément <svg> Lucide standard.
 * @param {string} p - Contenu SVG (paths, circles, etc.)
 * @returns {string}
 */
function i(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

/**
 * Collection d'icônes Lucide utilisées dans l'extension.
 * Chaque valeur est une chaîne HTML contenant un <svg> complet.
 */
export const ICONS = {
  // ── Navigation & UI
  'home':          i(`<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`),
  'search':        i(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`),
  'external-link': i(`<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>`),
  'link':          i(`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`),
  'log-in':        i(`<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>`),
  'log-out':       i(`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>`),

  // ── Contenu
  'file':          i(`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/>`),
  'file-text':     i(`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>`),
  'image':         i(`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`),
  'video':         i(`<path d="m22 8-6 4 6 4V8z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>`),
  'music':         i(`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`),
  'folder':        i(`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`),
  'archive':       i(`<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>`),

  // ── E-commerce
  'shopping-cart': i(`<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>`),
  'package':       i(`<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>`),
  'credit-card':   i(`<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>`),
  'receipt':       i(`<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>`),
  'tag':           i(`<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>`),
  'percent':       i(`<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>`),

  // ── Utilisateurs
  'user':          i(`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`),
  'users':         i(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`),
  'shield':        i(`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`),
  'lock':          i(`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`),
  'key':           i(`<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>`),

  // ── Admin & technique
  'layout-dashboard': i(`<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`),
  'settings':         i(`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`),
  'puzzle':           i(`<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.69c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"/>`),
  'palette':          i(`<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`),
  'layers':           i(`<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.83l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.93 9.5"/><path d="m6.08 14.5-3.5 1.6a1 1 0 0 0 0 1.83l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.93 14.5"/>`),
  'database':         i(`<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`),
  'server':           i(`<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>`),
  'code':             i(`<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`),
  'terminal':         i(`<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>`),

  // ── Communication
  'mail':            i(`<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`),
  'message-square':  i(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`),
  'bell':            i(`<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`),
  'phone':           i(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.95 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.93 1.29h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`),

  // ── Données
  'bar-chart-2':   i(`<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>`),
  'trending-up':   i(`<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`),
  'activity':      i(`<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>`),
};

/**
 * Liste triée des noms d'icônes disponibles.
 * @type {string[]}
 */
export const ICON_NAMES = Object.keys(ICONS).sort();

/**
 * Construit un sélecteur d'icône (bouton + popover avec grille et recherche).
 * @param {string} currentIcon - Clé d'icône sélectionnée initialement
 * @param {Function} onSelect - Callback appelé avec le nom de l'icône choisie
 * @returns {HTMLElement} Un <div class="icon-picker">
 */
export function buildIconPicker(currentIcon, onSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'icon-picker';

  // Bouton déclencheur
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'icon-picker-btn';
  btn.title = chrome.i18n.getMessage('chooseIcon') || 'Choose an icon';
  btn.innerHTML = ICONS[currentIcon] || ICONS['link'];
  wrapper.appendChild(btn);

  // Popover — appended to document.body to escape overflow:hidden/auto containers
  const popover = document.createElement('div');
  popover.className = 'icon-picker-popover';
  popover.hidden = true;
  document.body.appendChild(popover);

  // Champ de recherche
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'icon-picker-search';
  searchInput.placeholder = chrome.i18n.getMessage('searchIcon') || 'Search icon…';
  popover.appendChild(searchInput);

  // Grille d'icônes
  const grid = document.createElement('div');
  grid.className = 'icon-picker-grid';

  /**
   * Reconstruit la grille en fonction d'un filtre de recherche.
   * @param {string} filter
   */
  function renderGrid(filter) {
    grid.innerHTML = '';
    const filtered = filter
      ? ICON_NAMES.filter((name) => name.includes(filter.toLowerCase()))
      : ICON_NAMES;

    filtered.forEach((name) => {
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = 'icon-picker-item' + (name === currentIcon ? ' selected' : '');
      itemBtn.dataset.icon = name;
      itemBtn.title = name;
      itemBtn.innerHTML = ICONS[name];

      itemBtn.addEventListener('click', () => {
        currentIcon = name;
        btn.innerHTML = ICONS[name];
        popover.hidden = true;
        // Mettre à jour la sélection visuelle
        grid.querySelectorAll('.icon-picker-item').forEach((el) => {
          el.classList.toggle('selected', el.dataset.icon === name);
        });
        onSelect(name);
      });

      grid.appendChild(itemBtn);
    });
  }

  renderGrid('');
  popover.appendChild(grid);

  /**
   * Positions the popover using fixed coordinates computed from the button's rect.
   * Opens downward if there's enough space, upward otherwise.
   */
  function positionPopover() {
    const rect = btn.getBoundingClientRect();
    const popoverHeight = 220; // approximate: search (28) + grid (160) + padding (32)
    const popoverWidth = 220;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;

    popover.style.width = popoverWidth + 'px';
    popover.style.left = rect.left + 'px';

    if (spaceBelow >= popoverHeight || spaceBelow >= 120) {
      // Open downward
      popover.style.top = (rect.bottom + 4) + 'px';
      popover.style.bottom = '';
    } else {
      // Open upward
      popover.style.top = '';
      popover.style.bottom = (viewportHeight - rect.top + 4) + 'px';
    }
  }

  // Ouvrir/fermer le popover au clic du bouton
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = popover.hidden;
    popover.hidden = !willOpen;
    if (willOpen) {
      positionPopover();
      searchInput.value = '';
      renderGrid('');
      searchInput.focus();
    }
  });

  // Filtrage en temps réel
  searchInput.addEventListener('input', () => {
    renderGrid(searchInput.value.trim());
  });

  // Fermer le popover au clic en dehors
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && !popover.contains(e.target)) {
      popover.hidden = true;
    }
  });

  return wrapper;
}
