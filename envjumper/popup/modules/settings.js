// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, getSettings, saveSettings, generateId, COLOR_PALETTE } from './storage.js';
import { t } from './i18n.js';
import { el, confirm } from './ui-helpers.js';
import { buildMultisiteUrl } from './wordpress.js';
import { buildLinksSection } from './links.js';
import { CMS_IDS, CMS_DEFAULT_LOGIN_PATH, CMS_DEFAULT_ADMIN_PATH, getDefaultCmsLinks, getDefaultNetworkLinks } from './cms.js';

// ── Module state ──────────────────────────────────────────────────────────────
let _editingGroup = null;
let _currentSubtab = 'envs';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Renders the Projects panel: list view with project rows.
 */
export async function renderEnvironmentsPanel() {
  _closeProjectEdit();
  const groups = await getGroups();
  const container = el('groups-list');
  if (!container) return;
  container.innerHTML = '';
  groups.forEach((group) => container.appendChild(_buildProjectListItem(group)));
  updateExportGroupSelect(groups);
}

/**
 * Initializes the Environments panel's back button, sub-tabs, and name input.
 * Must be called once at popup startup.
 */
export function initEnvironmentsPanel() {
  // Back button: slide back to list, refresh
  el('project-back-btn')?.addEventListener('click', async () => {
    _closeProjectEdit();
    const groups = await getGroups();
    const container = el('groups-list');
    if (container) {
      container.innerHTML = '';
      groups.forEach((g) => container.appendChild(_buildProjectListItem(g)));
      updateExportGroupSelect(groups);
    }
  });

  // Sub-tab switching
  document.querySelectorAll('.project-subtab').forEach((btn) => {
    btn.addEventListener('click', () => _switchProjectSubtab(btn.dataset.subtab));
  });

  // Project name inline editing
  el('project-edit-name-input')?.addEventListener('change', async () => {
    if (!_editingGroup) return;
    const name = el('project-edit-name-input').value.trim();
    const groups = await getGroups();
    const g = groups.find((x) => x.id === _editingGroup.id);
    if (g) {
      g.name = name;
      _editingGroup.name = name;
      await saveGroups(groups);
      updateExportGroupSelect(groups);
    }
  });
}

/**
 * Opens the edit view for a project, sliding to it with animation.
 * @param {object} group
 */
export function openProjectEdit(group) {
  _editingGroup = group;

  // Fill header
  const nameInput = el('project-edit-name-input');
  if (nameInput) nameInput.value = group.name || '';

  // Load favicon in header
  const faviconImg = el('project-edit-favicon-img');
  const faviconDefault = el('project-edit-favicon-default');
  if (faviconImg) faviconImg.style.display = 'none';
  if (faviconDefault) faviconDefault.style.display = '';
  _fetchGroupFavicon(group).then((url) => {
    if (url && el('project-edit-favicon-img') && _editingGroup?.id === group.id) {
      const img = el('project-edit-favicon-img');
      img.onload = () => {
        img.style.display = '';
        if (el('project-edit-favicon-default')) el('project-edit-favicon-default').style.display = 'none';
      };
      img.onerror = () => {};
      img.src = url;
    }
  });

  // Default to envs sub-tab
  _switchProjectSubtab('envs');

  // Animate: slide the whole row left to reveal the edit view
  const row = document.querySelector('.projects-views-row');
  if (row) row.classList.add('show-edit');
}

/**
 * Renders the Settings panel: general settings (badge position).
 */
export async function renderSettingsPanel() {
  const settings = await getSettings();
  const generalContainer = el('general-settings-container');
  generalContainer.innerHTML = '';
  generalContainer.appendChild(_buildGeneralSettings(settings));
}

/**
 * Refreshes the export group <select> options.
 * @param {Array} groups
 */
