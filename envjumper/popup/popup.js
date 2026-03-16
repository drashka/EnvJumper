// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

'use strict';

// ─── i18n ─────────────────────────────────────────────────────────────────────

/**
 * Raccourci pour chrome.i18n.getMessage.
 * @param {string} key
 * @param {string|string[]} [subs]
 * @returns {string}
 */
function t(key, subs) {
  return chrome.i18n.getMessage(key, subs) || key;
}

/**
 * Injecte les traductions dans tous les éléments avec data-i18n.
 */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const msg = t(key);
    if (msg) el.textContent = msg;
  });
}

// ─── Palette de 12 couleurs ───────────────────────────────────────────────────

const COLOR_PALETTE = [
  { name: 'Rouge',  hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Vert',   hex: '#10B981' },
  { name: 'Bleu',   hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Gris',   hex: '#6B7280' },
];

// ─── Icônes SVG WordPress ─────────────────────────────────────────────────────

const WP_ICONS = {
  login: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="7" r="3"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 10l3-3-3-3m3 3H8"/>
  </svg>`,
  dashboard: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/>
  </svg>`,
  posts: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h12M4 8h8M4 12h10M4 16h6"/><path d="M15 12l2 2 3-3" stroke-width="1.7"/>
  </svg>`,
  pages: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2h8l4 4v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h3z"/><path d="M14 2v4h4M8 12h4M8 9h4"/>
  </svg>`,
  media: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="5" width="16" height="12" rx="2"/><circle cx="7" cy="10" r="1.5"/><path d="M2 15l4-4 3 3 3-3 6 6"/>
  </svg>`,
  plugins: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 2v4H3v10h14V6h-4V2"/><path d="M8 2h4"/><path d="M10 10v4M8 12h4"/>
  </svg>`,
  appearance: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 3a7 7 0 100 14A7 7 0 0010 3z"/><path d="M10 3c2 2 3 4.5 3 7s-1 5-3 7M10 3C8 5 7 7.5 7 10s1 5 3 7M3 10h14"/>
  </svg>`,
  settings: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="10" r="3"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.05 3.05l1.41 1.41M15.54 15.54l1.41 1.41M3.05 16.95l1.41-1.41M15.54 4.46l1.41-1.41"/>
  </svg>`,
  custom: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0z"/>
  </svg>`,
  newtab: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/>
  </svg>`,
  wordpress: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/>
    <path d="M3.75 10c0 2.55 1.48 4.76 3.63 5.83L4.4 7.27A6.24 6.24 0 003.75 10z" fill="currentColor"/>
    <path d="M14.87 9.57c0-.8-.29-1.35-.53-1.78-.33-.53-.63-1-.63-1.52 0-.6.45-1.15 1.09-1.15l.08.01A6.25 6.25 0 0010 3.75a6.25 6.25 0 00-5.28 2.9l.38.01c.62 0 1.58-.07 1.58-.07.32-.02.36.45.04.48 0 0-.32.04-.68.06l2.16 6.44 1.3-3.89-.92-2.55c-.32-.02-.62-.06-.62-.06-.32-.02-.28-.5.04-.48 0 0 .98.07 1.56.07.62 0 1.58-.07 1.58-.07.32-.02.36.45.04.48 0 0-.32.04-.68.06l2.14 6.37.59-1.97c.26-.82.46-1.41.46-1.92z" fill="currentColor"/>
    <path d="M10.07 10.64l-1.78 5.17a6.26 6.26 0 003.65-.1 1 1 0 01-.07-.14l-1.8-5.03z" fill="currentColor"/>
    <path d="M15.5 7.13a6.25 6.25 0 01-4.68 8.68l2.13-6.16c.4-.99.53-1.79.53-2.49 0-.03 0-.03-.02-.03h.04z" fill="currentColor"/>
  </svg>`,
};

// ─── Liens WordPress prédéfinis ───────────────────────────────────────────────

/**
 * Retourne les 8 liens WordPress prédéfinis pour un groupe.
 * @param {string} loginPath - Chemin de connexion personnalisé
 * @returns {Array}
 */
function getDefaultWpLinks(loginPath = '/wp-login.php') {
  return [
    { id: `wp-login-${generateId()}`,    label: t('wpLinkLogin'),      path: loginPath,                           type: 'wordpress', iconKey: 'login',      order: 0 },
    { id: `wp-dash-${generateId()}`,     label: t('wpLinkDashboard'),  path: '/wp-admin/',                        type: 'wordpress', iconKey: 'dashboard',  order: 1 },
    { id: `wp-posts-${generateId()}`,    label: t('wpLinkPosts'),      path: '/wp-admin/edit.php',                type: 'wordpress', iconKey: 'posts',      order: 2 },
    { id: `wp-pages-${generateId()}`,    label: t('wpLinkPages'),      path: '/wp-admin/edit.php?post_type=page', type: 'wordpress', iconKey: 'pages',      order: 3 },
    { id: `wp-media-${generateId()}`,    label: t('wpLinkMedia'),      path: '/wp-admin/upload.php',              type: 'wordpress', iconKey: 'media',      order: 4 },
    { id: `wp-plugins-${generateId()}`,  label: t('wpLinkPlugins'),    path: '/wp-admin/plugins.php',             type: 'wordpress', iconKey: 'plugins',    order: 5 },
    { id: `wp-themes-${generateId()}`,   label: t('wpLinkAppearance'), path: '/wp-admin/themes.php',              type: 'wordpress', iconKey: 'appearance', order: 6 },
    { id: `wp-settings-${generateId()}`, label: t('wpLinkSettings'),   path: '/wp-admin/options-general.php',     type: 'wordpress', iconKey: 'settings',   order: 7 },
  ];
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getGroups() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groups'], (result) => resolve(result.groups || []));
  });
}

async function saveGroups(groups) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ groups }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

function el(id) {
  return document.getElementById(id);
}

function show(id) {
  el(id).classList.remove('hidden');
}

function hide(id) {
  el(id).classList.add('hidden');
}

/**
 * Construit une URL en remplaçant le hostname par celui de l'environnement cible.
 * Conserve le path, query string et hash.
 */
function buildTargetUrl(currentUrl, targetDomain) {
  try {
    const url = new URL(currentUrl);
    url.hostname = targetDomain;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Interroge le content script pour savoir si l'utilisateur est connecté à WordPress.
 * @param {number} tabId
 * @returns {Promise<boolean|null>} true/false ou null si inconnu
 */
async function getWpLoginStatus(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_WP_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve(null); // inconnu
      } else {
        resolve(!!response.isLoggedIn);
      }
    });
  });
}

// ─── Réglages globaux ─────────────────────────────────────────────────────────

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      resolve(result.settings || { badgePosition: 'top-left' });
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/**
 * Construit la section "Réglages généraux" affichée en haut de l'onglet Paramètres.
 * @param {object} settings - L'objet settings courant
 */
function buildGeneralSettings(settings) {
  const section = document.createElement('div');
  section.className = 'general-settings-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('generalSettings');
  section.appendChild(title);

  // Sélecteur de position du badge
  const posLabel = document.createElement('div');
  posLabel.className = 'field-label';
  posLabel.style.marginBottom = '8px';
  posLabel.textContent = t('badgePositionLabel');
  section.appendChild(posLabel);

  // Mini-diagramme de page avec 4 coins cliquables
  const diagram = document.createElement('div');
  diagram.className = 'position-diagram';
  // Ligne du centre pour simuler la page
  const pageCenter = document.createElement('div');
  pageCenter.className = 'position-diagram-center';
  pageCenter.textContent = 'Page';
  diagram.appendChild(pageCenter);

  const POSITIONS = [
    { id: 'top-left',     label: t('posTopLeft')     },
    { id: 'top-right',    label: t('posTopRight')    },
    { id: 'bottom-left',  label: t('posBottomLeft')  },
    { id: 'bottom-right', label: t('posBottomRight') },
  ];

  POSITIONS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'position-btn' + (settings.badgePosition === id ? ' active' : '');
    btn.dataset.pos = id;
    btn.title = label;
    btn.textContent = label;
    btn.addEventListener('click', async () => {
      diagram.querySelectorAll('.position-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const current = await getSettings();
      current.badgePosition = id;
      await saveSettings(current);
    });
    diagram.appendChild(btn);
  });

  section.appendChild(diagram);
  return section;
}

// ─── Migration des données ────────────────────────────────────────────────────

/**
 * Migre les données depuis l'ancien format (WP/liens au niveau env)
 * vers le nouveau format (WP/liens au niveau groupe).
 * S'assure également que chaque groupe possède les champs attendus.
 */
async function migrateData() {
  const groups = await getGroups();
  let dirty = false;

  for (const group of groups) {
    // Assurer les champs groupe
    if (group.isWordPress === undefined) { group.isWordPress = false; dirty = true; }
    if (!group.wpLoginPath) { group.wpLoginPath = '/wp-login.php'; dirty = true; }
    if (group.isWordPressMultisite === undefined) { group.isWordPressMultisite = false; dirty = true; }
    if (!group.wpNetworkDomain) { group.wpNetworkDomain = ''; }
    if (!group.wpSites) { group.wpSites = []; dirty = true; }
    if (!group.links) {
      // Récupérer les liens depuis le premier env qui en a
      const envWithLinks = group.environments.find((e) => e.links && e.links.length > 0);
      group.links = envWithLinks ? envWithLinks.links : [];
      dirty = true;
    }
    if (!group.isWordPress) {
      // Récupérer isWordPress depuis le premier env qui l'a
      const envWithWp = group.environments.find((e) => e.isWordPress);
      if (envWithWp) {
        group.isWordPress = true;
        group.wpLoginPath = envWithWp.wpLoginPath || '/wp-login.php';
        group.isWordPressMultisite = envWithWp.isWordPressMultisite || false;
        group.wpNetworkDomain = envWithWp.wpNetworkDomain || '';
        group.wpSites = envWithWp.wpSites || [];
        dirty = true;
      }
    }

    // Nettoyer les envs : retirer les champs qui appartiennent maintenant au groupe
    for (const env of group.environments) {
      const hadExtra = env.isWordPress !== undefined || env.links !== undefined;
      delete env.isWordPress;
      delete env.wpLoginPath;
      delete env.isWordPressMultisite;
      delete env.wpNetworkDomain;
      delete env.wpSites;
      delete env.links;
      if (hadExtra) dirty = true;
    }
  }

  if (dirty) await saveGroups(groups);
}

// ─── Confirmation modale ──────────────────────────────────────────────────────

function confirm(message) {
  return new Promise((resolve) => {
    el('confirm-message').textContent = message;
    show('confirm-modal');

    function cleanup() {
      hide('confirm-modal');
      el('confirm-ok').removeEventListener('click', onOk);
      el('confirm-cancel').removeEventListener('click', onCancel);
    }

    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }

    el('confirm-ok').addEventListener('click', onOk);
    el('confirm-cancel').addEventListener('click', onCancel);
  });
}

// ─── Onglets ──────────────────────────────────────────────────────────────────

function initTabs() {
  el('tab-jumper').addEventListener('click', () => switchTab('jumper'));
  el('tab-settings').addEventListener('click', () => switchTab('settings'));
}

function switchTab(name) {
  ['jumper', 'settings'].forEach((t) => {
    el(`tab-${t}`).classList.toggle('active', t === name);
    el(`tab-${t}`).setAttribute('aria-selected', t === name ? 'true' : 'false');
    el(`panel-${t}`).classList.toggle('active', t === name);
    el(`panel-${t}`).classList.toggle('hidden', t !== name);
  });
  if (name === 'settings') renderSettingsPanel();
}

// ─── Panneau "Jumper" ─────────────────────────────────────────────────────────

/**
 * Trouve le groupe et l'environnement correspondant à un hostname.
 * Cherche dans les domains d'env ET dans les wpSites au niveau groupe.
 */
function findMatch(groups, hostname) {
  for (const group of groups) {
    for (const env of group.environments) {
      if (env.domain === hostname) return { group, env };
    }
    // WP Multisite au niveau groupe : vérifier aussi les domaines des sites du réseau
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain === hostname) {
          // Retourner le premier env du groupe comme env courant
          return { group, env: group.environments[0] || null };
        }
      }
    }
  }
  return null;
}

async function renderJumperPanel() {
  hide('jumper-match');
  hide('jumper-no-match');
  show('jumper-loading');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  let hostname;
  try {
    hostname = new URL(tab.url).hostname;
  } catch {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  const groups = await getGroups();
  const match = findMatch(groups, hostname);

  hide('jumper-loading');

  if (!match) {
    el('detected-hostname').textContent = t('detectedHostname', hostname);
    show('jumper-no-match');
    return;
  }

  const { group, env: currentEnv } = match;

  // Afficher le nom du groupe
  el('jumper-group-name').textContent = group.name;

  // Récupérer le statut WP si le groupe est WordPress
  let wpIsLoggedIn = null;
  if (group.isWordPress) {
    wpIsLoggedIn = await getWpLoginStatus(tab.id);
  }

  // Construire les cards — l'env actuel en premier, ouvert par défaut
  const cardsList = el('jumper-cards-list');
  cardsList.innerHTML = '';

  const sortedEnvs = currentEnv
    ? [currentEnv, ...group.environments.filter((e) => e.id !== currentEnv.id)]
    : group.environments;

  sortedEnvs.forEach((env) => {
    const isCurrent = currentEnv && env.id === currentEnv.id;
    const loggedIn = isCurrent ? wpIsLoggedIn : null;
    const card = buildJumperCard(env, isCurrent, tab.url, loggedIn, group);
    if (isCurrent) card.classList.add('open');
    cardsList.appendChild(card);
  });

  show('jumper-match');
}

/**
 * Construit une card d'environnement dans le Jumper.
 * @param {object} env - L'environnement
 * @param {boolean} isCurrent - Si c'est l'env actif
 * @param {string} currentUrl - URL de l'onglet actif
 * @param {boolean|null} wpIsLoggedIn - Statut de connexion WP (null = inconnu)
 * @param {object} group - Le groupe auquel appartient l'environnement
 */
function buildJumperCard(env, isCurrent, currentUrl, wpIsLoggedIn, group) {
  const card = document.createElement('div');
  card.className = 'jumper-card' + (isCurrent ? ' is-current' : '');
  card.style.setProperty('--env-color', env.color || '#6B7280');

  // ── En-tête de la card
  const header = document.createElement('div');
  header.className = 'jumper-card-header';

  // Pastille couleur
  const dot = document.createElement('span');
  dot.className = 'color-dot';
  dot.style.backgroundColor = env.color || '#6B7280';

  // Nom de l'env
  const nameSpan = document.createElement('span');
  nameSpan.className = 'jumper-card-name';
  nameSpan.textContent = env.name || t('unnamed');

  header.appendChild(dot);
  header.appendChild(nameSpan);

  if (isCurrent) {
    // Badge "Actuel" à droite du nom
    const badge = document.createElement('span');
    badge.className = 'badge-current';
    badge.style.setProperty('--env-color', env.color || '#6B7280');
    badge.textContent = t('badgeCurrent');
    header.appendChild(badge);
  }

  {
    // Boutons de navigation (même tab / nouvel onglet) — présents sur tous les envs
    const actions = document.createElement('div');
    actions.className = 'jumper-card-actions';

    const btnSameTab = document.createElement('button');
    btnSameTab.className = 'btn-icon';
    btnSameTab.title = t('navigateSameTab');
    btnSameTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 10h10M11 6l4 4-4 4"/></svg>`;
    btnSameTab.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = buildTargetUrl(currentUrl, env.domain);
      if (url) chrome.tabs.update(undefined, { url });
      window.close();
    });

    const btnNewTab = document.createElement('button');
    btnNewTab.className = 'btn-icon';
    btnNewTab.title = t('openNewTab');
    btnNewTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
    btnNewTab.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = buildTargetUrl(currentUrl, env.domain);
      if (url) chrome.tabs.create({ url });
    });

    actions.appendChild(btnSameTab);
    actions.appendChild(btnNewTab);
    header.appendChild(actions);
  }

  // Chevron pour dépliage
  const chevron = document.createElement('span');
  chevron.className = 'jumper-card-chevron';
  chevron.textContent = '▶';
  header.appendChild(chevron);

  // ── Corps de la card (liens rapides du groupe)
  const body = document.createElement('div');
  body.className = 'jumper-card-body';

  // Les liens proviennent du groupe, triés par order
  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  if (links.length > 0) {
    // Notice "Non connecté" si WordPress et non connecté (seulement pour l'env actif)
    const showWpNotice = group.isWordPress && wpIsLoggedIn === false;
    if (showWpNotice) {
      const notice = document.createElement('div');
      notice.className = 'wp-status-notice';
      notice.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="14" height="14"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01"/></svg> ${t('wpNotLoggedIn')}`;
      body.appendChild(notice);
    }

    links.forEach((link) => {
      const isAdminLink = link.type === 'wordpress' && link.iconKey !== 'login';
      const isDisabled = showWpNotice && isAdminLink;

      const row = document.createElement('button');
      row.className = 'link-quick-row' + (isDisabled ? ' disabled' : '');
      row.type = 'button';

      // Icône
      const iconKey = link.iconKey || 'custom';
      const iconSvg = WP_ICONS[iconKey] || WP_ICONS.custom;
      const iconDiv = document.createElement('span');
      iconDiv.className = 'link-icon';
      iconDiv.innerHTML = iconSvg;

      // Label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'link-label';
      labelSpan.textContent = link.label || link.path;

      // Icône "nouvel onglet"
      const newtabDiv = document.createElement('span');
      newtabDiv.className = 'link-newtab-icon';
      newtabDiv.innerHTML = WP_ICONS.newtab;

      row.appendChild(iconDiv);
      row.appendChild(labelSpan);
      row.appendChild(newtabDiv);

      if (!isDisabled) {
        row.addEventListener('click', () => {
          // L'URL est construite avec le domaine de l'env courant de la card
          const url = `https://${env.domain}${link.path}`;
          chrome.tabs.create({ url });
        });
      }

      body.appendChild(row);
    });
  } else {
    const noLinks = document.createElement('p');
    noLinks.style.cssText = 'font-size:12px;color:var(--color-text-muted);padding:4px 0;';
    noLinks.textContent = t('noLinksConfigured');
    body.appendChild(noLinks);
  }

  // Section WP Multisite (si applicable, au niveau groupe)
  if (group.isWordPressMultisite && group.wpNetworkDomain) {
    let currentPath = '/';
    try {
      const url = new URL(currentUrl);
      currentPath = url.pathname + url.search + url.hash;
    } catch {}

    const wpSection = document.createElement('div');
    wpSection.className = 'jumper-wp-multisite-section';

    const wpLabel = document.createElement('div');
    wpLabel.className = 'jumper-section-label';
    wpLabel.textContent = t('jumperWpMultisiteSection');
    wpSection.appendChild(wpLabel);

    // Bouton : ouvrir ce permalien sur tous les sites
    if (group.wpSites && group.wpSites.length > 0) {
      const btnAll = document.createElement('button');
      btnAll.className = 'link-quick-row';
      btnAll.type = 'button';
      btnAll.innerHTML = `<span class="link-icon">${WP_ICONS.plugins}</span><span class="link-label">${t('wpOpenAllSites')}</span>`;
      btnAll.addEventListener('click', () => {
        group.wpSites.forEach((site) => {
          chrome.tabs.create({ url: `https://${site.domain}${currentPath}` });
        });
      });
      wpSection.appendChild(btnAll);
    }

    // Bouton : Network Admin
    const btnNet = document.createElement('button');
    btnNet.className = 'link-quick-row';
    btnNet.type = 'button';
    btnNet.innerHTML = `<span class="link-icon">${WP_ICONS.dashboard}</span><span class="link-label">${t('wpNetworkAdmin')}</span><span class="link-newtab-icon">${WP_ICONS.newtab}</span>`;
    btnNet.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://${group.wpNetworkDomain}/wp-admin/network/` });
    });
    wpSection.appendChild(btnNet);

    // Bouton : Extensions du network
    const btnNetPlugins = document.createElement('button');
    btnNetPlugins.className = 'link-quick-row';
    btnNetPlugins.type = 'button';
    btnNetPlugins.innerHTML = `<span class="link-icon">${WP_ICONS.plugins}</span><span class="link-label">${t('wpNetworkPlugins')}</span><span class="link-newtab-icon">${WP_ICONS.newtab}</span>`;
    btnNetPlugins.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://${group.wpNetworkDomain}/wp-admin/network/plugins.php` });
    });
    wpSection.appendChild(btnNetPlugins);

    body.appendChild(wpSection);
  }

  // Clic sur le header pour ouvrir/fermer (accordéon)
  header.addEventListener('click', (e) => {
    if (e.target.closest('.btn-icon')) return;
    const isOpen = card.classList.contains('open');
    // Fermer toutes les cards
    card.closest('#jumper-cards-list').querySelectorAll('.jumper-card').forEach((c) => {
      c.classList.remove('open');
    });
    // Ouvrir celle-ci si elle était fermée, et scroller jusqu'à elle
    if (!isOpen) {
      card.classList.add('open');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

// ─── Panneau "Paramètres" ─────────────────────────────────────────────────────

async function renderSettingsPanel() {
  const [groups, settings] = await Promise.all([getGroups(), getSettings()]);
  const container = el('groups-list');
  container.innerHTML = '';

  groups.forEach((group) => {
    container.appendChild(buildGroupCard(group));
  });

  // Section "Réglages généraux" juste au-dessus de l'export/import
  const generalContainer = el('general-settings-container');
  generalContainer.innerHTML = '';
  generalContainer.appendChild(buildGeneralSettings(settings));

  updateExportGroupSelect(groups);
}

/**
 * Construit la carte d'un groupe dans les paramètres.
 * Inclut le toggle WordPress et la section liens au niveau groupe.
 */
function buildGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'group-card';
  card.dataset.groupId = group.id;

  // ── En-tête du groupe
  const header = document.createElement('div');
  header.className = 'group-header';

  const chevron = document.createElement('span');
  chevron.className = 'group-chevron';
  chevron.textContent = '▶';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'group-name-input';
  nameInput.value = group.name;
  nameInput.placeholder = 'Nom du groupe';
  nameInput.addEventListener('click', (e) => e.stopPropagation());
  nameInput.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (g) {
      g.name = nameInput.value;
      await saveGroups(groups);
      updateExportGroupSelect(groups);
    }
  });

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete-group';
  btnDelete.title = 'Supprimer ce groupe';
  btnDelete.innerHTML = '✕';
  btnDelete.addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await confirm(t('confirmDeleteGroup', group.name));
    if (ok) {
      const groups = await getGroups();
      await saveGroups(groups.filter((g) => g.id !== group.id));
      await renderSettingsPanel();
    }
  });

  header.appendChild(chevron);
  header.appendChild(nameInput);
  header.appendChild(btnDelete);

  // ── Corps du groupe
  const body = document.createElement('div');
  body.className = 'group-body';

  // Liste des environnements
  const envList = document.createElement('div');
  envList.className = 'env-manage-list';
  envList.dataset.groupId = group.id;

  group.environments.forEach((env) => {
    envList.appendChild(buildEnvItem(group.id, env));
  });
  body.appendChild(envList);

  // Bouton ajouter environnement
  const btnAddEnv = document.createElement('button');
  btnAddEnv.className = 'btn btn-sm btn-outline btn-full';
  btnAddEnv.textContent = t('addEnv');
  btnAddEnv.addEventListener('click', async () => {
    // Un environnement ne conserve que : id, name, domain, color
    const newEnv = {
      id: generateId(),
      name: '',
      domain: '',
      color: COLOR_PALETTE[0].hex,
    };
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (g) {
      g.environments.push(newEnv);
      await saveGroups(groups);
      envList.appendChild(buildEnvItem(group.id, newEnv));
    }
  });
  body.appendChild(btnAddEnv);

  // ── Toggle WordPress au niveau groupe
  const wpToggleRow = document.createElement('div');
  wpToggleRow.className = 'toggle-row';
  wpToggleRow.style.marginTop = '12px';
  wpToggleRow.style.marginBottom = '0';
  wpToggleRow.style.paddingBottom = '0';
  wpToggleRow.style.borderBottom = 'none';

  const wpToggleLabel = document.createElement('span');
  wpToggleLabel.className = 'toggle-label';
  wpToggleLabel.textContent = t('wordpress');

  const wpToggleWrapper = document.createElement('label');
  wpToggleWrapper.className = 'toggle';
  const wpToggleInput = document.createElement('input');
  wpToggleInput.type = 'checkbox';
  wpToggleInput.checked = !!group.isWordPress;
  const wpToggleTrack = document.createElement('span');
  wpToggleTrack.className = 'toggle-track';
  wpToggleWrapper.appendChild(wpToggleInput);
  wpToggleWrapper.appendChild(wpToggleTrack);

  wpToggleRow.appendChild(wpToggleLabel);
  wpToggleRow.appendChild(wpToggleWrapper);
  body.appendChild(wpToggleRow);

  // Conteneur de la section WP (affiché si isWordPress)
  const wpConfigContainer = document.createElement('div');
  wpConfigContainer.style.display = group.isWordPress ? 'block' : 'none';
  buildWpGroupConfig(group.id, group, wpConfigContainer);
  body.appendChild(wpConfigContainer);

  wpToggleInput.addEventListener('change', async () => {
    const isWp = wpToggleInput.checked;

    if (isWp) {
      // Activer WordPress : ajouter les liens prédéfinis s'ils n'existent pas déjà
      const groups = await getGroups();
      const g = groups.find((x) => x.id === group.id);
      if (g) {
        g.isWordPress = true;
        if (!g.links) g.links = [];
        // Vérifier si des liens WP existent déjà
        const hasWpLinks = g.links.some((l) => l.type === 'wordpress');
        if (!hasWpLinks) {
          const defaultLinks = getDefaultWpLinks(g.wpLoginPath || '/wp-login.php');
          g.links = [...defaultLinks, ...g.links];
        }
        await saveGroups(groups);
        // Mettre à jour group local pour reconstruire la section
        Object.assign(group, g);
      }
      wpConfigContainer.style.display = 'block';
      // Reconstruire la section WP config
      wpConfigContainer.innerHTML = '';
      buildWpGroupConfig(group.id, group, wpConfigContainer);
      // Reconstruire la section liens
      const linksSection = body.querySelector('.links-section');
      if (linksSection) linksSection.remove();
      body.appendChild(buildLinksSection(group.id, group));
    } else {
      // Désactiver WordPress
      const groups = await getGroups();
      const g = groups.find((x) => x.id === group.id);
      const wpLinksCount = g && g.links ? g.links.filter((l) => l.type === 'wordpress').length : 0;

      if (wpLinksCount > 0) {
        const ok = await confirm(t('confirmDisableWp', String(wpLinksCount)));
        if (!ok) {
          wpToggleInput.checked = true;
          return;
        }
      }

      if (g) {
        g.isWordPress = false;
        g.isWordPressMultisite = false;
        g.links = (g.links || []).filter((l) => l.type !== 'wordpress');
        await saveGroups(groups);
        Object.assign(group, g);
      }
      wpConfigContainer.style.display = 'none';
      // Reconstruire la section liens
      const linksSection = body.querySelector('.links-section');
      if (linksSection) linksSection.remove();
      body.appendChild(buildLinksSection(group.id, group));
    }
  });

  // ── Section Liens rapides au niveau groupe
  body.appendChild(buildLinksSection(group.id, group));

  // Toggle accordéon
  header.addEventListener('click', () => {
    card.classList.toggle('open');
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

/**
 * Construit le sous-formulaire WordPress au niveau du groupe.
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container - Conteneur parent où ajouter la section
 */
function buildWpGroupConfig(groupId, group, container) {
  const section = document.createElement('div');
  section.className = 'wp-env-section';

  const titleRow = document.createElement('div');
  titleRow.className = 'wp-env-section-title';
  titleRow.innerHTML = `<span style="display:inline-flex;width:14px;height:14px;flex-shrink:0">${WP_ICONS.wordpress}</span> ${t('wpConfigTitle')}`;
  section.appendChild(titleRow);

  // Champ wpLoginPath
  const loginRow = document.createElement('div');
  loginRow.className = 'field-row';
  const loginLabel = document.createElement('label');
  loginLabel.className = 'field-label';
  loginLabel.textContent = t('wpLoginPathLabel');
  const loginInput = document.createElement('input');
  loginInput.type = 'text';
  loginInput.className = 'input-sm';
  loginInput.placeholder = '/wp-login.php';
  loginInput.value = group.wpLoginPath || '/wp-login.php';
  loginInput.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.wpLoginPath = loginInput.value.trim() || '/wp-login.php';
      await saveGroups(groups);
    }
  });
  loginRow.appendChild(loginLabel);
  loginRow.appendChild(loginInput);
  section.appendChild(loginRow);

  // Toggle WordPress Multisite
  const msToggleRow = document.createElement('div');
  msToggleRow.className = 'toggle-row';
  msToggleRow.style.marginBottom = '6px';
  msToggleRow.style.paddingBottom = '6px';

  const msToggleLabel = document.createElement('span');
  msToggleLabel.className = 'toggle-label';
  msToggleLabel.textContent = t('wpMultisite');

  const msToggleWrapper = document.createElement('label');
  msToggleWrapper.className = 'toggle';
  const msToggleInput = document.createElement('input');
  msToggleInput.type = 'checkbox';
  msToggleInput.checked = !!group.isWordPressMultisite;
  const msToggleTrack = document.createElement('span');
  msToggleTrack.className = 'toggle-track';
  msToggleWrapper.appendChild(msToggleInput);
  msToggleWrapper.appendChild(msToggleTrack);

  msToggleRow.appendChild(msToggleLabel);
  msToggleRow.appendChild(msToggleWrapper);
  section.appendChild(msToggleRow);

  // Sous-section Multisite
  const msSection = document.createElement('div');
  msSection.className = 'wp-multisite-section';
  msSection.style.display = group.isWordPressMultisite ? 'block' : 'none';
  buildWpMultisiteFields(groupId, group, msSection);
  section.appendChild(msSection);

  msToggleInput.addEventListener('change', async () => {
    const isMs = msToggleInput.checked;
    msSection.style.display = isMs ? 'block' : 'none';
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.isWordPressMultisite = isMs;
      await saveGroups(groups);
    }
  });

  container.appendChild(section);
}

