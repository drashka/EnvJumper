// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el, show, hide, buildTargetUrl } from '../helpers/ui-helpers.js';
import { getWpLoginStatus } from '../projects/wordpress.js';
import { hideSiteSelector } from './jumper-multisite.js';
import { buildJumperCardBody } from './jumper-links.js';
import { renderNoMatchPanel, hideProjectChooser } from './jumper-no-match.js';

/** Callback set by popup.js to handle no-match action buttons. */
let _noMatchActions = null;

/**
 * Sets the action callbacks for the no-match panel.
 * Must be called once at popup startup.
 * @param {{ onNewProject: Function, onAddToProject: Function }} actions
 */
export function setNoMatchActions(actions) {
  _noMatchActions = actions;
}

/**
 * Initializes the Jumper panel's drill-down back button.
 * Must be called once at popup startup.
 */
export function initJumper() {
  const backBtn = el('jumper-back-btn');
  if (backBtn) backBtn.addEventListener('click', hideSiteSelector);
  const backBtn2 = el('jumper-choose-project-back-btn');
  if (backBtn2) backBtn2.addEventListener('click', hideProjectChooser);
}

/**
 * Finds the group and environment matching a given hostname.
 * Supports direct domain match and WP Multisite prefix-based subdomains.
 * @param {Array} groups
 * @param {string} hostname
 * @returns {{ group: object, env: object }|null}
 */
export function findMatch(groups, hostname) {
  for (const group of groups) {
    for (const env of group.environments) {
      if (env.domain === hostname) return { group, env };
    }
    if (group.isWordPressMultisite && group.wpSites) {
      const type = group.wpMultisiteType || 'subdomain';
      for (const env of group.environments) {
        for (const site of group.wpSites) {
          const siteHost = type === 'subdirectory'
            ? env.domain
            : (site.prefix ? `${site.prefix}.${env.domain}` : env.domain);
          if (siteHost === hostname) return { group, env };
        }
      }
    }
  }
  return null;
}

/**
 * Renders the Jumper panel for the currently active browser tab.
 */
export async function renderJumperPanel() {
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

  const groups = await getGroups();

  if (!tab || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
    hide('jumper-loading');
    const noMatchEl = el('jumper-no-match');
    if (_noMatchActions) renderNoMatchPanel(noMatchEl, groups, '', _noMatchActions);
    show('jumper-no-match');
    return;
  }

  let hostname;
  try {
    hostname = new URL(tab.url).host;
  } catch {
    hide('jumper-loading');
    const noMatchEl = el('jumper-no-match');
    if (_noMatchActions) renderNoMatchPanel(noMatchEl, groups, '', _noMatchActions);
    show('jumper-no-match');
    return;
  }
  const match = findMatch(groups, hostname);

  hide('jumper-loading');

  if (!match) {
    const noMatchEl = el('jumper-no-match');
    if (_noMatchActions) renderNoMatchPanel(noMatchEl, groups, hostname, _noMatchActions);
    show('jumper-no-match');
    return;
  }

  const { group, env: currentEnv } = match;
  el('jumper-group-name').textContent = group.name;

  let wpIsLoggedIn = null;
  if (group.cms === 'wordpress') {
    wpIsLoggedIn = await getWpLoginStatus(tab.id);
  }

  const cardsList = el('jumper-cards-list');
  cardsList.innerHTML = '';

  const sortedEnvs = currentEnv
    ? [currentEnv, ...group.environments.filter((e) => e.id !== currentEnv.id)]
    : group.environments;

  sortedEnvs.filter((env) => env.domain).forEach((env) => {
    const isCurrent = currentEnv && env.id === currentEnv.id;
    const loggedIn = isCurrent ? wpIsLoggedIn : null;
    const card = _buildJumperCard(env, isCurrent, tab.url, loggedIn, group);
    if (isCurrent) card.classList.add('open');
    cardsList.appendChild(card);
  });

  show('jumper-match');
}

/**
 * Builds an environment card in the Jumper panel.
 * @param {object} env
 * @param {boolean} isCurrent
 * @param {string} currentUrl
 * @param {boolean|null} wpIsLoggedIn
 * @param {object} group
 * @returns {HTMLElement}
 */
function _buildJumperCard(env, isCurrent, currentUrl, wpIsLoggedIn, group) {
  const card = document.createElement('div');
  card.className = 'jumper-card' + (isCurrent ? ' is-current' : '');
  card.style.setProperty('--env-color', env.color || '#6B7280');

  const header = document.createElement('div');
  header.className = 'jumper-card-header';

  const dot = document.createElement('span');
  dot.className = 'color-dot';
  dot.style.backgroundColor = env.color || '#6B7280';

  const nameBlock = document.createElement('div');
  nameBlock.className = 'jumper-card-name-block';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'jumper-card-name';
  nameSpan.textContent = env.name || t('unnamed');

  const domainSpan = document.createElement('span');
  domainSpan.className = 'jumper-card-domain';
  domainSpan.textContent = env.domain || '';

  nameBlock.appendChild(nameSpan);
  nameBlock.appendChild(domainSpan);

  header.appendChild(dot);
  header.appendChild(nameBlock);

  if (env.basicAuth && env.basicAuth.enabled) {
    const lockIcon = document.createElement('span');
    lockIcon.className = 'env-basicauth-icon';
    lockIcon.title = 'Basic Auth';
    lockIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    header.appendChild(lockIcon);
  }

  if (isCurrent) {
    const badge = document.createElement('span');
    badge.className = 'badge-current';
    badge.style.setProperty('--env-color', env.color || '#6B7280');
    badge.textContent = t('badgeCurrent');
    header.appendChild(badge);
  }

  const actions = document.createElement('div');
  actions.className = 'jumper-card-actions';

  const btnSameTab = document.createElement('button');
  btnSameTab.className = 'btn-icon';
  btnSameTab.title = t('navigateSameTab');
  btnSameTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 10h10M11 6l4 4-4 4"/></svg>`;
  btnSameTab.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = buildTargetUrl(currentUrl, env.domain, env.protocol || 'https');
    if (url) chrome.tabs.update(undefined, { url });
    window.close();
  });

  const btnNewTab = document.createElement('button');
  btnNewTab.className = 'btn-icon';
  btnNewTab.title = t('openNewTab');
  btnNewTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
  btnNewTab.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = buildTargetUrl(currentUrl, env.domain, env.protocol || 'https');
    if (url) chrome.tabs.create({ url });
  });

  actions.appendChild(btnSameTab);
  actions.appendChild(btnNewTab);
  header.appendChild(actions);

  const chevron = document.createElement('span');
  chevron.className = 'jumper-card-chevron';
  chevron.textContent = '▶';
  header.appendChild(chevron);

  const body = buildJumperCardBody(env, group, wpIsLoggedIn);

  header.addEventListener('click', (e) => {
    if (e.target.closest('.btn-icon')) return;
    const isOpen = card.classList.contains('open');
    card.closest('#jumper-cards-list').querySelectorAll('.jumper-card').forEach((c) => c.classList.remove('open'));
    if (!isOpen) {
      card.classList.add('open');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}