export function updateExportGroupSelect(groups) {
  const select = el('export-group-select');
  if (!select) return;
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

// ── General settings ──────────────────────────────────────────────────────────

/**
 * Builds the "General Settings" section displayed at the top of the Settings tab.
 * @param {object} settings - Current settings object
 * @returns {HTMLElement}
 */
function _buildGeneralSettings(settings) {
  const section = document.createElement('div');
  section.className = 'general-settings-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('displaySection');
  section.appendChild(title);

  // Badge position selector label
  const posLabel = document.createElement('div');
  posLabel.className = 'field-label';
  posLabel.style.marginBottom = '8px';
  posLabel.textContent = t('badgePositionLabel');
  section.appendChild(posLabel);

  // Page diagram with 4 clickable corner buttons
  const diagram = document.createElement('div');
  diagram.className = 'position-diagram';
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

// ── Project list ──────────────────────────────────────────────────────────────

/**
 * Builds a project list item row (favicon, name, env count badge, chevron).
 * @param {object} group
 * @returns {HTMLElement}
 */
function _buildProjectListItem(group) {
  const item = document.createElement('div');
  item.className = 'project-list-item';
  item.dataset.groupId = group.id;

  // Favicon
  item.appendChild(_buildFaviconEl(group, 20));

  // Info
  const info = document.createElement('div');
  info.className = 'project-list-info';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'project-list-name';
  nameSpan.textContent = group.name || t('unnamed');
  info.appendChild(nameSpan);
  item.appendChild(info);

  // Env count badge
  const badge = document.createElement('span');
  badge.className = 'project-list-badge';
  badge.textContent = `${group.environments.length} envs`;
  item.appendChild(badge);

  // Chevron
  const chev = document.createElement('span');
  chev.className = 'project-list-chevron';
  chev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>`;
  item.appendChild(chev);

  item.addEventListener('click', () => openProjectEdit(group));
  return item;
}

/**
 * Builds a favicon element (globe default + async img load).
 * @param {object} group
 * @param {number} size
 * @returns {HTMLElement}
 */
function _buildFaviconEl(group, size = 20) {
  const wrap = document.createElement('div');
  wrap.className = 'project-favicon';

  // Globe icon (default)
  const globe = document.createElement('span');
  globe.className = 'project-favicon-globe';
  globe.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  wrap.appendChild(globe);

  // Async favicon load
  _fetchGroupFavicon(group).then((url) => {
    if (!url) return;
    const img = document.createElement('img');
    img.width = size;
    img.height = size;
    img.style.borderRadius = '3px';
    img.addEventListener('load', () => {
      globe.style.display = 'none';
      wrap.appendChild(img);
    });
    img.addEventListener('error', () => {});
    img.src = url;
  });

  return wrap;
}

/**
 * Fetches (and caches) the favicon URL for a group.
 * Tries direct /favicon.ico first, then falls back to Google Favicon API.
 * Cache TTL: 24h, invalidated if group domains change.
 * @param {object} group
 * @returns {Promise<string|null>}
 */
async function _fetchGroupFavicon(group) {
  const cacheKey = `favicon_${group.id}`;
  const currentDomains = group.environments.map((e) => e.domain).join(',');

  // Check cache
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) {
    const { url, ts, domains } = cached[cacheKey];
    if (Date.now() - ts < 86400000 && domains === currentDomains) {
      return url;
    }
  }

  // Try direct favicon.ico for each environment
  for (const env of group.environments) {
    if (!env.domain) continue;
    const proto = env.protocol || 'https';
    const faviconUrl = `${proto}://${env.domain}/favicon.ico`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(faviconUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      if (resp.ok) {
        await chrome.storage.local.set({ [cacheKey]: { url: faviconUrl, ts: Date.now(), domains: currentDomains } });
        return faviconUrl;
      }
    } catch {}
  }

  // Fallback: Google Favicon API
  const firstDomain = group.environments.find((e) => e.domain)?.domain;
  if (firstDomain) {
    const googleUrl = `https://www.google.com/s2/favicons?domain=${firstDomain}&sz=32`;
    await chrome.storage.local.set({ [cacheKey]: { url: googleUrl, ts: Date.now(), domains: currentDomains } });
    return googleUrl;
  }

  return null;
}

// ── Project edit view ─────────────────────────────────────────────────────────

/**
 * Slides back to the list view without refreshing (used internally).
 */
function _closeProjectEdit() {
  _editingGroup = null;
  const row = document.querySelector('.projects-views-row');
  if (row) row.classList.remove('show-edit');
}

/**
 * Switches the active sub-tab in the project edit view.
 * @param {string} subtab - 'envs' | 'cms' | 'links'
 */
function _switchProjectSubtab(subtab) {
  _currentSubtab = subtab;

  document.querySelectorAll('.project-subtab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.subtab === subtab);
  });

  const content = el('project-subtab-content');
  if (!content || !_editingGroup) return;
  content.innerHTML = '';

  if (subtab === 'envs') {
    _buildEnvsSubtab(content, _editingGroup);
  } else if (subtab === 'cms') {
    _buildCmsSubtab(content, _editingGroup);
  } else if (subtab === 'links') {
    content.appendChild(buildLinksSection(_editingGroup.id, _editingGroup));
  }
}