/**
 * Construit les champs de configuration WordPress Multisite dans un groupe.
 */
function buildWpMultisiteFields(groupId, group, container) {
  container.innerHTML = '';

  const msTitle = document.createElement('div');
  msTitle.className = 'wp-config-title';
  msTitle.textContent = t('wpMultisiteConfigTitle');
  container.appendChild(msTitle);

  // Domaine du réseau
  const networkRow = document.createElement('div');
  networkRow.className = 'field-row';
  const networkLabel = document.createElement('label');
  networkLabel.className = 'field-label';
  networkLabel.textContent = t('wpNetworkDomainLabel');
  const networkInput = document.createElement('input');
  networkInput.type = 'text';
  networkInput.className = 'input-sm';
  networkInput.placeholder = t('wpNetworkDomainPlaceholder');
  networkInput.value = group.wpNetworkDomain || '';
  networkInput.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.wpNetworkDomain = networkInput.value.trim();
      await saveGroups(groups);
    }
  });
  networkRow.appendChild(networkLabel);
  networkRow.appendChild(networkInput);
  container.appendChild(networkRow);

  // Liste des sites
  const sitesLabel = document.createElement('div');
  sitesLabel.className = 'field-label';
  sitesLabel.style.marginTop = '8px';
  sitesLabel.textContent = t('wpSitesLabel');
  container.appendChild(sitesLabel);

  const sitesList = document.createElement('div');
  sitesList.className = 'wp-sites-list';

  const sites = group.wpSites || [];
  sites.forEach((site, idx) => {
    sitesList.appendChild(buildWpSiteRow(groupId, site, idx, sitesList));
  });
  container.appendChild(sitesList);

  const btnAddSite = document.createElement('button');
  btnAddSite.className = 'btn btn-sm btn-outline';
  btnAddSite.style.marginTop = '5px';
  btnAddSite.textContent = t('addWpSite');
  btnAddSite.addEventListener('click', async () => {
    const newSite = { label: '', domain: '' };
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      if (!g.wpSites) g.wpSites = [];
      g.wpSites.push(newSite);
      await saveGroups(groups);
      const idx = g.wpSites.length - 1;
      sitesList.appendChild(buildWpSiteRow(groupId, newSite, idx, sitesList));
    }
  });
  container.appendChild(btnAddSite);
}

