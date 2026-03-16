// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, getSettings, saveSettings, generateId, COLOR_PALETTE } from './storage.js';
import { t } from './i18n.js';
import { el, confirm } from './ui-helpers.js';
import { buildMultisiteUrl } from './wordpress.js';
import { buildLinksSection } from './links.js';
import { CMS_IDS, CMS_DEFAULT_LOGIN_PATH, CMS_DEFAULT_ADMIN_PATH, getDefaultCmsLinks } from './cms.js';

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

  // ── CMS selector row
  const cmsRow = document.createElement('div');
  cmsRow.className = 'field-row';
  cmsRow.style.marginTop = '12px';
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
  body.appendChild(cmsRow);

  // Container for CMS config (login path, admin path for PrestaShop, WP multisite)
  const cmsConfigContainer = document.createElement('div');
  cmsConfigContainer.style.display = (group.cms && group.cms !== 'none') ? 'block' : 'none';
  buildCmsGroupConfig(group.id, group, cmsConfigContainer);
  body.appendChild(cmsConfigContainer);

  cmsSelect.addEventListener('change', async () => {
    const newCms = cmsSelect.value;
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (!g) return;

    // Count existing CMS links
    const cmsLinksCount = g.links ? g.links.filter((l) => l.type === 'cms').length : 0;

    if (cmsLinksCount > 0 && newCms !== g.cms) {
      const ok = await confirm(t('confirmDisableCms', String(cmsLinksCount)));
      if (!ok) {
        cmsSelect.value = g.cms || 'none';
        return;
      }
      // Remove old CMS links
      g.links = (g.links || []).filter((l) => l.type !== 'cms');
    }

    g.cms = newCms;

    if (newCms !== 'none') {
      // Set default login path for the new CMS if not already custom
      g.cmsLoginPath = CMS_DEFAULT_LOGIN_PATH[newCms] || '/';
      g.cmsAdminPath = CMS_DEFAULT_ADMIN_PATH[newCms] || '';
      // Add predefined links for the new CMS
      if (!g.links) g.links = [];
      const defaultLinks = getDefaultCmsLinks(newCms, g.cmsLoginPath, g.cmsAdminPath);
      g.links = [...defaultLinks, ...g.links];
    } else {
      // Reset WP Multisite when switching to 'none'
      g.isWordPressMultisite = false;
    }

    await saveGroups(groups);
    Object.assign(group, g);

    // Show/hide CMS config container
    cmsConfigContainer.style.display = newCms !== 'none' ? 'block' : 'none';
    // Rebuild CMS config section
    cmsConfigContainer.innerHTML = '';
    buildCmsGroupConfig(group.id, group, cmsConfigContainer);
    // Rebuild links section
    const linksSection = body.querySelector('.links-section');
    if (linksSection) linksSection.remove();
    body.appendChild(buildLinksSection(group.id, group));
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
      if (g) {
        g.isWordPressMultisite = isMs;
        await saveGroups(groups);
      }
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

  // Row 2: Protocol + Domain
  const row2 = document.createElement('div');
  row2.className = 'env-manage-row env-domain-row';

  // Protocol selector (HTTPS / HTTP)
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
  protocolSelect.addEventListener('change', () => {
    saveEnvField(groupId, env.id, 'protocol', protocolSelect.value);
  });

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('envDomainPlaceholder');
  domainInput.value = env.domain || '';
  domainInput.addEventListener('change', () => {
    // Sanitize domain: strip protocol, paths, whitespace; preserve port
    let raw = domainInput.value.trim();
    try {
      if (raw.includes('://')) {
        const parsed = new URL(raw);
        // Detect protocol from pasted URL and update selector
        const detectedProto = parsed.protocol.replace(':', '');
        if (detectedProto === 'http' || detectedProto === 'https') {
          protocolSelect.value = detectedProto;
          saveEnvField(groupId, env.id, 'protocol', detectedProto);
        }
        raw = parsed.host; // host preserves port (e.g. localhost:3000)
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