/**
 * Builds the "Environnements" sub-tab content.
 * @param {HTMLElement} container
 * @param {object} group
 */
function _buildEnvsSubtab(container, group) {
  const envList = document.createElement('div');
  envList.className = 'env-manage-list';
  envList.dataset.groupId = group.id;

  group.environments.forEach((env) => {
    envList.appendChild(buildEnvItem(group.id, env));
  });
  container.appendChild(envList);

  // Add environment button
  const btnAddEnv = document.createElement('button');
  btnAddEnv.className = 'btn btn-sm btn-outline btn-full';
  btnAddEnv.style.marginTop = '8px';
  btnAddEnv.textContent = t('addEnv');
  btnAddEnv.addEventListener('click', async () => {
    const newEnv = { id: generateId(), name: '', domain: '', color: COLOR_PALETTE[0].hex };
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (g) {
      g.environments.push(newEnv);
      await saveGroups(groups);
      group.environments = g.environments;
      if (_editingGroup && _editingGroup.id === group.id) _editingGroup.environments = g.environments;
      envList.appendChild(buildEnvItem(group.id, newEnv));
    }
  });
  container.appendChild(btnAddEnv);

  // Delete project button
  const btnDeleteProject = document.createElement('button');
  btnDeleteProject.className = 'btn btn-sm btn-danger btn-full';
  btnDeleteProject.style.marginTop = '20px';
  btnDeleteProject.textContent = t('deleteProject');
  btnDeleteProject.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteGroup', group.name));
    if (ok) {
      const groups = await getGroups();
      await saveGroups(groups.filter((g) => g.id !== group.id));
      _closeProjectEdit();
      await renderEnvironmentsPanel();
    }
  });
  container.appendChild(btnDeleteProject);
}

/**
 * Builds the "CMS" sub-tab content.
 * @param {HTMLElement} container
 * @param {object} group
 */
function _buildCmsSubtab(container, group) {
  // CMS selector row
  const cmsRow = document.createElement('div');
  cmsRow.className = 'field-row';
  const cmsLabel = document.createElement('label');
  cmsLabel.className = 'field-label';
  cmsLabel.textContent = t('cmsLabel');
  const cmsSelect = document.createElement('select');
  cmsSelect.className = 'input-sm select-sm';
  CMS_IDS.forEach((id) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = t(`cms_${id}`);
    cmsSelect.appendChild(opt);
  });
  cmsSelect.value = group.cms || 'none';
  cmsRow.appendChild(cmsLabel);
  cmsRow.appendChild(cmsSelect);
  container.appendChild(cmsRow);

  // CMS config container
  const cmsConfigContainer = document.createElement('div');
  cmsConfigContainer.style.display = (group.cms && group.cms !== 'none') ? 'block' : 'none';
  buildCmsGroupConfig(group.id, group, cmsConfigContainer);
  container.appendChild(cmsConfigContainer);

  cmsSelect.addEventListener('change', async () => {
    const newCms = cmsSelect.value;
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (!g) return;

    const cmsLinksCount = g.links ? g.links.filter((l) => l.type === 'cms').length : 0;

    if (cmsLinksCount > 0 && newCms !== g.cms) {
      const ok = await confirm(t('confirmDisableCms', String(cmsLinksCount)));
      if (!ok) {
        cmsSelect.value = g.cms || 'none';
        return;
      }
      g.links = (g.links || []).filter((l) => l.type !== 'cms');
    }

    g.cms = newCms;

    if (newCms !== 'none') {
      g.cmsLoginPath = CMS_DEFAULT_LOGIN_PATH[newCms] || '/';
      g.cmsAdminPath = CMS_DEFAULT_ADMIN_PATH[newCms] || '';
      if (!g.links) g.links = [];
      const defaultLinks = getDefaultCmsLinks(newCms, g.cmsLoginPath, g.cmsAdminPath);
      g.links = [...defaultLinks, ...g.links];
    } else {
      g.isWordPressMultisite = false;
    }

    await saveGroups(groups);
    Object.assign(group, g);
    if (_editingGroup && _editingGroup.id === group.id) Object.assign(_editingGroup, g);

    cmsConfigContainer.style.display = newCms !== 'none' ? 'block' : 'none';
    cmsConfigContainer.innerHTML = '';
    buildCmsGroupConfig(group.id, group, cmsConfigContainer);
  });
}