/**
 * Construit une ligne de site WordPress Multisite au niveau du groupe.
 */
function buildWpSiteRow(groupId, site, idx, sitesList) {
  const row = document.createElement('div');
  row.className = 'wp-site-row';
  row.dataset.siteIdx = idx;

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input-sm wp-site-label-input';
  labelInput.placeholder = t('wpSiteLabelPlaceholder');
  labelInput.value = site.label || '';

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('wpSiteDomainPlaceholder');
  domainInput.value = site.domain || '';

  async function saveSite() {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g && g.wpSites && g.wpSites[idx] !== undefined) {
      g.wpSites[idx] = { label: labelInput.value.trim(), domain: domainInput.value.trim() };
      await saveGroups(groups);
    }
  }

  labelInput.addEventListener('change', saveSite);
  domainInput.addEventListener('change', saveSite);

  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-site';
  btnRemove.title = 'Supprimer ce site';
  btnRemove.textContent = '×';
  btnRemove.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g && g.wpSites) {
      g.wpSites.splice(idx, 1);
      await saveGroups(groups);
      row.remove();
    }
  });

  row.appendChild(labelInput);
  row.appendChild(domainInput);
  row.appendChild(btnRemove);
  return row;
}

/**
 * Construit l'item d'un environnement dans les paramètres.
 * Un environnement ne conserve que : nom, domaine, couleur.
 */
