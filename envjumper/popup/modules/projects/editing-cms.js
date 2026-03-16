// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { confirm } from '../helpers/ui-helpers.js';
import { buildMultisiteUrl } from './wordpress.js';
import { CMS_IDS, CMS_DEFAULT_LOGIN_PATH, CMS_DEFAULT_ADMIN_PATH, getDefaultCmsLinks, getDefaultNetworkLinks } from './cms.js';

/** Builds the "CMS" sub-tab content. */
export function buildCmsSubtab(container, group) {
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
      if (!ok) { cmsSelect.value = g.cms || 'none'; return; }
      g.links = (g.links || []).filter((l) => l.type !== 'cms');
    }
    g.cms = newCms;
    if (newCms !== 'none') {
      g.cmsLoginPath = CMS_DEFAULT_LOGIN_PATH[newCms] || '/';
      g.cmsAdminPath = CMS_DEFAULT_ADMIN_PATH[newCms] || '';
      if (!g.links) g.links = [];
      g.links = [...getDefaultCmsLinks(newCms, g.cmsLoginPath, g.cmsAdminPath), ...g.links];
    } else {
      g.isWordPressMultisite = false;
    }
    await saveGroups(groups);
    Object.assign(group, g);

    cmsConfigContainer.style.display = newCms !== 'none' ? 'block' : 'none';
    cmsConfigContainer.innerHTML = '';
    buildCmsGroupConfig(group.id, group, cmsConfigContainer);
  });
}

/** Builds the CMS sub-form (login path, admin path, WP Multisite toggle). */
export function buildCmsGroupConfig(groupId, group, container) {
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
    if (g) { g.cmsLoginPath = loginInput.value.trim() || CMS_DEFAULT_LOGIN_PATH[g.cms] || '/'; await saveGroups(groups); }
  });
  loginRow.appendChild(loginLabel);
  loginRow.appendChild(loginInput);
  section.appendChild(loginRow);

  if (group.cms === 'prestashop') { // cmsAdminPath (PrestaShop only)
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
        const cmsLinksCount = g.links ? g.links.filter((l) => l.type === 'cms').length : 0;
        if (cmsLinksCount > 0) {
          g.links = [...getDefaultCmsLinks(g.cms, g.cmsLoginPath, g.cmsAdminPath), ...(g.links || []).filter((l) => l.type !== 'cms')];
        }
        await saveGroups(groups);
        Object.assign(group, g);
      }
    });
    adminPathRow.appendChild(adminPathLabel);
    adminPathRow.appendChild(adminPathInput);
    section.appendChild(adminPathRow);
  }

  if (group.cms === 'wordpress') { // WordPress Multisite toggle
    const msToggleRow = document.createElement('div');
    msToggleRow.className = 'toggle-row';
    msToggleRow.style.cssText = 'margin-bottom:6px;padding-bottom:6px;';
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
        if (!g.links) g.links = [];
        if (!g.links.some((l) => l.type === 'network')) {
          g.links = [...g.links, ...getDefaultNetworkLinks()];
        }
      } else {
        if (g.links) g.links = g.links.filter((l) => l.type !== 'network');
      }
      await saveGroups(groups);
      Object.assign(group, g);
    });
  }

  container.appendChild(section);
}

/** Builds the WordPress Multisite configuration fields. */
export function buildWpMultisiteFields(groupId, group, container) {
  container.innerHTML = '';

  const msTitle = document.createElement('div');
  msTitle.className = 'wp-config-title';
  msTitle.textContent = t('wpMultisiteConfigTitle');
  container.appendChild(msTitle);

  const getPreviewDomain = () => group.environments[0]?.domain || 'exemple.com';

  const typeRow = document.createElement('div');
  typeRow.className = 'field-row';
  const typeLabel = document.createElement('label');
  typeLabel.className = 'field-label';
  typeLabel.textContent = t('wpMultisiteType');
  const typeSelect = document.createElement('select');
  typeSelect.className = 'input-sm select-sm';
  [['subdomain', 'wpMultisiteSubdomain'], ['subdirectory', 'wpMultisiteSubdirectory']].forEach(([val, key]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = t(key);
    typeSelect.appendChild(opt);
  });
  typeSelect.value = group.wpMultisiteType || 'subdomain';
  typeSelect.addEventListener('change', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.wpMultisiteType = typeSelect.value;
      await saveGroups(groups);
      container.querySelectorAll('.wp-site-preview').forEach((span, idx) => {
        const site = (g.wpSites || [])[idx];
        if (site !== undefined) {
          span.textContent = `→ ${buildMultisiteUrl(getPreviewDomain(), site.prefix || '', typeSelect.value, '/').replace('https://', '').replace(/\/$/, '')}`;
        }
      });
    }
  });
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(typeSelect);
  container.appendChild(typeRow);

  const sitesLabel = document.createElement('div');
  sitesLabel.className = 'field-label';
  sitesLabel.style.marginTop = '8px';
  sitesLabel.textContent = t('wpSitesLabel');
  container.appendChild(sitesLabel);

  const sitesList = document.createElement('div');
  sitesList.className = 'wp-sites-list';
  (group.wpSites || []).forEach((site, idx) => {
    sitesList.appendChild(_buildWpSiteRow(groupId, group, site, idx, typeSelect, getPreviewDomain));
  });
  container.appendChild(sitesList);

  const btnAddSite = document.createElement('button');
  btnAddSite.className = 'btn btn-sm btn-outline btn-full';
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
      sitesList.appendChild(_buildWpSiteRow(groupId, group, newSite, g.wpSites.length - 1, typeSelect, getPreviewDomain));
    }
  });
  container.appendChild(btnAddSite);
}

/** Builds a single WordPress Multisite site row. */
function _buildWpSiteRow(groupId, group, site, idx, typeSelect, getPreviewDomain) {
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

  const previewSpan = document.createElement('span');
  previewSpan.className = 'wp-site-preview';
  previewSpan.style.cssText = 'font-size:11px;color:var(--color-text-muted);white-space:nowrap;flex-shrink:0;';
  const updatePreview = () => {
    const url = buildMultisiteUrl(getPreviewDomain(), prefixInput.value.trim(), typeSelect ? typeSelect.value : (group.wpMultisiteType || 'subdomain'), '/');
    previewSpan.textContent = `→ ${url.replace('https://', '').replace(/\/$/, '')}`;
  };
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
    if (g && g.wpSites) { g.wpSites.splice(idx, 1); await saveGroups(groups); row.remove(); }
  });

  row.appendChild(labelInput);
  row.appendChild(prefixInput);
  row.appendChild(previewSpan);
  row.appendChild(btnRemove);
  return row;
}