// ── CMS config ────────────────────────────────────────────────────────────────

/**
 * Builds the CMS sub-form at group level.
 * Handles login path, optional admin path (PrestaShop), and WP Multisite (WordPress only).
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container - Parent element to append the section into
 */
function buildCmsGroupConfig(groupId, group, container) {
  const section = document.createElement('div');
  section.className = 'wp-env-section';

  const titleRow = document.createElement('div');
  titleRow.className = 'wp-env-section-title';
  titleRow.textContent = t('wpConfigTitle');
  section.appendChild(titleRow);

  // cmsLoginPath field
  const loginRow = document.createElement('div');
  loginRow.className = 'field-row';
  const loginLabel = document.createElement('label');
  loginLabel.className = 'field-label';
  loginLabel.textContent = t('cmsLoginPathLabel');
  const loginInput = document.createElement('input');
  loginInput.type = 'text';
  loginInput.className = 'input-sm';
  loginInput.placeholder = CMS_DEFAULT_LOGIN_PATH[group.cms] || '/';
  loginInput.value = group.cmsLoginPath || CMS_DEFAULT_LOGIN_PATH[group.cms] || '/';
  loginInput.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.cmsLoginPath = loginInput.value.trim() || CMS_DEFAULT_LOGIN_PATH[g.cms] || '/';
      await saveGroups(groups);
    }
  });
  loginRow.appendChild(loginLabel);
  loginRow.appendChild(loginInput);
  section.appendChild(loginRow);

  // cmsAdminPath field (PrestaShop only)
  if (group.cms === 'prestashop') {
    const adminPathRow = document.createElement('div');
    adminPathRow.className = 'field-row';
    const adminPathLabel = document.createElement('label');
    adminPathLabel.className = 'field-label';
    adminPathLabel.textContent = t('cmsAdminPathLabel');
    const adminPathInput = document.createElement('input');
    adminPathInput.type = 'text';
    adminPathInput.className = 'input-sm';
    adminPathInput.placeholder = '/admin-dev';
    adminPathInput.value = group.cmsAdminPath || '/admin-dev';
    adminPathInput.addEventListener('change', async () => {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        g.cmsAdminPath = adminPathInput.value.trim() || '/admin-dev';
        // Regenerate CMS links with the new admin path
        const cmsLinksCount = g.links ? g.links.filter((l) => l.type === 'cms').length : 0;
        if (cmsLinksCount > 0) {
          g.links = (g.links || []).filter((l) => l.type !== 'cms');
          const newLinks = getDefaultCmsLinks(g.cms, g.cmsLoginPath, g.cmsAdminPath);
          g.links = [...newLinks, ...g.links];
        }
        await saveGroups(groups);
        Object.assign(group, g);
      }
    });
    adminPathRow.appendChild(adminPathLabel);
    adminPathRow.appendChild(adminPathInput);
    section.appendChild(adminPathRow);
  }

  // WordPress Multisite toggle — only for WordPress
  if (group.cms === 'wordpress') {
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

    // Multisite sub-section
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
      if (!g) return;
      g.isWordPressMultisite = isMs;
      if (isMs) {
        // Add network links if not already present
        if (!g.links) g.links = [];
        const hasNetwork = g.links.some((l) => l.type === 'network');
        if (!hasNetwork) {
          const netLinks = getDefaultNetworkLinks();
          g.links = [...g.links, ...netLinks];
        }
      } else {
        // Remove all network links automatically
        if (g.links) g.links = g.links.filter((l) => l.type !== 'network');
      }
      await saveGroups(groups);
      Object.assign(group, g);
      if (_editingGroup && _editingGroup.id === groupId) Object.assign(_editingGroup, g);
    });
  }

  container.appendChild(section);
}

/**
 * Builds the WordPress Multisite configuration fields inside a group.
 * Uses the new model: wpMultisiteType ("subdomain"|"subdirectory") + wpSites[{label, prefix}].
 * wpNetworkDomain is no longer used.
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container
 */