function buildEnvItem(groupId, env) {
  const item = document.createElement('div');
  item.className = 'env-manage-item';
  item.dataset.envId = env.id;

  // Ligne 1 : Nom + bouton supprimer
  const row1 = document.createElement('div');
  row1.className = 'env-manage-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input-sm';
  nameInput.placeholder = t('envNamePlaceholder');
  nameInput.value = env.name || '';
  nameInput.addEventListener('change', () => saveEnvField(groupId, env.id, 'name', nameInput.value));

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete-env';
  btnDelete.title = 'Supprimer cet environnement';
  btnDelete.innerHTML = '✕';
  btnDelete.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteEnv', env.name || t('unnamed')));
    if (ok) {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        g.environments = g.environments.filter((e) => e.id !== env.id);
        await saveGroups(groups);
        item.remove();
      }
    }
  });

  row1.appendChild(nameInput);
  row1.appendChild(btnDelete);
  item.appendChild(row1);

  // Ligne 2 : Domaine
  const row2 = document.createElement('div');
  row2.className = 'env-manage-row';

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('envDomainPlaceholder');
  domainInput.value = env.domain || '';
  domainInput.addEventListener('change', () => {
    // Nettoyer le domaine : retirer protocole, chemins, espaces
    let raw = domainInput.value.trim();
    try {
      if (raw.includes('://')) raw = new URL(raw).hostname;
      else raw = raw.split('/')[0].split('?')[0];
    } catch {}
    domainInput.value = raw;
    saveEnvField(groupId, env.id, 'domain', raw);
  });

  row2.appendChild(domainInput);
  item.appendChild(row2);

  // Ligne 3 : Sélecteur de couleur
  const colorPicker = document.createElement('div');
  colorPicker.className = 'color-picker';

  COLOR_PALETTE.forEach(({ name, hex }) => {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch' + (env.color === hex ? ' selected' : '');
    swatch.style.backgroundColor = hex;
    swatch.title = name;
    swatch.type = 'button';
    swatch.addEventListener('click', async () => {
      colorPicker.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      await saveEnvField(groupId, env.id, 'color', hex);
    });
    colorPicker.appendChild(swatch);
  });

  item.appendChild(colorPicker);

  return item;
}

