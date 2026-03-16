// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el } from '../helpers/ui-helpers.js';
import { buildLinksSection } from './links.js';
import { buildEnvsSubtab, buildProjectSettingsSubtab } from './editing-envs.js';
import { buildCmsSubtab } from './editing-cms.js';
import { updateExportGroupSelect } from '../settings/settings.js';

// ── Module state ──────────────────────────────────────────────────────────────
let _editingGroup = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Opens the edit view for a project.
 * @param {object} group
 */
export function openProjectEdit(group) {
  _editingGroup = group;

  const nameInput = el('project-edit-name-input');
  if (nameInput) nameInput.value = group.name || '';

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

  _switchProjectSubtab('envs');

  const row = document.querySelector('.projects-views-row');
  if (row) row.classList.add('show-edit');
}

/**
 * Initializes the Environments panel's back button, sub-tabs, and name input.
 * Must be called once at popup startup.
 * @param {{ onBack: Function }} callbacks - onBack called after closing the edit view
 */
export function initEnvironmentsPanel({ onBack }) {
  el('project-back-btn')?.addEventListener('click', async () => {
    closeProjectEdit();
    await onBack();
  });

  document.querySelectorAll('.project-subtab').forEach((btn) => {
    btn.addEventListener('click', () => _switchProjectSubtab(btn.dataset.subtab));
  });

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
 * Slides back to the list view (exported so popup.js can use it if needed).
 */
export function closeProjectEdit() {
  _editingGroup = null;
  const row = document.querySelector('.projects-views-row');
  if (row) row.classList.remove('show-edit');
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _switchProjectSubtab(subtab) {
  document.querySelectorAll('.project-subtab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.subtab === subtab);
  });

  const content = el('project-subtab-content');
  if (!content || !_editingGroup) return;
  content.innerHTML = '';

  if (subtab === 'envs') {
    buildEnvsSubtab(content, _editingGroup, {
      onClose: closeProjectEdit,
      onRefresh: async () => {
        // Dynamic import to avoid circular dependency with projects.js
        const { renderEnvironmentsPanel } = await import('./projects.js');
        await renderEnvironmentsPanel();
      },
    });
  } else if (subtab === 'cms') {
    buildCmsSubtab(content, _editingGroup);
  } else if (subtab === 'links') {
    content.appendChild(buildLinksSection(_editingGroup.id, _editingGroup));
  } else if (subtab === 'settings') {
    buildProjectSettingsSubtab(content, _editingGroup, {
      onClose: closeProjectEdit,
      onRefresh: async () => {
        const { renderEnvironmentsPanel } = await import('./projects.js');
        await renderEnvironmentsPanel();
      },
    });
  }
}

/**
 * Fetches (and caches) the favicon URL for a group.
 * @param {object} group
 * @returns {Promise<string|null>}
 */
async function _fetchGroupFavicon(group) {
  const cacheKey = `favicon_${group.id}`;
  const currentDomains = group.environments.map((e) => e.domain).join(',');

  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) {
    const { url, ts, domains } = cached[cacheKey];
    if (Date.now() - ts < 86400000 && domains === currentDomains) return url;
  }

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

  const firstDomain = group.environments.find((e) => e.domain)?.domain;
  if (firstDomain) {
    const googleUrl = `https://www.google.com/s2/favicons?domain=${firstDomain}&sz=32`;
    await chrome.storage.local.set({ [cacheKey]: { url: googleUrl, ts: Date.now(), domains: currentDomains } });
    return googleUrl;
  }

  return null;
}

export { _fetchGroupFavicon };