function buildWpMultisiteFields(groupId, group, container) {
  container.innerHTML = '';

  // Title
  const msTitle = document.createElement('div');
  msTitle.className = 'wp-config-title';
  msTitle.textContent = t('wpMultisiteConfigTitle');
  container.appendChild(msTitle);

  // Helper: compute the preview text for a site row
  const getPreviewDomain = () => group.environments[0]?.domain || 'exemple.com';
  const getType = () => typeSelect.value;

  // Multisite type selector
  const typeRow = document.createElement('div');
  typeRow.className = 'field-row';
  const typeLabel = document.createElement('label');
  typeLabel.className = 'field-label';
  typeLabel.textContent = t('wpMultisiteType');
  const typeSelect = document.createElement('select');
  typeSelect.className = 'input-sm select-sm';
  const optSubdomain = document.createElement('option');
  optSubdomain.value = 'subdomain';
  optSubdomain.textContent = t('wpMultisiteSubdomain');
  const optSubdir = document.createElement('option');
  optSubdir.value = 'subdirectory';
  optSubdir.textContent = t('wpMultisiteSubdirectory');
  typeSelect.appendChild(optSubdomain);
  typeSelect.appendChild(optSubdir);
  typeSelect.value = group.wpMultisiteType || 'subdomain';
  typeSelect.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.wpMultisiteType = typeSelect.value;
      await saveGroups(groups);
      // Update all preview spans
      container.querySelectorAll('.wp-site-preview').forEach((span, idx) => {
        const sites = g.wpSites || [];
        const site = sites[idx];
        if (site !== undefined) {
          const url = buildMultisiteUrl(getPreviewDomain(), site.prefix || '', typeSelect.value, '/');
          span.textContent = `→ ${url.replace('https://', '').replace(/\/$/, '')}`;
        }
      });
    }
  });
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(typeSelect);
  container.appendChild(typeRow);

  // Sites list label
  const sitesLabel = document.createElement('div');
  sitesLabel.className = 'field-label';
  sitesLabel.style.marginTop = '8px';
  sitesLabel.textContent = t('wpSitesLabel');
  container.appendChild(sitesLabel);

  const sitesList = document.createElement('div');
  sitesList.className = 'wp-sites-list';

  const sites = group.wpSites || [];
  sites.forEach((site, idx) => {
    sitesList.appendChild(buildWpSiteRow(groupId, group, site, idx, sitesList, typeSelect, getPreviewDomain));
  });
  container.appendChild(sitesList);

  const btnAddSite = document.createElement('button');
  btnAddSite.className = 'btn btn-sm btn-outline';
  btnAddSite.style.marginTop = '5px';
  btnAddSite.textContent = t('addWpSite');
  btnAddSite.addEventListener('click', async () => {
    const newSite = { label: '', prefix: '' };
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      if (!g.wpSites) g.wpSites = [];
      g.wpSites.push(newSite);
      await saveGroups(groups);
      const idx = g.wpSites.length - 1;
      sitesList.appendChild(buildWpSiteRow(groupId, group, newSite, idx, sitesList, typeSelect, getPreviewDomain));
    }
  });
  container.appendChild(btnAddSite);
}

/**
 * Builds a single WordPress Multisite site row at group level.
 * Uses the new model: {label, prefix} instead of {label, domain}.
 * Shows a live preview of the computed hostname/URL.
 * @param {string} groupId
 * @param {object} group
 * @param {object} site
 * @param {number} idx
 * @param {HTMLElement} sitesList
 * @param {HTMLSelectElement} typeSelect - The multisite type select element
 * @param {Function} getPreviewDomain - Returns the first env domain for preview
 * @returns {HTMLElement}
 */
function buildWpSiteRow(groupId, group, site, idx, sitesList, typeSelect, getPreviewDomain) {
  const row = document.createElement('div');
  row.className = 'wp-site-row';
  row.dataset.siteIdx = idx;

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input-sm wp-site-label-input';
  labelInput.placeholder = t('wpSiteLabelPlaceholder');
  labelInput.value = site.label || '';

  const prefixInput = document.createElement('input');
  prefixInput.type = 'text';
  prefixInput.className = 'input-sm';
  prefixInput.placeholder = t('wpMultisitePrefixPlaceholder');
  prefixInput.value = site.prefix || '';

  // Dynamic preview span
  const previewSpan = document.createElement('span');
  previewSpan.className = 'wp-site-preview';
  previewSpan.style.cssText = 'font-size:11px;color:var(--color-text-muted);white-space:nowrap;flex-shrink:0;';
  function updatePreview() {
    const url = buildMultisiteUrl(
      getPreviewDomain(),
      prefixInput.value.trim(),
      typeSelect ? typeSelect.value : (group.wpMultisiteType || 'subdomain'),
      '/'
    );
    previewSpan.textContent = `→ ${url.replace('https://', '').replace(/\/$/, '')}`;
  }
  updatePreview();
  prefixInput.addEventListener('input', updatePreview);

  async function saveSite() {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g && g.wpSites && g.wpSites[idx] !== undefined) {
      g.wpSites[idx] = { label: labelInput.value.trim(), prefix: prefixInput.value.trim() };
      await saveGroups(groups);
    }
  }

  labelInput.addEventListener('change', saveSite);
  prefixInput.addEventListener('change', saveSite);

  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-site';
  btnRemove.title = 'Remove this site';
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
  row.appendChild(prefixInput);
  row.appendChild(previewSpan);
  row.appendChild(btnRemove);
  return row;
}