/**
 * Construit la section "Liens rapides" d'un groupe dans les paramètres.
 * Avec drag & drop natif HTML5.
 * @param {string} groupId
 * @param {object} group
 */
function buildLinksSection(groupId, group) {
  const section = document.createElement('div');
  section.className = 'links-section';

  const title = document.createElement('div');
  title.className = 'links-section-title';
  title.textContent = t('linksSection');
  section.appendChild(title);

  const linksList = document.createElement('div');
  linksList.dataset.groupId = groupId;
  section.appendChild(linksList);

  // Trier les liens par order avant affichage
  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  links.forEach((link) => {
    linksList.appendChild(buildLinkSettingsRow(groupId, group, link, linksList));
  });

  // Bouton ajouter un lien custom
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn btn-sm btn-outline btn-add-link';
  btnAdd.textContent = t('addLink');
  btnAdd.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      if (!g.links) g.links = [];
      const maxOrder = g.links.length > 0 ? Math.max(...g.links.map((l) => l.order || 0)) + 1 : 0;
      const newLink = {
        id: generateId(),
        label: '',
        path: '/',
        type: 'custom',
        iconKey: null,
        order: maxOrder,
      };
      g.links.push(newLink);
      await saveGroups(groups);
      // Mettre à jour group local
      group.links = g.links;
      linksList.appendChild(buildLinkSettingsRow(groupId, group, newLink, linksList));
    }
  });
  section.appendChild(btnAdd);

  return section;
}

