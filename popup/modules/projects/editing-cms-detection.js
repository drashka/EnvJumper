// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { getActiveTabMatchingGroup, detectCmsOnTab, computeSitePrefix } from '../helpers/cms-detection.js';

/**
 * Asynchronously detects the CMS on the active tab (if it matches a group env)
 * and inserts a suggestion banner into the CMS sub-tab.
 * No-op if detection fails or no CMS is found.
 *
 * @param {HTMLElement} container - The CMS sub-tab container
 * @param {object} group
 * @param {HTMLElement} cmsConfigContainer
 * @param {Function} onActivate - Called with the full detection result when user clicks "Enable"
 */
export async function buildCmsDetectionBanner(container, group, cmsConfigContainer, onActivate) {
  const tab = await getActiveTabMatchingGroup(group);
  if (!tab) return;

  const result = await detectCmsOnTab(tab.id);
  if (!result?.cms) return;

  // User may have selected a CMS manually while detection was running
  if (group.cms && group.cms !== 'none') return;

  const banner = document.createElement('div');
  banner.className = 'cms-detection-banner';

  const text = document.createElement('span');
  text.textContent = t('cmsDetectedBanner', t(`cms_${result.cms}`));

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-sm btn-outline';
  btn.textContent = t('cmsDetectedEnable');
  btn.addEventListener('click', async () => {
    banner.remove();
    await onActivate(result);
  });

  banner.appendChild(text);
  banner.appendChild(btn);
  container.insertBefore(banner, cmsConfigContainer);
}

/**
 * Asynchronously detects WordPress Multisite network sites on the active tab
 * and appends a suggestion section to the multisite config container.
 * Only shows sites not already present in group.wpSites.
 *
 * @param {string} groupId
 * @param {object} group
 * @param {HTMLElement} container - The multisite fields container
 * @param {HTMLElement} sitesList - The wp-sites-list element
 * @param {HTMLSelectElement} typeSelect - The multisite type select
 * @param {Function} getPreviewDomain
 * @param {Function} buildWpSiteRow - Row builder from editing-cms.js
 */
export async function buildMultisiteSiteSuggestions(groupId, group, container, sitesList, typeSelect, getPreviewDomain, buildWpSiteRow) {
  const tab = await getActiveTabMatchingGroup(group);
  if (!tab) return;

  const result = await detectCmsOnTab(tab.id);
  if (!result?.multisiteSites?.length) return;

  const mainDomain = group.environments[0]?.domain || '';
  const existingPrefixes = new Set((group.wpSites || []).map((s) => s.prefix));

  const newSites = result.multisiteSites
    .map((s) => ({ ...s, computedPrefix: computeSitePrefix(s, result.multisiteType || group.wpMultisiteType, mainDomain) }))
    .filter((s) => !existingPrefixes.has(s.computedPrefix));

  if (newSites.length === 0) return;

  const section = document.createElement('div');
  section.className = 'wp-sites-detected-section';

  const label = document.createElement('div');
  label.className = 'field-label';
  label.style.marginBottom = '4px';
  label.textContent = t('wpNetworkSitesDetected');
  section.appendChild(label);

  newSites.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'wp-site-suggestion-row';

    const info = document.createElement('span');
    const locationHint = (result.multisiteType || group.wpMultisiteType) === 'subdirectory'
      ? (s.path || '/')
      : s.domain;
    info.textContent = `${s.label} (${locationHint})`;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-sm btn-outline';
    addBtn.textContent = t('envSuggestionsAdd');
    addBtn.addEventListener('click', async () => {
      const newSite = { label: s.label, prefix: s.computedPrefix };
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        if (!g.wpSites) g.wpSites = [];
        g.wpSites.push(newSite);
        group.wpSites = g.wpSites;
        await saveGroups(groups);
        sitesList.appendChild(buildWpSiteRow(groupId, group, newSite, g.wpSites.length - 1, typeSelect, getPreviewDomain));
      }
      row.remove();
      if (section.querySelectorAll('.wp-site-suggestion-row').length === 0) section.remove();
    });

    row.appendChild(info);
    row.appendChild(addBtn);
    section.appendChild(row);
  });

  container.insertBefore(section, sitesList);
}
