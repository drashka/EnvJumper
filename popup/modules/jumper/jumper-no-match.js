// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from '../i18n.js';
import { ICONS } from '../icons.js';
import { _fetchGroupFavicon } from '../projects/editing.js';

/** Normalizes a string for case/accent-insensitive search. */
function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Renders the full no-match panel: message, action buttons, search, accordion.
 * @param {HTMLElement} container - The #jumper-no-match element
 * @param {Array} groups - All configured groups
 * @param {string} hostname - Current tab hostname (may be empty)
 * @param {{ onNewProject: Function, onAddToProject: Function }} actions
 */
export function renderNoMatchPanel(container, groups, hostname, actions) {
  container.innerHTML = '';

  // ── 2-column header : left = title + hostname / right = action buttons ─────
  const headerRow = document.createElement('div');
  headerRow.className = 'no-match-header';

  // Col 1 : title + hostname
  const headerLeft = document.createElement('div');
  headerLeft.className = 'no-match-header-left';

  const title = document.createElement('p');
  title.className = 'no-match-title';
  title.textContent = t('noMatchTitle');
  headerLeft.appendChild(title);

  if (hostname) {
    const hostEl = document.createElement('p');
    hostEl.className = 'empty-hostname';
    hostEl.textContent = hostname;
    headerLeft.appendChild(hostEl);
  }

  // Col 2 : action buttons stacked
  const btnRow = document.createElement('div');
  btnRow.className = 'no-match-actions';

  const btnNew = document.createElement('button');
  btnNew.type = 'button';
  btnNew.className = 'btn btn-sm btn-primary no-match-btn';
  btnNew.innerHTML = `<span class="no-match-btn-icon">${ICONS['plus-circle'] || ''}</span><span>${t('noMatchNewProject')}</span>`;
  btnNew.addEventListener('click', () => actions.onNewProject());
  btnRow.appendChild(btnNew);

  if (groups.length > 0 && hostname) {
    const btnAdd = document.createElement('button');
    btnAdd.type = 'button';
    btnAdd.className = 'btn btn-sm btn-outline no-match-btn';
    btnAdd.innerHTML = `<span class="no-match-btn-icon">${ICONS['folder-plus'] || ''}</span><span>${t('noMatchAddToProject')}</span>`;
    btnAdd.addEventListener('click', () => showProjectChooser(groups, actions.onAddToProject));
    btnRow.appendChild(btnAdd);
  }

  headerRow.appendChild(headerLeft);
  headerRow.appendChild(btnRow);
  container.appendChild(headerRow);

  if (groups.length === 0) return;

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchWrap = document.createElement('div');
  searchWrap.className = 'no-match-search-wrap';
  const searchIconEl = document.createElement('span');
  searchIconEl.className = 'no-match-search-icon';
  searchIconEl.innerHTML = ICONS['search'] || '';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'no-match-search';
  searchInput.placeholder = t('noMatchSearch');
  searchWrap.appendChild(searchIconEl);
  searchWrap.appendChild(searchInput);
  container.appendChild(searchWrap);

  // ── Accordion ──────────────────────────────────────────────────────────────
  const accordion = document.createElement('div');
  accordion.className = 'no-match-accordion';
  container.appendChild(accordion);

  const noResults = document.createElement('p');
  noResults.className = 'no-match-no-results hidden';
  noResults.textContent = t('noMatchNoResults');
  container.appendChild(noResults);

  _renderAccordion(accordion, groups, '');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    accordion.innerHTML = '';
    const hasResults = _renderAccordion(accordion, groups, q);
    noResults.classList.toggle('hidden', hasResults || !q);
  });
}

/**
 * Renders accordion project items filtered by query.
 * @returns {boolean} true if at least one result was rendered
 */
function _renderAccordion(container, groups, query) {
  const q = normalize(query);
  let anyResult = false;

  groups.forEach((group) => {
    const matchesGroup = !q || normalize(group.name || '').includes(q);
    const matchingEnvs = (group.environments || []).filter(
      (env) => !q || normalize(env.name || '').includes(q) || normalize(env.domain || '').includes(q)
    );

    if (q && !matchesGroup && matchingEnvs.length === 0) return;
    anyResult = true;

    const envsToShow = q && !matchesGroup ? matchingEnvs : (group.environments || []);
    const item = _buildAccordionItem(group, envsToShow, !!q);
    container.appendChild(item);

    // Async favicon loading
    _fetchGroupFavicon(group).then((url) => {
      if (!url) return;
      const img = item.querySelector('.no-match-favicon-img');
      const def = item.querySelector('.no-match-favicon-default');
      if (img) {
        img.onload = () => { img.style.display = ''; if (def) def.style.display = 'none'; };
        img.onerror = () => {};
        img.src = url;
      }
    });
  });

  return anyResult;
}