/**
 * Construit une ligne de lien dans les paramètres du groupe (avec drag & drop).
 * @param {string} groupId
 * @param {object} group
 * @param {object} link
 * @param {HTMLElement} linksList
 */
function buildLinkSettingsRow(groupId, group, link, linksList) {
  const row = document.createElement('div');
  row.className = 'link-settings-row';
  row.setAttribute('draggable', 'true');
  row.dataset.linkId = link.id;

  // Handle de drag
  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  row.appendChild(handle);

  // Input label
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input-sm';
  labelInput.style.flex = '1';
  labelInput.placeholder = t('linkLabelPlaceholder');
  labelInput.value = link.label || '';
  labelInput.addEventListener('change', () => saveLinkField(groupId, link.id, 'label', labelInput.value));
  row.appendChild(labelInput);

  // Input path
  const pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.className = 'input-sm';
  pathInput.style.flex = '1.5';
  pathInput.placeholder = t('linkPathPlaceholder');
  pathInput.value = link.path || '/';
  pathInput.addEventListener('change', () => saveLinkField(groupId, link.id, 'path', pathInput.value));
  row.appendChild(pathInput);

  // Badge type
  const typeBadge = document.createElement('span');
  typeBadge.className = `link-type-badge ${link.type === 'wordpress' ? 'wp' : 'custom'}`;
  typeBadge.textContent = link.type === 'wordpress' ? 'WP' : 'custom';
  row.appendChild(typeBadge);

  // Bouton supprimer
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-link';
  btnRemove.title = 'Supprimer ce lien';
  btnRemove.textContent = '×';
  btnRemove.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.links = g.links.filter((l) => l.id !== link.id);
      await saveGroups(groups);
      group.links = g.links;
      row.remove();
    }
  });
  row.appendChild(btnRemove);

  // ── Drag & drop HTML5
  row.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', link.id);
    row.classList.add('dragging');
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    // Nettoyer tous les indicateurs
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  });

  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragging = linksList.querySelector('.dragging');
    if (!dragging || dragging === row) return;

    // Nettoyer les indicateurs précédents
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Déterminer si on insère avant ou après
    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      row.classList.add('drag-over-top');
    } else {
      row.classList.add('drag-over-bottom');
    }
  });

  row.addEventListener('dragleave', () => {
    row.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  row.addEventListener('drop', async (e) => {
    e.preventDefault();
    row.classList.remove('drag-over-top', 'drag-over-bottom');

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === link.id) return;

    // Déterminer si on insère avant ou après
    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midY;

    // Déplacer dans le DOM
    const draggedRow = linksList.querySelector(`[data-link-id="${draggedId}"]`);
    if (!draggedRow) return;

    if (insertBefore) {
      linksList.insertBefore(draggedRow, row);
    } else {
      row.after(draggedRow);
    }

    // Mettre à jour les ordres dans le storage
    await reorderLinks(groupId, linksList);
  });

  return row;
}

