// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el, confirm } from '../helpers/ui-helpers.js';
import { openProjectEdit, _fetchGroupFavicon } from './editing.js';
import { updateExportGroupSelect } from '../settings/settings.js';

/** Callbacks set by popup.js for the onboarding screen actions. */
let _projectsActions = null;

/**
 * Sets the action callbacks used by the onboarding screen.
 * Must be called once at popup startup.
 * @param {{ onCreateProject: Function, onDetectFromTabs: Function }} actions
 */
export function setProjectsActions(actions) {
  _projectsActions = actions;
}

/**
 * Renders the Projects panel: onboarding screen (empty) or list view.
 */
export async function renderEnvironmentsPanel() {
  const groups = await getGroups();
  const container = el('groups-list');
  if (!container) return;
  container.innerHTML = '';

  const addContainer = document.querySelector('.add-group-container');

  if (groups.length === 0) {
    container.appendChild(_buildOnboardingScreen());
    if (addContainer) addContainer.style.display = 'none';
    updateExportGroupSelect(groups);
    return;
  }

  if (addContainer) addContainer.style.display = '';
  groups.forEach((group) => container.appendChild(buildProjectListItem(group)));
  updateExportGroupSelect(groups);
}

/**
 * Builds the onboarding screen shown when no projects exist.
 * @returns {HTMLElement}
 */
function _buildOnboardingScreen() {
  const wrap = document.createElement('div');
  wrap.className = 'onboarding-screen';

  const title = document.createElement('h2');
  title.className = 'onboarding-title';
  title.textContent = t('onboardingTitle');
  wrap.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'onboarding-desc';
  desc.textContent = t('onboardingDesc');
  wrap.appendChild(desc);

  const btnCreate = document.createElement('button');
  btnCreate.type = 'button';
  btnCreate.className = 'btn btn-primary onboarding-btn';
  btnCreate.textContent = t('onboardingCreateBtn');
  btnCreate.addEventListener('click', () => _projectsActions?.onCreateProject());
  wrap.appendChild(btnCreate);

  const btnDetect = document.createElement('button');
  btnDetect.type = 'button';
  btnDetect.className = 'btn btn-outline onboarding-btn';
  btnDetect.textContent = t('onboardingDetectBtn');
  btnDetect.addEventListener('click', () => _projectsActions?.onDetectFromTabs());
  wrap.appendChild(btnDetect);

  const hint = document.createElement('p');
  hint.className = 'onboarding-hint';
  hint.textContent = t('onboardingDetectHint');
  wrap.appendChild(hint);

  return wrap;
}

/**
 * Builds a project list item row (favicon, name, env count badge, chevron).
 * @param {object} group
 * @returns {HTMLElement}
 */
function buildProjectListItem(group) {
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

  // Trash button: deletes the project directly from the list
  const trashBtn = document.createElement('button');
  trashBtn.type = 'button';
  trashBtn.className = 'btn-icon-trash project-list-trash';
  trashBtn.title = t('confirmDeleteGroup', group.name || t('unnamed'));
  trashBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
  trashBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await confirm(t('confirmDeleteGroup', group.name || t('unnamed')));
    if (ok) {
      const groups = await getGroups();
      await saveGroups(groups.filter((g) => g.id !== group.id));
      await renderEnvironmentsPanel();
    }
  });
  item.appendChild(trashBtn);

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
