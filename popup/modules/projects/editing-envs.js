// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, generateId, COLOR_PALETTE } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { confirm } from '../helpers/ui-helpers.js';

/** Builds the "Environnements" sub-tab content. */
export function buildEnvsSubtab(container, group, { onClose, onRefresh }) {
  const envList = document.createElement('div');
  envList.className = 'env-manage-list';
  envList.dataset.groupId = group.id;

  group.environments.forEach((env, i) => {
    const expandFirst = i === 0 && !env.name && !env.domain;
    envList.appendChild(buildEnvItem(group.id, env, group, { expanded: expandFirst }));
  });
  container.appendChild(envList);

  const btnAddEnv = document.createElement('button');
  btnAddEnv.className = 'btn btn-sm btn-outline btn-full';
  btnAddEnv.style.marginTop = '8px';
  btnAddEnv.textContent = t('addEnv');
  btnAddEnv.addEventListener('click', async () => {
    const newEnv = { id: generateId(), name: '', domain: '', color: COLOR_PALETTE[0].hex };
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (g) {
      g.environments.push(newEnv);
      await saveGroups(groups);
      group.environments = g.environments;
      envList.appendChild(buildEnvItem(group.id, newEnv, group));
    }
  });
  container.appendChild(btnAddEnv);
}

/** Builds the "Paramètres" sub-tab content (delete project). */
export function buildProjectSettingsSubtab(container, group, { onClose, onRefresh }) {
  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn btn-sm btn-danger btn-full';
  btnDelete.style.marginTop = '20px';
  btnDelete.textContent = t('deleteProject');
  btnDelete.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteGroup', group.name));
    if (ok) {
      const groups = await getGroups();
      await saveGroups(groups.filter((g) => g.id !== group.id));
      onClose();
      await onRefresh();
    }
  });
  container.appendChild(btnDelete);
}