/**
 * Met à jour l'ordre des liens d'un groupe d'après l'ordre des éléments DOM.
 * @param {string} groupId
 * @param {HTMLElement} linksList
 */
async function reorderLinks(groupId, linksList) {
  const rows = linksList.querySelectorAll('.link-settings-row');
  const newOrder = Array.from(rows).map((r, i) => ({ id: r.dataset.linkId, order: i }));

  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  if (g) {
    newOrder.forEach(({ id, order }) => {
      const link = g.links.find((l) => l.id === id);
      if (link) link.order = order;
    });
    await saveGroups(groups);
  }
}

/**
 * Sauvegarde un champ d'un lien au niveau groupe.
 * @param {string} groupId
 * @param {string} linkId
 * @param {string} field
 * @param {*} value
 */
async function saveLinkField(groupId, linkId, field, value) {
  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  const l = g && g.links && g.links.find((x) => x.id === linkId);
  if (l) {
    l[field] = value;
    await saveGroups(groups);
  }
}

/**
 * Sauvegarde un champ d'un environnement.
 */
async function saveEnvField(groupId, envId, field, value) {
  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  if (!g) return;
  const e = g.environments.find((x) => x.id === envId);
  if (!e) return;
  e[field] = value;
  await saveGroups(groups);
}

/**
 * Met à jour le select d'export de groupe.
 */
function updateExportGroupSelect(groups) {
  const select = el('export-group-select');
  const current = select.value;
  select.innerHTML = `<option value="">${t('chooseGroup')}</option>`;
  groups.forEach((g) => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    select.appendChild(opt);
  });
  if (groups.find((g) => g.id === current)) select.value = current;
}

// ─── Export / Import ──────────────────────────────────────────────────────────

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Convertit un JSON exporté dans l'ancien format (WP/liens au niveau env ou WP Multisite au niveau groupe)
 * vers le nouveau format (WP/liens au niveau groupe).
 * @param {object} data - L'objet JSON importé
 * @returns {object} Données converties
 */