/** Builds one collapsible project item in the accordion. */
function _buildAccordionItem(group, envs, startOpen) {
  const item = document.createElement('div');
  item.className = 'no-match-project' + (startOpen ? ' open' : '');

  // Header
  const header = document.createElement('div');
  header.className = 'no-match-project-header';

  const favicon = _buildFaviconEl();
  const nameSpan = document.createElement('span');
  nameSpan.className = 'no-match-project-name';
  nameSpan.textContent = group.name || t('unnamed');

  const countBadge = document.createElement('span');
  countBadge.className = 'no-match-project-count';
  countBadge.textContent = String(envs.filter((e) => e.domain).length);

  const chevron = document.createElement('span');
  chevron.className = 'no-match-project-chevron';
  chevron.innerHTML = ICONS['chevron-right'] || '';

  header.appendChild(favicon);
  header.appendChild(nameSpan);
  header.appendChild(countBadge);
  header.appendChild(chevron);

  // Body (grid wrapper + inner for collapse animation)
  const body = document.createElement('div');
  body.className = 'no-match-project-body';
  const bodyInner = document.createElement('div');
  bodyInner.className = 'no-match-project-body-inner';
  envs.forEach((env) => { if (env.domain) bodyInner.appendChild(_buildEnvRow(env)); });
  body.appendChild(bodyInner);

  header.addEventListener('click', () => item.classList.toggle('open'));

  item.appendChild(header);
  item.appendChild(body);
  return item;
}

/** Builds a single environment row inside an accordion item. */
function _buildEnvRow(env) {
  const row = document.createElement('div');
  row.className = 'no-match-env-row';

  const dot = document.createElement('span');
  dot.className = 'color-dot';
  dot.style.cssText = `background:${env.color || '#6B7280'};flex-shrink:0`;

  const info = document.createElement('div');
  info.className = 'no-match-env-info';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'no-match-env-name';
  nameSpan.textContent = env.name || t('unnamed');
  const domainSpan = document.createElement('span');
  domainSpan.className = 'no-match-env-domain';
  domainSpan.textContent = env.domain;
  info.appendChild(nameSpan);
  info.appendChild(domainSpan);

  const actions = document.createElement('div');
  actions.className = 'no-match-env-actions';

  if (env.basicAuth?.enabled) {
    const lock = document.createElement('span');
    lock.className = 'env-basicauth-icon';
    lock.title = 'Basic Auth';
    lock.innerHTML = ICONS['lock'] || '';
    actions.appendChild(lock);
  }

  const proto = env.protocol || 'https';
  const rootUrl = `${proto}://${env.domain}/`;

  const btnSame = document.createElement('button');
  btnSame.type = 'button';
  btnSame.className = 'btn-icon';
  btnSame.title = t('navigateSameTab');
  btnSame.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 10h10M11 6l4 4-4 4"/></svg>`;
  btnSame.addEventListener('click', (e) => { e.stopPropagation(); chrome.tabs.update(undefined, { url: rootUrl }); window.close(); });

  const btnNew = document.createElement('button');
  btnNew.type = 'button';
  btnNew.className = 'btn-icon';
  btnNew.title = t('openNewTab');
  btnNew.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
  btnNew.addEventListener('click', (e) => { e.stopPropagation(); chrome.tabs.create({ url: rootUrl }); });

  actions.appendChild(btnSame);
  actions.appendChild(btnNew);

  row.appendChild(dot);
  row.appendChild(info);
  row.appendChild(actions);
  return row;
}

// ── Project chooser drill-down ("Add to a project") ────────────────────────

/**
 * Slides to the "choose a project" view and lists all groups for selection.
 * @param {Array} groups
 * @param {Function} onProjectChosen - called with (group) when user picks one
 */
export function showProjectChooser(groups, onProjectChosen) {
  const listEl = document.getElementById('jumper-projects-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  groups.forEach((group) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jumper-site-btn no-match-choose-btn';

    const favicon = _buildFaviconEl();
    const nameSpan = document.createElement('span');
    nameSpan.style.flex = '1';
    nameSpan.textContent = group.name || t('unnamed');

    btn.appendChild(favicon);
    btn.appendChild(nameSpan);
    btn.addEventListener('click', () => { hideProjectChooser(); onProjectChosen(group); });
    listEl.appendChild(btn);

    _fetchGroupFavicon(group).then((url) => {
      if (!url) return;
      const img = btn.querySelector('.no-match-favicon-img');
      const def = btn.querySelector('.no-match-favicon-default');
      if (img) {
        img.onload = () => { img.style.display = ''; if (def) def.style.display = 'none'; };
        img.onerror = () => {};
        img.src = url;
      }
    });
  });

  const mainView = document.querySelector('.jumper-view--main');
  const chooserView = document.querySelector('.jumper-view--choose-project');
  if (mainView) mainView.classList.add('sliding-out');
  if (chooserView) { chooserView.classList.add('slide-in'); chooserView.removeAttribute('aria-hidden'); }
}

/** Slides back from the "choose a project" view to the main Jumper view. */
export function hideProjectChooser() {
  const mainView = document.querySelector('.jumper-view--main');
  const chooserView = document.querySelector('.jumper-view--choose-project');
  if (mainView) mainView.classList.remove('sliding-out');
  if (chooserView) { chooserView.classList.remove('slide-in'); chooserView.setAttribute('aria-hidden', 'true'); }
}

/** Builds a favicon element with default globe icon and a hidden img for async loading. */
function _buildFaviconEl() {
  const wrap = document.createElement('div');
  wrap.className = 'no-match-favicon';
  const def = document.createElement('span');
  def.className = 'no-match-favicon-default';
  def.innerHTML = ICONS['globe'] || '';
  const img = document.createElement('img');
  img.className = 'no-match-favicon-img';
  img.style.display = 'none';
  img.width = 14;
  img.height = 14;
  wrap.appendChild(def);
  wrap.appendChild(img);
  return wrap;
}
