// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getSettings, saveSettings } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el } from '../helpers/ui-helpers.js';

/**
 * Renders the Settings panel: environment marker options.
 */
export async function renderSettingsPanel() {
  const settings = await getSettings();
  const generalContainer = el('general-settings-container');
  generalContainer.innerHTML = '';
  generalContainer.appendChild(_buildMarkerSettings(settings));
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
 * Builds the "Environment Marker" settings section.
 * @param {object} settings
 * @returns {HTMLElement}
 */
function _buildMarkerSettings(settings) {
  const section = document.createElement('div');
  section.className = 'general-settings-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('markerSection');
  section.appendChild(title);

  // Toggle: Show color frame
  section.appendChild(_buildToggleRow(
    t('showFrame'),
    settings.showFrame !== false,
    async (checked) => {
      const current = await getSettings();
      await saveSettings({ ...current, showFrame: checked });
    }
  ));

  // Toggle: Show environment label
  const posWrapper = _buildPositionWrapper(settings);
  section.appendChild(_buildToggleRow(
    t('showLabel'),
    settings.showLabel !== false,
    async (checked) => {
      const current = await getSettings();
      await saveSettings({ ...current, showLabel: checked });
      posWrapper.classList.toggle('marker-position-wrapper--hidden', !checked);
    }
  ));

  // Position selector (hidden when label is off)
  section.appendChild(posWrapper);

  return section;
}

/**
 * Builds a toggle row (label + toggle switch).
 * @param {string} label
 * @param {boolean} checked
 * @param {Function} onChange
 * @returns {HTMLElement}
 */
function _buildToggleRow(label, checked, onChange) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  const track = document.createElement('span');
  track.className = 'toggle-track';
  const wrapper = document.createElement('label');
  wrapper.className = 'toggle';
  wrapper.append(input, track);
  const labelEl = document.createElement('span');
  labelEl.className = 'toggle-label';
  labelEl.textContent = label;
  const row = document.createElement('div');
  row.className = 'toggle-row';
  row.append(labelEl, wrapper);
  input.addEventListener('change', () => onChange(input.checked));
  return row;
}

/**
 * Builds the label options wrapper (2 columns: position + size).
 * Shown only when the label toggle is enabled.
 * @param {object} settings
 * @returns {HTMLElement}
 */
function _buildPositionWrapper(settings) {
  const posWrapper = document.createElement('div');
  posWrapper.className = 'marker-position-wrapper' +
    (settings.showLabel === false ? ' marker-position-wrapper--hidden' : '');

  const cols = document.createElement('div');
  cols.className = 'marker-label-cols';

  // ── Left column: position diagram ─────────────────────────────────────────
  const posCol = document.createElement('div');

  const posLabel = document.createElement('div');
  posLabel.className = 'field-label';
  posLabel.textContent = t('badgePositionLabel');
  posCol.appendChild(posLabel);

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
    btn.className = 'position-btn' + (settings.labelPosition === id ? ' active' : '');
    btn.dataset.pos = id;
    btn.title = label;
    btn.textContent = label;
    btn.addEventListener('click', async () => {
      diagram.querySelectorAll('.position-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const current = await getSettings();
      await saveSettings({ ...current, labelPosition: id });
    });
    diagram.appendChild(btn);
  });

  posCol.appendChild(diagram);
  cols.appendChild(posCol);

  // ── Right column: font size picker ────────────────────────────────────────
  const sizeCol = document.createElement('div');

  const sizeLabel = document.createElement('div');
  sizeLabel.className = 'field-label';
  sizeLabel.textContent = t('labelSizeLabel');
  sizeCol.appendChild(sizeLabel);

  const SIZES = [
    { id: 's',  label: 'S',  px: 11 },
    { id: 'm',  label: 'M',  px: 13 },
    { id: 'l',  label: 'L',  px: 15 },
    { id: 'xl', label: 'XL', px: 18 },
  ];

  const sizeRow = document.createElement('div');
  sizeRow.className = 'label-size-row';

  SIZES.forEach(({ id, label, px }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size-btn' + ((settings.labelSize || 'm') === id ? ' active' : '');
    btn.dataset.size = id;
    btn.title = `${px}px`;
    btn.textContent = label;
    btn.addEventListener('click', async () => {
      sizeRow.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const current = await getSettings();
      await saveSettings({ ...current, labelSize: id });
    });
    sizeRow.appendChild(btn);
  });

  sizeCol.appendChild(sizeRow);
  cols.appendChild(sizeCol);

  posWrapper.appendChild(cols);
  return posWrapper;
}