function convertOldFormat(data) {
  if (!data || !Array.isArray(data.groups)) return data;

  const groups = data.groups.map((group) => {
    const newGroup = { ...group };

    // Remonter WP/liens depuis les envs si pas déjà au niveau groupe
    if (newGroup.isWordPress === undefined && newGroup.environments) {
      const envWithWp = newGroup.environments.find((e) => e.isWordPress);
      if (envWithWp) {
        newGroup.isWordPress = true;
        newGroup.wpLoginPath = envWithWp.wpLoginPath || '/wp-login.php';
        newGroup.isWordPressMultisite = envWithWp.isWordPressMultisite || false;
        newGroup.wpNetworkDomain = envWithWp.wpNetworkDomain || '';
        newGroup.wpSites = envWithWp.wpSites || [];
      }
    }
    if (!newGroup.links && newGroup.environments) {
      const envWithLinks = newGroup.environments.find((e) => e.links && e.links.length > 0);
      newGroup.links = envWithLinks ? envWithLinks.links : [];
    }

    // Migration : ancien format "WP Multisite au niveau groupe" (avant le format env)
    if (!newGroup.isWordPress && newGroup.isWordPressMultisite) {
      newGroup.isWordPress = true;
    }

    // Valeurs par défaut groupe
    newGroup.isWordPress = newGroup.isWordPress || false;
    newGroup.wpLoginPath = newGroup.wpLoginPath || '/wp-login.php';
    newGroup.isWordPressMultisite = newGroup.isWordPressMultisite || false;
    newGroup.wpNetworkDomain = newGroup.wpNetworkDomain || '';
    newGroup.wpSites = newGroup.wpSites || [];
    newGroup.links = newGroup.links || [];

    // Nettoyer les envs : ne conserver que id, name, domain, color
    newGroup.environments = (newGroup.environments || []).map((env) => ({
      id: env.id || generateId(),
      name: env.name || '',
      domain: env.domain || '',
      color: env.color || '#6B7280',
    }));

    return newGroup;
  });

  return { ...data, groups };
}

function initExportImport() {
  // Exporter tout (inclut les réglages globaux)
  el('export-all-btn').addEventListener('click', async () => {
    const [groups, settings] = await Promise.all([getGroups(), getSettings()]);
    downloadJson({ groups, settings }, 'envjump-export.json');
  });

  // Exporter un groupe
  el('export-group-btn').addEventListener('click', async () => {
    const groupId = el('export-group-select').value;
    if (!groupId) return;
    const groups = await getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const filename = `envjump-${group.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    downloadJson({ groups: [group] }, filename);
  });

  // Importer
  el('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    hide('import-error');
    hide('import-success');

    let data;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      showImportError(t('importErrorInvalidJson'));
      e.target.value = '';
      return;
    }

    // Conversion ancien format si nécessaire
    data = convertOldFormat(data);

    if (!validateImportData(data)) {
      showImportError(t('importErrorInvalidStructure'));
      e.target.value = '';
      return;
    }

    const importedGroups = data.groups;
    e.target.value = '';

    // Importer les réglages globaux si présents
    if (data.settings) {
      const currentSettings = await getSettings();
      await saveSettings({ ...currentSettings, ...data.settings });
    }

    if (importedGroups.length === 1) {
      // Ajouter directement
      const groups = await getGroups();
      groups.push({ ...importedGroups[0], id: generateId() });
      await saveGroups(groups);
      await renderSettingsPanel();
      showImportSuccess(t('importSuccessGroup', importedGroups[0].name));
    } else {
      // Demander merge ou replace
      showImportModal(importedGroups);
    }
  });
}

/**
 * Valide la structure du JSON importé (nouveau format).
 */
function validateImportData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.groups)) return false;
  for (const g of data.groups) {
    if (!g.name || !Array.isArray(g.environments)) return false;
    for (const e of g.environments) {
      if (!e.name || !e.domain || !e.color) return false;
    }
  }
  return true;
}

function showImportError(msg) {
  el('import-error').textContent = msg;
  show('import-error');
}

function showImportSuccess(msg) {
  el('import-success').textContent = msg;
  show('import-success');
  setTimeout(() => hide('import-success'), 3000);
}

function showImportModal(importedGroups) {
  show('import-modal');

  function cleanup() {
    hide('import-modal');
    el('import-merge-btn').removeEventListener('click', onMerge);
    el('import-replace-btn').removeEventListener('click', onReplace);
  }

  async function onMerge() {
    cleanup();
    const groups = await getGroups();
    const merged = [...groups, ...importedGroups.map((g) => ({ ...g, id: generateId() }))];
    await saveGroups(merged);
    await renderSettingsPanel();
    showImportSuccess(t('importSuccessMerge', String(importedGroups.length)));
  }

  async function onReplace() {
    cleanup();
    const newGroups = importedGroups.map((g) => ({ ...g, id: generateId() }));
    await saveGroups(newGroups);
    await renderSettingsPanel();
    showImportSuccess(t('importSuccessReplace', String(newGroups.length)));
  }

  el('import-merge-btn').addEventListener('click', onMerge);
  el('import-replace-btn').addEventListener('click', onReplace);
}

// ─── Initialisation ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Migrer les données si nécessaire (ancien format → nouveau format)
  await migrateData();

  // Injecter les traductions sur les éléments statiques
  applyI18n();

  initTabs();
  initExportImport();

  // Bouton "Aller aux paramètres" depuis le panneau vide
  el('goto-settings-btn').addEventListener('click', () => switchTab('settings'));

  // Bouton "Ajouter un groupe"
  el('add-group-btn').addEventListener('click', async () => {
    const groups = await getGroups();
    // Inclure tous les champs groupe (WP/liens au niveau groupe)
    const newGroup = {
      id: generateId(),
      name: t('newGroupName'),
      isWordPress: false,
      wpLoginPath: '/wp-login.php',
      isWordPressMultisite: false,
      wpNetworkDomain: '',
      wpSites: [],
      links: [],
      environments: [],
    };
    groups.push(newGroup);
    await saveGroups(groups);
    await renderSettingsPanel();
    // Ouvrir la carte du dernier groupe ajouté
    const cards = el('groups-list').querySelectorAll('.group-card');
    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      lastCard.classList.add('open');
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Focus sur le champ nom
      const nameInput = lastCard.querySelector('.group-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }
  });

  // Charger le panneau Jumper par défaut
  await renderJumperPanel();
});