/** Builds a collapsible environment card. */
export function buildEnvItem(groupId, env, editingGroup, { expanded = false } = {}) {
  const card = document.createElement('div');
  card.className = 'env-card';
  card.dataset.envId = env.id;

  // ── Header ────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'env-card-header';
  header.style.borderLeftColor = env.color || 'var(--color-border)';
  if (env.color) header.style.backgroundColor = env.color + '12';

  const headerInfo = document.createElement('div');
  headerInfo.className = 'env-card-header-info';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'env-card-name';
  nameSpan.textContent = env.name || t('unnamed');

  const domainSpan = document.createElement('span');
  domainSpan.className = 'env-card-domain';
  domainSpan.textContent = env.domain || '';

  headerInfo.append(nameSpan, domainSpan);

  const headerActions = document.createElement('div');
  headerActions.className = 'env-card-header-actions';

  const trashBtn = document.createElement('button');
  trashBtn.type = 'button';
  trashBtn.className = 'btn-icon-trash';
  trashBtn.title = t('deleteEnvironment');
  trashBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
  trashBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const ok = await confirm(t('confirmDeleteEnv', env.name || t('unnamed')));
    if (ok) {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        g.environments = g.environments.filter((ev) => ev.id !== env.id);
        await saveGroups(groups);
        card.remove();
        if (editingGroup && editingGroup.id === groupId) editingGroup.environments = g.environments;
      }
    }
  });

  const chevron = document.createElement('span');
  chevron.className = 'env-chevron';
  chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>`;

  headerActions.append(trashBtn, chevron);
  header.append(headerInfo, headerActions);
  card.appendChild(header);

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'env-card-body';
  body.style.display = expanded ? 'flex' : 'none';
  if (expanded) card.classList.add('env-card--open');

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input-sm';
  nameInput.placeholder = t('envNamePlaceholder');
  nameInput.value = env.name || '';
  nameInput.addEventListener('change', () => {
    saveEnvField(groupId, env.id, 'name', nameInput.value);
    nameSpan.textContent = nameInput.value || t('unnamed');
  });
  body.appendChild(nameInput);

  // Row: Protocol + Domain
  const row2 = document.createElement('div');
  row2.className = 'env-manage-row env-domain-row';

  const protocolSelect = document.createElement('select');
  protocolSelect.className = 'input-sm select-sm env-protocol-select';
  protocolSelect.title = t('envProtocolLabel');
  ['https', 'http'].forEach((proto) => {
    const opt = document.createElement('option');
    opt.value = proto;
    opt.textContent = proto.toUpperCase();
    protocolSelect.appendChild(opt);
  });
  protocolSelect.value = env.protocol || 'https';
  protocolSelect.addEventListener('change', () => saveEnvField(groupId, env.id, 'protocol', protocolSelect.value));

  const domainInput = document.createElement('input');
  domainInput.type = 'text';
  domainInput.className = 'input-sm';
  domainInput.placeholder = t('envDomainPlaceholder');
  domainInput.value = env.domain || '';
  domainInput.addEventListener('change', () => {
    let raw = domainInput.value.trim();
    try {
      if (raw.includes('://')) {
        const parsed = new URL(raw);
        const detectedProto = parsed.protocol.replace(':', '');
        if (detectedProto === 'http' || detectedProto === 'https') {
          protocolSelect.value = detectedProto;
          saveEnvField(groupId, env.id, 'protocol', detectedProto);
        }
        raw = parsed.host;
      } else {
        raw = raw.split('/')[0].split('?')[0];
      }
    } catch {}
    domainInput.value = raw;
    domainSpan.textContent = raw;
    saveEnvField(groupId, env.id, 'domain', raw);
  });

  row2.appendChild(protocolSelect);
  row2.appendChild(domainInput);
  body.appendChild(row2);

  // Color picker
  const colorRow = document.createElement('div');
  colorRow.className = 'field-row';
  const colorLabel = document.createElement('label');
  colorLabel.className = 'field-label';
  colorLabel.textContent = t('colorLabel');
  colorRow.appendChild(colorLabel);

  const colorPicker = document.createElement('div');
  colorPicker.className = 'color-picker';
  COLOR_PALETTE.forEach(({ name, hex }) => {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch' + (env.color === hex ? ' selected' : '');
    swatch.style.backgroundColor = hex;
    swatch.title = name;
    swatch.type = 'button';
    swatch.addEventListener('click', async () => {
      colorPicker.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      header.style.borderLeftColor = hex;
      header.style.backgroundColor = hex + '12';
      await saveEnvField(groupId, env.id, 'color', hex);
    });
    colorPicker.appendChild(swatch);
  });
  colorRow.appendChild(colorPicker);
  body.appendChild(colorRow);

  body.appendChild(_buildBasicAuthSection(groupId, env));
  card.appendChild(body);

  header.addEventListener('click', () => {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'flex';
    card.classList.toggle('env-card--open', !isOpen);
  });

  return card;
}

function _buildBasicAuthSection(groupId, env) {
  const ba = env.basicAuth || {};
  const baSection = document.createElement('div');
  baSection.className = 'basic-auth-section';

  // Toggle row
  const baToggleInput = document.createElement('input');
  baToggleInput.type = 'checkbox';
  baToggleInput.checked = !!ba.enabled;
  const baToggleTrack = document.createElement('span');
  baToggleTrack.className = 'toggle-track';
  const baToggleWrapper = document.createElement('label');
  baToggleWrapper.className = 'toggle';
  baToggleWrapper.append(baToggleInput, baToggleTrack);
  const baToggleLabel = document.createElement('span');
  baToggleLabel.className = 'toggle-label';
  baToggleLabel.textContent = t('basicAuth');
  const baToggleRow = document.createElement('div');
  baToggleRow.className = 'toggle-row basic-auth-toggle-row';
  baToggleRow.append(baToggleLabel, baToggleWrapper);
  baSection.appendChild(baToggleRow);

  // Fields (2-col grid)
  const baFields = document.createElement('div');
  baFields.className = 'basic-auth-fields';
  baFields.style.display = ba.enabled ? 'flex' : 'none';
  const authCols = document.createElement('div');
  authCols.className = 'env-auth-cols';

  const baUserInput = document.createElement('input');
  Object.assign(baUserInput, { type: 'text', className: 'input-sm', placeholder: t('basicAuthUsername'), value: ba.username || '', autocomplete: 'off' });
  const baUserLabel = document.createElement('label');
  baUserLabel.className = 'field-label';
  baUserLabel.textContent = t('basicAuthUsername');
  const baUserCol = document.createElement('div');
  baUserCol.append(baUserLabel, baUserInput);

  const baPassInput = document.createElement('input');
  Object.assign(baPassInput, { type: 'password', className: 'input-sm', placeholder: t('basicAuthPassword'), value: ba.password || '', autocomplete: 'new-password' });
  const baEyeBtn = document.createElement('button');
  Object.assign(baEyeBtn, { type: 'button', className: 'btn-eye', title: t('basicAuthShow') });
  baEyeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  baEyeBtn.addEventListener('click', () => {
    const hidden = baPassInput.type === 'password';
    baPassInput.type = hidden ? 'text' : 'password';
    baEyeBtn.title = hidden ? t('basicAuthHide') : t('basicAuthShow');
  });
  const baPassWrapper = document.createElement('div');
  baPassWrapper.className = 'basic-auth-pass-wrapper';
  baPassWrapper.append(baPassInput, baEyeBtn);
  const baPassLabel = document.createElement('label');
  baPassLabel.className = 'field-label';
  baPassLabel.textContent = t('basicAuthPassword');
  const baPassCol = document.createElement('div');
  baPassCol.append(baPassLabel, baPassWrapper);

  authCols.append(baUserCol, baPassCol);
  baFields.appendChild(authCols);
  const baSyncNotice = document.createElement('p');
  baSyncNotice.className = 'basic-auth-notice';
  baSyncNotice.textContent = t('basicAuthSyncNotice');
  baFields.appendChild(baSyncNotice);
  baSection.appendChild(baFields);

  const saveBasicAuth = () => saveEnvField(groupId, env.id, 'basicAuth', {
    enabled: baToggleInput.checked, username: baUserInput.value.trim(), password: baPassInput.value,
  });
  baToggleInput.addEventListener('change', async () => {
    baFields.style.display = baToggleInput.checked ? 'flex' : 'none';
    await saveBasicAuth();
  });
  baUserInput.addEventListener('change', saveBasicAuth);
  baPassInput.addEventListener('change', saveBasicAuth);
  return baSection;
}

/** Saves the value of a single field on an environment. */
export async function saveEnvField(groupId, envId, field, value) {
  const groups = await getGroups();
  const g = groups.find((x) => x.id === groupId);
  if (!g) return;
  const e = g.environments.find((x) => x.id === envId);
  if (!e) return;
  e[field] = value;
  await saveGroups(groups);
}
