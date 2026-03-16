// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, generateId } from './storage.js';
import { t } from './i18n.js';
import { ICONS, buildIconPicker } from './icons.js';

/**
 * Saves the value of a single field on a link belonging to a group.
 * @param {string} groupId
 * @param {string} linkId
 * @param {string} field
 * @param {*} value
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
 * @param {string} groupId
 * @param {HTMLElement} linksList
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
 * @returns {HTMLElement}
 */
export function buildLinkSettingsRow(groupId, group, link, linksList) {
  const row = document.createElement('div');
  row.className = 'link-settings-row';
  row.setAttribute('draggable', 'true');
  row.dataset.linkId = link.id;

  // Drag handle
  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  row.appendChild(handle);

  // Icon picker
  const iconPicker = buildIconPicker(link.icon || link.iconKey || 'link', (iconName) => {
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
  pathInput.className = 'input-sm';
  pathInput.style.flex = '1.5';
  pathInput.placeholder = t('linkPathPlaceholder');
  pathInput.value = link.path || '/';
  pathInput.addEventListener('change', () => saveLinkField(groupId, link.id, 'path', pathInput.value));
  row.appendChild(pathInput);

  // Type badge
  const isCmsLink = link.type === 'cms' || link.type === 'wordpress';
  const typeBadge = document.createElement('span');
  typeBadge.className = `link-type-badge ${isCmsLink ? 'wp' : 'custom'}`;
  typeBadge.textContent = isCmsLink ? 'CMS' : 'custom';
  row.appendChild(typeBadge);

  // Remove button
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-link';
  btnRemove.title = 'Remove this link';
  btnRemove.textContent = '×';
  btnRemove.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      g.links = g.links.filter((l) => l.id !== link.id);
      await saveGroups(groups);
      group.links = g.links;
      row.remove();
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
    // Clear all drop indicators
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  });

  row.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragging = linksList.querySelector('.dragging');
    if (!dragging || dragging === row) return;

    // Clear previous indicators
    linksList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Determine whether to insert before or after
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

    // Determine insert position
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

    // Persist the new order
    await reorderLinks(groupId, linksList);
  });

  return row;
}

/**
 * Builds the "Quick links" section for a group in the settings panel.
 * Supports HTML5 drag-and-drop reordering.
 * @param {string} groupId
 * @param {object} group
 * @returns {HTMLElement}
 */
export function buildLinksSection(groupId, group) {
  const section = document.createElement('div');
  section.className = 'links-section';

  const title = document.createElement('div');
  title.className = 'links-section-title';
  title.textContent = t('linksSection');
  section.appendChild(title);

  const linksList = document.createElement('div');
  linksList.dataset.groupId = groupId;
  section.appendChild(linksList);

  // Sort links by order before rendering
  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  links.forEach((link) => {
    linksList.appendChild(buildLinkSettingsRow(groupId, group, link, linksList));
  });

  // "Add custom link" button
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn btn-sm btn-outline btn-add-link';
  btnAdd.textContent = t('addLink');
  btnAdd.addEventListener('click', async () => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === groupId);
    if (g) {
      if (!g.links) g.links = [];
      const maxOrder = g.links.length > 0 ? Math.max(...g.links.map((l) => l.order || 0)) + 1 : 0;
      const newLink = {
        id: generateId(),
        label: '',
        path: '/',
        type: 'custom',
        icon: 'link',
        order: maxOrder,
      };
      g.links.push(newLink);
      await saveGroups(groups);
      // Update local group reference
      group.links = g.links;
      linksList.appendChild(buildLinkSettingsRow(groupId, group, newLink, linksList));
    }
  });
  section.appendChild(btnAdd);

  return section;
}
