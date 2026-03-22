// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { confirm } from '../helpers/ui-helpers.js';
import { buildMultisiteUrl } from './wordpress.js';
import { CMS_IDS, CMS_DEFAULT_ADMIN_PATH, getDefaultCmsLinks, getDefaultNetworkLinks } from './cms.js';

/** Returns true if a link is a predefined CMS link (not network). */
function _isCmsLink(l) { return !!(l.cmsLinkId && !l.cmsLinkId.startsWith('network-')); }

/** Returns true if a link is a predefined network link. */
function _isNetworkLink(l) { return !!(l.cmsLinkId?.startsWith('network-')); }

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

    const cmsLinksCount = (group.links || []).filter(_isCmsLink).length;
    if (cmsLinksCount > 0 && newCms !== (group.cms || 'none')) {
      const ok = await confirm(t('confirmDisableCms', String(cmsLinksCount)));
      if (!ok) { cmsSelect.value = group.cms || 'none'; return; }
      group.links = (group.links || []).filter((l) => !_isCmsLink(l));
    }

    group.cms = newCms;
    if (newCms !== 'none') {
      group.cmsAdminPath = CMS_DEFAULT_ADMIN_PATH[newCms] || '';
      if (!group.links) group.links = [];
      group.links = [...getDefaultCmsLinks(newCms, group.cmsAdminPath), ...group.links];
    } else {
      group.isWordPressMultisite = false;
    }

    cmsConfigContainer.style.display = newCms !== 'none' ? 'block' : 'none';
    cmsConfigContainer.innerHTML = '';
    buildCmsGroupConfig(group.id, group, cmsConfigContainer);

    try {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === group.id);
      if (g) {
        Object.assign(g, group);
      } else {
        groups.push(Object.assign({}, group));
      }
      await saveGroups(groups);
    } catch (e) {
      console.error('[EnvJumper] CMS save failed:', e);
    }
  });
}

/** Builds the CMS sub-form (admin path for PrestaShop, WP Multisite toggle). */
function buildCmsGroupConfig(groupId, group, container) {
  const section = document.createElement('div');
  section.className = 'wp-env-section';

  const titleRow = document.createElement('div');
  titleRow.className = 'section-title';
  titleRow.textContent = t('wpConfigTitle');
  section.appendChild(titleRow);

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
      const val = adminPathInput.value.trim() || '/admin-dev';
      group.cmsAdminPath = val;
      const cmsLinksCount = (group.links || []).filter(_isCmsLink).length;
      if (cmsLinksCount > 0) {
        group.links = [...getDefaultCmsLinks(group.cms, group.cmsAdminPath), ...(group.links || []).filter((l) => !_isCmsLink(l))];
      }
      try {
        const groups = await getGroups();
        const g = groups.find((x) => x.id === groupId);
        if (g) { Object.assign(g, group); await saveGroups(groups); }
      } catch (e) { console.error('[EnvJumper] adminPath save failed:', e); }
    });
    adminPathRow.appendChild(adminPathLabel);
    adminPathRow.appendChild(adminPathInput);
    section.appendChild(adminPathRow);
  }

  if (group.cms === 'wordpress') {
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
      group.isWordPressMultisite = isMs;
      msSection.style.display = isMs ? 'block' : 'none';
      if (isMs) {
        if (!group.links) group.links = [];
        if (!group.links.some(_isNetworkLink)) {
          group.links = [...group.links, ...getDefaultNetworkLinks()];
        }
      } else {
        if (group.links) group.links = group.links.filter((l) => !_isNetworkLink(l));
      }

      try {
        const groups = await getGroups();
        const g = groups.find((x) => x.id === groupId);
        if (g) {
          Object.assign(g, group);
        } else {
          groups.push(Object.assign({}, group));
        }
        await saveGroups(groups);
      } catch (e) {
        console.error('[EnvJumper] Multisite save failed:', e);
      }
    });
  }

  container.appendChild(section);
}

/** Builds the WordPress Multisite configuration fields. */
function buildWpMultisiteFields(groupId, group, container) {
  container.innerHTML = '';

  const msTitle = document.createElement('div');
  msTitle.className = 'section-title';
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
    group.wpMultisiteType = typeSelect.value;
    container.querySelectorAll('.wp-site-preview').forEach((span, idx) => {
      const site = (group.wpSites || [])[idx];
      if (site !== undefined) {
        span.textContent = `→ ${buildMultisiteUrl(getPreviewDomain(), site.prefix || '', typeSelect.value, '/').replace('https://', '').replace(/\/$/, '')}`;
      }
    });
    try {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) { g.wpMultisiteType = typeSelect.value; await saveGroups(groups); }
    } catch (e) { console.error('[EnvJumper] multisiteType save failed:', e); }
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
  btnAddSite.className = 'btn btn-sm btn-outline btn-full btn-add-wp-site';
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
