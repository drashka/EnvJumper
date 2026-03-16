// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Helpers d'accès à chrome.storage.sync pour EnvJump.
 * Toutes les fonctions retournent des Promises.
 */

/**
 * Récupère tous les groupes depuis le stockage.
 * @returns {Promise<Array>} Liste des groupes
 */
async function getGroups() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groups'], (result) => {
      resolve(result.groups || []);
    });
  });
}

/**
 * Sauvegarde la liste complète des groupes.
 * @param {Array} groups
 * @returns {Promise<void>}
 */
async function saveGroups(groups) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ groups }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Génère un UUID simple (v4 pseudo-aléatoire).
 * @returns {string}
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ajoute un nouveau groupe.
 * @param {object} group - Le groupe à ajouter (sans id)
 * @returns {Promise<object>} Le groupe créé avec son id
 */
async function addGroup(group) {
  const groups = await getGroups();
  const newGroup = { id: generateId(), environments: [], ...group };
  groups.push(newGroup);
  await saveGroups(groups);
  return newGroup;
}

/**
 * Met à jour un groupe existant.
 * @param {string} groupId
 * @param {object} updates
 * @returns {Promise<void>}
 */
async function updateGroup(groupId, updates) {
  const groups = await getGroups();
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx === -1) throw new Error(`Groupe introuvable : ${groupId}`);
  groups[idx] = { ...groups[idx], ...updates };
  await saveGroups(groups);
}

/**
 * Supprime un groupe.
 * @param {string} groupId
 * @returns {Promise<void>}
 */
async function deleteGroup(groupId) {
  const groups = await getGroups();
  await saveGroups(groups.filter((g) => g.id !== groupId));
}

/**
 * Ajoute un environnement à un groupe.
 * @param {string} groupId
 * @param {object} env - L'environnement à ajouter (sans id)
 * @returns {Promise<object>} L'environnement créé avec son id
 */
async function addEnvironment(groupId, env) {
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) throw new Error(`Groupe introuvable : ${groupId}`);
  const newEnv = { id: generateId(), ...env };
  group.environments.push(newEnv);
  await saveGroups(groups);
  return newEnv;
}

/**
 * Met à jour un environnement dans un groupe.
 * @param {string} groupId
 * @param {string} envId
 * @param {object} updates
 * @returns {Promise<void>}
 */
async function updateEnvironment(groupId, envId, updates) {
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) throw new Error(`Groupe introuvable : ${groupId}`);
  const envIdx = group.environments.findIndex((e) => e.id === envId);
  if (envIdx === -1) throw new Error(`Environnement introuvable : ${envId}`);
  group.environments[envIdx] = { ...group.environments[envIdx], ...updates };
  await saveGroups(groups);
}

/**
 * Supprime un environnement d'un groupe.
 * @param {string} groupId
 * @param {string} envId
 * @returns {Promise<void>}
 */
async function deleteEnvironment(groupId, envId) {
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) throw new Error(`Groupe introuvable : ${groupId}`);
  group.environments = group.environments.filter((e) => e.id !== envId);
  await saveGroups(groups);
}

/**
 * Trouve le groupe et l'environnement correspondant à un hostname.
 * @param {string} hostname
 * @returns {Promise<{group: object, env: object}|null>}
 */
async function findMatchForHostname(hostname) {
  const groups = await getGroups();
  for (const group of groups) {
    for (const env of group.environments) {
      if (env.domain === hostname) {
        return { group, env };
      }
    }
    // Pour WordPress Multisite, vérifier aussi les wpSites
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain === hostname) {
          // Retourner avec l'environnement correspondant ou null si aucun
          const matchedEnv = group.environments.find((e) => e.domain === hostname) || null;
          return { group, env: matchedEnv, isWpSiteOnly: !matchedEnv };
        }
      }
    }
  }
  return null;
}

// Palette de 6 couleurs disponibles
const COLOR_PALETTE = [
  { name: 'Rouge',  hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Vert',   hex: '#10B981' },
  { name: 'Bleu',   hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Gris',   hex: '#6B7280' },
];
