// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, generateId } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { ICONS, buildIconPicker } from '../icons.js';
import { getDefaultCmsLinks, getDefaultNetworkLinks } from './cms.js';

/**
 * Saves the value of a single field on a link belonging to a group.
 */
export async function saveLinkField(groupId, linkId, field, value) {
  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  const l = g && g.links && g.links.find((x) => x.id === linkId);
  if (l) {
    l[field] = value;
    await saveGroups(groups);
  }
}

/**
 * Updates the order property of every link in a group based on the
 * current DOM order of the rows inside linksList.
 */
export async function reorderLinks(groupId, linksList) {
  const rows = linksList.querySelectorAll('.link-settings-row');
  const newOrder = Array.from(rows).map((r, i) => ({ id: r.dataset.linkId, order: i }));

  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  if (g) {
    newOrder.forEach(({ id, order }) => {
      const link = g.links.find((l) => l.id === id);
      if (link) link.order = order;
    });
    await saveGroups(groups);
  }
}

/**
 * Builds a single link row in the settings panel (with drag-and-drop support).
 * @param {string} groupId
 * @param {object} group
 * @param {object} link
 * @param {HTMLElement} linksList
 * @param {{ onRemove?: Function }} [callbacks]
 * @returns {HTMLElement}
 */
export function buildLinkSettingsRow(groupId, group, link, linksList, callbacks = {}) {
  const row = document.createElement('div');
  row.className = 'link-settings-row';
  row.setAttribute('draggable', 'true');
  row.dataset.linkId = link.id;
  if (link.cmsLinkId) row.dataset.cmsLinkId = link.cmsLinkId;

  // Drag handle
  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  row.appendChild(handle);

  // Icon picker
  const iconPicker = buildIconPicker(link.icon || 'link', (iconName) => {
    saveLinkField(groupId, link.id, 'icon', iconName);
  });
  row.appendChild(iconPicker);

  // Label input
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input-sm';
  labelInput.style.flex = '1';
  labelInput.placeholder = t('linkLabelPlaceholder');
  labelInput.value = link.label || '';
  labelInput.addEventListener('change', () => saveLinkField(groupId, link.id, 'label', labelInput.value));
  row.appendChild(labelInput);

  // Path input
  const pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.className = 'input-sm link-path-input';
  pathInput.style.flex = '1.5';
  pathInput.placeholder = t('linkPathPlaceholder');
  pathInput.value = link.path || '/';
  pathInput.addEventListener('change', () => {
    let path = pathInput.value.trim();
    if (path && !path.startsWith('/')) path = '/' + path;
    pathInput.value = path;
    saveLinkField(groupId, link.id, 'path', path);
  });
  row.appendChild(pathInput);

  // multisitePrefix checkbox — shown for all links in WP Multisite subdirectory mode
  // Network links: always checked + disabled (they never use a site prefix)
  const isSubdir = group.isWordPressMultisite && group.wpMultisiteType === 'subdirectory';
  const isNetworkLink = !!(link.cmsLinkId?.startsWith('network-'));
  if (isSubdir) {
    const isCmsLink = !!(link.cmsLinkId && !link.cmsLinkId.startsWith('network-'));
    const defaultPrefix = isCmsLink;
    const prefixChecked = isNetworkLink ? true : (link.multisitePrefix !== undefined ? link.multisitePrefix : defaultPrefix);

    const prefixLabel = document.createElement('label');
    prefixLabel.className = 'link-prefix-checkbox-label';
    prefixLabel.title = t('multisitePrefixCheckbox');
    const prefixCheck = document.createElement('input');
    prefixCheck.type = 'checkbox';
    prefixCheck.checked = prefixChecked;
    if (isNetworkLink) {
      prefixCheck.disabled = true;
    } else {
      prefixCheck.addEventListener('change', () => saveLinkField(groupId, link.id, 'multisitePrefix', prefixCheck.checked));
    }
    const prefixIcon = document.createElement('span');
    prefixIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
    prefixLabel.appendChild(prefixCheck);
    prefixLabel.appendChild(prefixIcon);
    row.appendChild(prefixLabel);
  }

  // Remove button
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-link btn-icon-trash';
  btnRemove.title = 'Remove this link';
  btnRemove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
  btnRemove.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.links = g.links.filter((l) => l.id !== link.id);
      await saveGroups(groups);
      group.links = g.links;
      row.remove();
      if (callbacks.onRemove) callbacks.onRemove(link);
    }
  });
  row.appendChild(btnRemove);

  // ── HTML5 drag-and-drop
  row.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', link.id);
    row.classList.add('dragging');
  });

  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  });

  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragging = linksList.querySelector('.dragging');
    if (!dragging || dragging === row) return;
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      row.classList.add('drag-over-top');
    } else {
      row.classList.add('drag-over-bottom');
    }
  });

  row.addEventListener('dragleave', () => {
    row.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  row.addEventListener('drop', async (e) => {
    e.preventDefault();
    row.classList.remove('drag-over-top', 'drag-over-bottom');
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === link.id) return;
    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midY;
    const draggedRow = linksList.querySelector(`[data-link-id="${draggedId}"]`);
    if (!draggedRow) return;
    if (insertBefore) {
      linksList.insertBefore(draggedRow, row);
    } else {
      row.after(draggedRow);
    }
    await reorderLinks(groupId, linksList);
  });

  return row;
}

