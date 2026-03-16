// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, generateId, COLOR_PALETTE } from '../helpers/storage.js';
import { t } from '../i18n.js';
import { el, confirm } from '../helpers/ui-helpers.js';

/** Builds the "Environnements" sub-tab content. */
export function buildEnvsSubtab(container, group, { onClose, onRefresh }) {
  const envList = document.createElement('div');
  envList.className = 'env-manage-list';
  envList.dataset.groupId = group.id;

  group.environments.forEach((env) => {
    envList.appendChild(buildEnvItem(group.id, env, group));
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

  const btnDeleteProject = document.createElement('button');
  btnDeleteProject.className = 'btn btn-sm btn-danger btn-full';
  btnDeleteProject.style.marginTop = '20px';
  btnDeleteProject.textContent = t('deleteProject');
  btnDeleteProject.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteGroup', group.name));
    if (ok) {
      const groups = await getGroups();
      await saveGroups(groups.filter((g) => g.id !== group.id));
      onClose();
      await onRefresh();
    }
  });
  container.appendChild(btnDeleteProject);
}

/** Builds an environment item in the edit view. */
export function buildEnvItem(groupId, env, editingGroup) {
  const item = document.createElement('div');
  item.className = 'env-manage-item';
  item.dataset.envId = env.id;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'input-sm';
  nameInput.placeholder = t('envNamePlaceholder');
  nameInput.value = env.name || '';
  nameInput.addEventListener('change', () => saveEnvField(groupId, env.id, 'name', nameInput.value));
  item.appendChild(nameInput);

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
    saveEnvField(groupId, env.id, 'domain', raw);
  });

  row2.appendChild(protocolSelect);
  row2.appendChild(domainInput);
  item.appendChild(row2);

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
      await saveEnvField(groupId, env.id, 'color', hex);
    });
    colorPicker.appendChild(swatch);
  });
  colorRow.appendChild(colorPicker);
  item.appendChild(colorRow);

  // Basic Auth section
  item.appendChild(_buildBasicAuthSection(groupId, env));

  // Delete environment button
  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'btn btn-sm btn-danger-outline btn-full';
  btnDelete.style.marginTop = '10px';
  btnDelete.textContent = t('deleteEnvironment');
  btnDelete.addEventListener('click', async () => {
    const ok = await confirm(t('confirmDeleteEnv', env.name || t('unnamed')));
    if (ok) {
      const groups = await getGroups();
      const g = groups.find((x) => x.id === groupId);
      if (g) {
        g.environments = g.environments.filter((e) => e.id !== env.id);
        await saveGroups(groups);
        item.remove();
        if (editingGroup && editingGroup.id === groupId) {
          editingGroup.environments = g.environments;
        }
      }
    }
  });
  item.appendChild(btnDelete);

  return item;
}

/** Builds the Basic Auth collapsible section for an env item. */
function _buildBasicAuthSection(groupId, env) {
  const baSection = document.createElement('div');
  baSection.className = 'basic-auth-section';

  const baToggleRow = document.createElement('div');
  baToggleRow.className = 'toggle-row basic-auth-toggle-row';

  const baToggleLabel = document.createElement('span');
  baToggleLabel.className = 'toggle-label';
  baToggleLabel.textContent = t('basicAuth');

  const baToggleWrapper = document.createElement('label');
  baToggleWrapper.className = 'toggle';
  const baToggleInput = document.createElement('input');
  baToggleInput.type = 'checkbox';
  baToggleInput.checked = !!(env.basicAuth && env.basicAuth.enabled);
  const baToggleTrack = document.createElement('span');
  baToggleTrack.className = 'toggle-track';
  baToggleWrapper.appendChild(baToggleInput);
  baToggleWrapper.appendChild(baToggleTrack);

  baToggleRow.appendChild(baToggleLabel);
  baToggleRow.appendChild(baToggleWrapper);
  baSection.appendChild(baToggleRow);

  const baFields = document.createElement('div');
  baFields.className = 'basic-auth-fields';
  baFields.style.display = baToggleInput.checked ? 'block' : 'none';

  const baUserRow = document.createElement('div');
  baUserRow.className = 'field-row';
  const baUserLabel = document.createElement('label');
  baUserLabel.className = 'field-label';
  baUserLabel.textContent = t('basicAuthUsername');
  const baUserInput = document.createElement('input');
  baUserInput.type = 'text';
  baUserInput.className = 'input-sm';
  baUserInput.placeholder = t('basicAuthUsername');
  baUserInput.value = (env.basicAuth && env.basicAuth.username) || '';
  baUserInput.autocomplete = 'off';
  baUserRow.appendChild(baUserLabel);
  baUserRow.appendChild(baUserInput);
  baFields.appendChild(baUserRow);

  const baPassRow = document.createElement('div');
  baPassRow.className = 'field-row';
  const baPassLabel = document.createElement('label');
  baPassLabel.className = 'field-label';
  baPassLabel.textContent = t('basicAuthPassword');
  const baPassWrapper = document.createElement('div');
  baPassWrapper.className = 'basic-auth-pass-wrapper';
  const baPassInput = document.createElement('input');
  baPassInput.type = 'password';
  baPassInput.className = 'input-sm';
  baPassInput.placeholder = t('basicAuthPassword');
  baPassInput.value = (env.basicAuth && env.basicAuth.password) || '';
  baPassInput.autocomplete = 'new-password';
  const baEyeBtn = document.createElement('button');
  baEyeBtn.type = 'button';
  baEyeBtn.className = 'btn-eye';
  baEyeBtn.title = t('basicAuthShow');
  baEyeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  baEyeBtn.addEventListener('click', () => {
    const isHidden = baPassInput.type === 'password';
    baPassInput.type = isHidden ? 'text' : 'password';
    baEyeBtn.title = isHidden ? t('basicAuthHide') : t('basicAuthShow');
  });
  baPassWrapper.appendChild(baPassInput);
  baPassWrapper.appendChild(baEyeBtn);
  baPassRow.appendChild(baPassLabel);
  baPassRow.appendChild(baPassWrapper);
  baFields.appendChild(baPassRow);

  const baSyncNotice = document.createElement('p');
  baSyncNotice.className = 'basic-auth-notice';
  baSyncNotice.textContent = t('basicAuthSyncNotice');
  baFields.appendChild(baSyncNotice);

  const baRemoveBtn = document.createElement('button');
  baRemoveBtn.type = 'button';
  baRemoveBtn.className = 'btn btn-sm btn-danger-outline';
  baRemoveBtn.textContent = t('basicAuthRemove');
  baRemoveBtn.addEventListener('click', async () => {
    baUserInput.value = '';
    baPassInput.value = '';
    await saveEnvField(groupId, env.id, 'basicAuth', null);
    baToggleInput.checked = false;
    baFields.style.display = 'none';
  });
  baFields.appendChild(baRemoveBtn);
  baSection.appendChild(baFields);

  async function saveBasicAuth() {
    await saveEnvField(groupId, env.id, 'basicAuth', {
      enabled: baToggleInput.checked,
      username: baUserInput.value.trim(),
      password: baPassInput.value,
    });
  }

  baToggleInput.addEventListener('change', async () => {
    baFields.style.display = baToggleInput.checked ? 'block' : 'none';
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
