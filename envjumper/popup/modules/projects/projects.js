// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el } from '../helpers/ui-helpers.js';
import { openProjectEdit, _fetchGroupFavicon } from './editing.js';
import { updateExportGroupSelect } from '../settings/settings.js';

/**
 * Renders the Projects panel: list view with project rows.
 */
export async function renderEnvironmentsPanel() {
  const groups = await getGroups();
  const container = el('groups-list');
  if (!container) return;
  container.innerHTML = '';
  groups.forEach((group) => container.appendChild(buildProjectListItem(group)));
  updateExportGroupSelect(groups);
}

/**
 * Builds a project list item row (favicon, name, env count badge, chevron).
 * @param {object} group
 * @returns {HTMLElement}
 */
export function buildProjectListItem(group) {
  const item = document.createElement('div');
  item.className = 'project-list-item';
  item.dataset.groupId = group.id;

  item.appendChild(_buildFaviconEl(group, 20));

  const info = document.createElement('div');
  info.className = 'project-list-info';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'project-list-name';
  nameSpan.textContent = group.name || t('unnamed');
  info.appendChild(nameSpan);
  item.appendChild(info);

  const badge = document.createElement('span');
  badge.className = 'project-list-badge';
  badge.textContent = `${group.environments.length} envs`;
  item.appendChild(badge);

  const chev = document.createElement('span');
  chev.className = 'project-list-chevron';
  chev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 18l6-6-6-6"/></svg>`;
  item.appendChild(chev);

  item.addEventListener('click', () => openProjectEdit(group));
  return item;
}

/**
 * Builds a favicon element with async load and globe fallback.
 * @param {object} group
 * @param {number} size
 * @returns {HTMLElement}
 */
function _buildFaviconEl(group, size = 20) {
  const wrap = document.createElement('div');
  wrap.className = 'project-favicon';

  const globe = document.createElement('span');
  globe.className = 'project-favicon-globe';
  globe.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  wrap.appendChild(globe);

  _fetchGroupFavicon(group).then((url) => {
    if (!url) return;
    const img = document.createElement('img');
    img.width = size;
    img.height = size;
    img.style.borderRadius = '3px';
    img.addEventListener('load', () => { globe.style.display = 'none'; wrap.appendChild(img); });
    img.addEventListener('error', () => {});
    img.src = url;
  });

  return wrap;
}
