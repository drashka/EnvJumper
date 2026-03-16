// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, getSettings, saveSettings, generateId, COLOR_PALETTE } from './storage.js';
import { t } from './i18n.js';
import { el, confirm } from './ui-helpers.js';
import { WP_ICONS, getDefaultWpLinks } from './wordpress.js';
import { buildLinksSection } from './links.js';

/**
 * Renders the Settings panel: group cards, general settings, export select.
 */
export async function renderSettingsPanel() {
  const [groups, settings] = await Promise.all([getGroups(), getSettings()]);
  const container = el('groups-list');
  container.innerHTML = '';

  groups.forEach((group) => {
    container.appendChild(buildGroupCard(group));
  });

  // "General settings" section just above export/import
  const generalContainer = el('general-settings-container');
  generalContainer.innerHTML = '';
  generalContainer.appendChild(buildGeneralSettings(settings));

  updateExportGroupSelect(groups);
}

/**
 * Builds the "General Settings" section displayed at the top of the Settings tab.
 * @param {object} settings - Current settings object
 * @returns {HTMLElement}
 */
function buildGeneralSettings(settings) {
  const section = document.createElement('div');
  section.className = 'general-settings-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('generalSettings');
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

/**
 * Builds the card for a group inside the Settings panel.
 * Includes the WordPress toggle and the links section at group level.
 * @param {object} group
 * @returns {HTMLElement}
 */
function buildGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'group-card';
  card.dataset.groupId = group.id;

  // ── Group header
  const header = document.createElement('div');
  header.className = 'group-header';

  const chevron = document.createElement('span');
  chevron.className = 'group-chevron';
  chevron.textContent = '▶';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'group-name-input';
  nameInput.value = group.name;
  nameInput.placeholder = 'Group name';
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
  btnDelete.title = 'Delete this group';
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

  // ── Group body
  const body = document.createElement('div');
  body.className = 'group-body';

  // Environment list
  const envList = document.createElement('div');
  envList.className = 'env-manage-list';
  envList.dataset.groupId = group.id;

  group.environments.forEach((env) => {
    envList.appendChild(buildEnvItem(group.id, env));
  });
  body.appendChild(envList);

  // "Add environment" button
  const btnAddEnv = document.createElement('button');
  btnAddEnv.className = 'btn btn-sm btn-outline btn-full';
  btnAddEnv.textContent = t('addEnv');
  btnAddEnv.addEventListener('click', async () => {
    // An environment only stores: id, name, domain, color
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

  // ── WordPress toggle at group level
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

  // Container for the WP config section (shown when isWordPress is true)
  const wpConfigContainer = document.createElement('div');
  wpConfigContainer.style.display = group.isWordPress ? 'block' : 'none';
  buildWpGroupConfig(group.id, group, wpConfigContainer);
  body.appendChild(wpConfigContainer);

  wpToggleInput.addEventListener('change', async () => {
    const isWp = wpToggleInput.checked;

    if (isWp) {
      // Enable WordPress: add predefined links if none exist yet
      const groups = await getGroups();
      const g = groups.find((x) => x.id === group.id);
      if (g) {
        g.isWordPress = true;
        if (!g.links) g.links = [];
        const hasWpLinks = g.links.some((l) => l.type === 'wordpress');
        if (!hasWpLinks) {
          const defaultLinks = getDefaultWpLinks(g.wpLoginPath || '/wp-login.php');
          g.links = [...defaultLinks, ...g.links];
        }
        await saveGroups(groups);
        // Update local group reference to rebuild WP section
        Object.assign(group, g);
      }
      wpConfigContainer.style.display = 'block';
      // Rebuild WP config section
      wpConfigContainer.innerHTML = '';
      buildWpGroupConfig(group.id, group, wpConfigContainer);
      // Rebuild links section
      const linksSection = body.querySelector('.links-section');
      if (linksSection) linksSection.remove();
      body.appendChild(buildLinksSection(group.id, group));
    } else {
      // Disable WordPress
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
      // Rebuild links section
      const linksSection = body.querySelector('.links-section');
      if (linksSection) linksSection.remove();
      body.appendChild(buildLinksSection(group.id, group));
    }
  });

  // ── Quick links section at group level
  body.appendChild(buildLinksSection(group.id, group));

  // Accordion toggle
  header.addEventListener('click', () => {
    card.classList.toggle('open');
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

/**
 * Builds the WordPress sub-form at group level.
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container - Parent element to append the section into
 */
function buildWpGroupConfig(groupId, group, container) {
  const section = document.createElement('div');
  section.className = 'wp-env-section';

  const titleRow = document.createElement('div');
  titleRow.className = 'wp-env-section-title';
  titleRow.innerHTML = `<span style="display:inline-flex;width:14px;height:14px;flex-shrink:0">${WP_ICONS.wordpress}</span> ${t('wpConfigTitle')}`;
  section.appendChild(titleRow);

  // wpLoginPath field
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

  // WordPress Multisite toggle
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
    if (g) {
      g.isWordPressMultisite = isMs;
      await saveGroups(groups);
    }
  });

  container.appendChild(section);
}

/**
 * Builds the WordPress Multisite configuration fields inside a group.
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container
 */
function buildWpMultisiteFields(groupId, group, container) {
  container.innerHTML = '';

  const msTitle = document.createElement('div');
  msTitle.className = 'wp-config-title';
  msTitle.textContent = t('wpMultisiteConfigTitle');
  container.appendChild(msTitle);

  // Network domain field
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

  // Sites list
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
 * Builds a single WordPress Multisite site row at group level.
 * @param {string} groupId
 * @param {object} site
 * @param {number} idx
 * @param {HTMLElement} sitesList
 * @returns {HTMLElement}
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
  row.appendChild(domainInput);
  row.appendChild(btnRemove);
  return row;
}

/**
 * Builds an environment item in the Settings panel.
 * An environment only stores: name, domain, color.
 * @param {string} groupId
 * @param {object} env
 * @returns {HTMLElement}
 */
function buildEnvItem(groupId, env) {
  const item = document.createElement('div');
  item.className = 'env-manage-item';
  item.dataset.envId = env.id;

  // Row 1: Name + delete button
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
  btnDelete.title = 'Delete this environment';
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

  // Row 2: Domain
  const row2 = document.createElement('div');
  row2.className = 'env-manage-row';

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('envDomainPlaceholder');
  domainInput.value = env.domain || '';
  domainInput.addEventListener('change', () => {
    // Sanitize domain: strip protocol, paths, whitespace
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

  // Row 3: Color picker
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

/**
 * Refreshes the export group <select> options.
 * @param {Array} groups
 */
export function updateExportGroupSelect(groups) {
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