/**
 * Builds the "Quick links" section for a group in the settings panel.
 * Includes a "Available CMS links" recovery zone below the active list.
 * @param {string} groupId
 * @param {object} group
 * @returns {HTMLElement}
 */
export function buildLinksSection(groupId, group) {
  const section = document.createElement('div');
  section.className = 'links-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('linksSection');
  section.appendChild(title);

  const linksList = document.createElement('div');
  linksList.dataset.groupId = groupId;
  section.appendChild(linksList);

  // Callback passed to every row so CMS link removal refreshes the available zone
  const onRemove = (link) => { if (link.cmsLinkId) refresh(); };

  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  links.forEach((link) => {
    linksList.appendChild(buildLinkSettingsRow(groupId, group, link, linksList, { onRemove }));
  });

  // "Add custom link" button
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn btn-sm btn-outline btn-full btn-add-link';
  btnAdd.textContent = t('addLink');
  btnAdd.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      if (!g.links) g.links = [];
      const maxOrder = g.links.length > 0 ? Math.max(...g.links.map((l) => l.order || 0)) + 1 : 0;
      const newLink = { id: generateId(), label: '', path: '/', icon: 'link', order: maxOrder };
      g.links.push(newLink);
      await saveGroups(groups);
      group.links = g.links;
      linksList.appendChild(buildLinkSettingsRow(groupId, group, newLink, linksList, { onRemove }));
    }
  });
  section.appendChild(btnAdd);

  // Available CMS links zone — rebuilt on every CMS link add/remove
  let availableContainer = null;
  function refresh() {
    if (availableContainer) availableContainer.remove();
    availableContainer = _buildAvailableCmsLinksZone(groupId, group, linksList, refresh);
    if (availableContainer) section.appendChild(availableContainer);
  }
  refresh();

  return section;
}

/**
 * Builds the "Available CMS links" recovery zone.
 * Returns null when there are no missing predefined links or no CMS is selected.
 */
function _buildAvailableCmsLinksZone(groupId, group, linksList, refresh) {
  if (!group.cms || group.cms === 'none') return null;

  const allPredefined = getDefaultCmsLinks(group.cms, group.cmsAdminPath);
  const allNetwork = group.isWordPressMultisite ? getDefaultNetworkLinks() : [];
  const allLinks = [...allPredefined, ...allNetwork];

  const existingIds = new Set((group.links || []).map((l) => l.cmsLinkId).filter(Boolean));
  const available = allLinks.filter((l) => !existingIds.has(l.cmsLinkId));

  if (available.length === 0) return null;

  const zone = document.createElement('div');
  zone.className = 'available-cms-links';

  const zoneTitle = document.createElement('div');
  zoneTitle.className = 'section-title';
  zoneTitle.textContent = t('availableCmsLinks');
  zone.appendChild(zoneTitle);

  const grid = document.createElement('div');
  grid.className = 'available-cms-links-grid';
  zone.appendChild(grid);

  available.forEach((defLink) => {
    const row = document.createElement('div');
    row.className = 'available-cms-link-row';
    row.dataset.cmsLinkId = defLink.cmsLinkId;

    const btnRestore = document.createElement('button');
    btnRestore.type = 'button';
    btnRestore.className = 'btn-restore-cms-link';
    btnRestore.textContent = '+';
    btnRestore.addEventListener('click', async () => {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (!g) return;
      if (!g.links) g.links = [];
      const maxOrder = g.links.length > 0 ? Math.max(...g.links.map((l) => l.order || 0)) + 1 : 0;
      const newLink = { ...defLink, id: generateId(), order: maxOrder };
      g.links.push(newLink);
      await saveGroups(groups);
      group.links = g.links;
      const onRemove = (link) => { if (link.cmsLinkId) refresh(); };
      linksList.appendChild(buildLinkSettingsRow(groupId, group, newLink, linksList, { onRemove }));
      refresh();
    });

    const iconSpan = document.createElement('span');
    iconSpan.className = 'available-cms-link-icon';
    iconSpan.innerHTML = ICONS[defLink.icon] || ICONS['link'];

    const labelSpan = document.createElement('span');
    labelSpan.className = 'available-cms-link-label';
    labelSpan.textContent = defLink.label;

    row.appendChild(btnRestore);
    row.appendChild(iconSpan);
    row.appendChild(labelSpan);
    grid.appendChild(row);
  });

  return zone;
}
