// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getSettings, saveSettings } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el } from '../helpers/ui-helpers.js';

/**
 * Renders the Settings panel: general settings (badge position).
 */
export async function renderSettingsPanel() {
  const settings = await getSettings();
  const generalContainer = el('general-settings-container');
  generalContainer.innerHTML = '';
  generalContainer.appendChild(_buildGeneralSettings(settings));
}

/**
 * Refreshes the export group <select> options.
 * @param {Array} groups
 */
export function updateExportGroupSelect(groups) {
  const select = el('export-group-select');
  if (!select) return;
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

/**
 * Builds the "General Settings" section (badge position diagram).
 * @param {object} settings
 * @returns {HTMLElement}
 */
function _buildGeneralSettings(settings) {
  const section = document.createElement('div');
  section.className = 'general-settings-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('displaySection');
  section.appendChild(title);

  const posLabel = document.createElement('div');
  posLabel.className = 'field-label';
  posLabel.style.marginBottom = '8px';
  posLabel.textContent = t('badgePositionLabel');
  section.appendChild(posLabel);

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