// ── Env item ──────────────────────────────────────────────────────────────────

/**
 * Builds an environment item in the edit view.
 * @param {string} groupId
 * @param {object} env
 * @returns {HTMLElement}
 */
function buildEnvItem(groupId, env) {
  const item = document.createElement('div');
  item.className = 'env-manage-item';
  item.dataset.envId = env.id;

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input-sm';
  nameInput.placeholder = t('envNamePlaceholder');
  nameInput.value = env.name || '';
  nameInput.addEventListener('change', () => saveEnvField(groupId, env.id, 'name', nameInput.value));
  item.appendChild(nameInput);

  // Row: Protocol + Domain
  const row2 = document.createElement('div');
  row2.className = 'env-manage-row env-domain-row';

  const protocolSelect = document.createElement('select');
  protocolSelect.className = 'input-sm select-sm env-protocol-select';
  protocolSelect.title = t('envProtocolLabel');
  ['https', 'http'].forEach((proto) => {
    const opt = document.createElement('option');
    opt.value = proto;
    opt.textContent = proto.toUpperCase();
    protocolSelect.appendChild(opt);
  });
  protocolSelect.value = env.protocol || 'https';
  protocolSelect.addEventListener('change', () => saveEnvField(groupId, env.id, 'protocol', protocolSelect.value));

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('envDomainPlaceholder');
  domainInput.value = env.domain || '';
  domainInput.addEventListener('change', () => {
    let raw = domainInput.value.trim();
    try {
      if (raw.includes('://')) {
        const parsed = new URL(raw);
        const detectedProto = parsed.protocol.replace(':', '');
        if (detectedProto === 'http' || detectedProto === 'https') {
          protocolSelect.value = detectedProto;
          saveEnvField(groupId, env.id, 'protocol', detectedProto);
        }
        raw = parsed.host;
      } else {
        raw = raw.split('/')[0].split('?')[0];
      }
    } catch {}
    domainInput.value = raw;
    saveEnvField(groupId, env.id, 'domain', raw);
  });

  row2.appendChild(protocolSelect);
  row2.appendChild(domainInput);
  item.appendChild(row2);

  // Color row
  const colorRow = document.createElement('div');
  colorRow.className = 'field-row';
  const colorLabel = document.createElement('label');
  colorLabel.className = 'field-label';
  colorLabel.textContent = t('colorLabel');
  colorRow.appendChild(colorLabel);

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
  colorRow.appendChild(colorPicker);
  item.appendChild(colorRow);

  // Basic Auth section
  const baSection = document.createElement('div');
  baSection.className = 'basic-auth-section';

  // Toggle row
  const baToggleRow = document.createElement('div');
  baToggleRow.className = 'toggle-row basic-auth-toggle-row';

  const baToggleLabel = document.createElement('span');
  baToggleLabel.className = 'toggle-label';
  baToggleLabel.textContent = t('basicAuth');

  const baToggleWrapper = document.createElement('label');
  baToggleWrapper.className = 'toggle';
  const baToggleInput = document.createElement('input');
  baToggleInput.type = 'checkbox';
  baToggleInput.checked = !!(env.basicAuth && env.basicAuth.enabled);
  const baToggleTrack = document.createElement('span');
  baToggleTrack.className = 'toggle-track';
  baToggleWrapper.appendChild(baToggleInput);
  baToggleWrapper.appendChild(baToggleTrack);

  baToggleRow.appendChild(baToggleLabel);
  baToggleRow.appendChild(baToggleWrapper);
  baSection.appendChild(baToggleRow);

  // Fields (username + password)
  const baFields = document.createElement('div');
  baFields.className = 'basic-auth-fields';
  baFields.style.display = baToggleInput.checked ? 'block' : 'none';

  // Username
  const baUserRow = document.createElement('div');
  baUserRow.className = 'field-row';
  const baUserLabel = document.createElement('label');
  baUserLabel.className = 'field-label';
  baUserLabel.textContent = t('basicAuthUsername');
  const baUserInput = document.createElement('input');
  baUserInput.type = 'text';
  baUserInput.className = 'input-sm';
  baUserInput.placeholder = t('basicAuthUsername');
  baUserInput.value = (env.basicAuth && env.basicAuth.username) || '';
  baUserInput.autocomplete = 'off';
  baUserRow.appendChild(baUserLabel);
  baUserRow.appendChild(baUserInput);
  baFields.appendChild(baUserRow);

  // Password
  const baPassRow = document.createElement('div');
  baPassRow.className = 'field-row';
  const baPassLabel = document.createElement('label');
  baPassLabel.className = 'field-label';
  baPassLabel.textContent = t('basicAuthPassword');
  const baPassWrapper = document.createElement('div');
  baPassWrapper.className = 'basic-auth-pass-wrapper';
  const baPassInput = document.createElement('input');
  baPassInput.type = 'password';
  baPassInput.className = 'input-sm';
  baPassInput.placeholder = t('basicAuthPassword');
  baPassInput.value = (env.basicAuth && env.basicAuth.password) || '';
  baPassInput.autocomplete = 'new-password';
  const baEyeBtn = document.createElement('button');
  baEyeBtn.type = 'button';
  baEyeBtn.className = 'btn-eye';
  baEyeBtn.title = t('basicAuthShow');
  baEyeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  baEyeBtn.addEventListener('click', () => {
    const isHidden = baPassInput.type === 'password';
    baPassInput.type = isHidden ? 'text' : 'password';
    baEyeBtn.title = isHidden ? t('basicAuthHide') : t('basicAuthShow');
  });
  baPassWrapper.appendChild(baPassInput);
  baPassWrapper.appendChild(baEyeBtn);
  baPassRow.appendChild(baPassLabel);
  baPassRow.appendChild(baPassWrapper);
  baFields.appendChild(baPassRow);

  // Sync notice
  const baSyncNotice = document.createElement('p');
  baSyncNotice.className = 'basic-auth-notice';
  baSyncNotice.textContent = t('basicAuthSyncNotice');
  baFields.appendChild(baSyncNotice);

  // Remove credentials button
  const baRemoveBtn = document.createElement('button');
  baRemoveBtn.type = 'button';
  baRemoveBtn.className = 'btn btn-sm btn-danger-outline';
  baRemoveBtn.textContent = t('basicAuthRemove');
  baRemoveBtn.addEventListener('click', async () => {
    baUserInput.value = '';
    baPassInput.value = '';
    await saveEnvField(groupId, env.id, 'basicAuth', null);
    baToggleInput.checked = false;
    baFields.style.display = 'none';
  });
  baFields.appendChild(baRemoveBtn);

  baSection.appendChild(baFields);

  // Save helpers
  async function saveBasicAuth() {
    await saveEnvField(groupId, env.id, 'basicAuth', {
      enabled: baToggleInput.checked,
      username: baUserInput.value.trim(),
      password: baPassInput.value,
    });
  }

  baToggleInput.addEventListener('change', async () => {
    baFields.style.display = baToggleInput.checked ? 'block' : 'none';
    await saveBasicAuth();
  });
  baUserInput.addEventListener('change', saveBasicAuth);
  baPassInput.addEventListener('change', saveBasicAuth);

  item.appendChild(baSection);

  // Delete environment button (bottom, danger)
  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'btn btn-sm btn-danger-outline btn-full';
  btnDelete.style.marginTop = '10px';
  btnDelete.textContent = t('deleteEnvironment');
  btnDelete.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteEnv', env.name || t('unnamed')));
    if (ok) {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        g.environments = g.environments.filter((e) => e.id !== env.id);
        await saveGroups(groups);
        item.remove();
        if (_editingGroup && _editingGroup.id === groupId) {
          _editingGroup.environments = g.environments;
        }
      }
    }
  });
  item.appendChild(btnDelete);

  return item;
}

/**
 * Saves the value of a single field on an environment.
 * @param {string} groupId
 * @param {string} envId
 * @param {string} field
 * @param {*} value
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
