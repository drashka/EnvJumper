// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from './i18n.js';
import { generateId } from './storage.js';

/**
 * SVG icon set used throughout the popup for WordPress-related links
 * and UI elements.
 */
export const WP_ICONS = {
  login: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="7" r="3"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 10l3-3-3-3m3 3H8"/>
  </svg>`,
  dashboard: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/>
  </svg>`,
  posts: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h12M4 8h8M4 12h10M4 16h6"/><path d="M15 12l2 2 3-3" stroke-width="1.7"/>
  </svg>`,
  pages: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2h8l4 4v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h3z"/><path d="M14 2v4h4M8 12h4M8 9h4"/>
  </svg>`,
  media: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="5" width="16" height="12" rx="2"/><circle cx="7" cy="10" r="1.5"/><path d="M2 15l4-4 3 3 3-3 6 6"/>
  </svg>`,
  plugins: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 2v4H3v10h14V6h-4V2"/><path d="M8 2h4"/><path d="M10 10v4M8 12h4"/>
  </svg>`,
  appearance: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 3a7 7 0 100 14A7 7 0 0010 3z"/><path d="M10 3c2 2 3 4.5 3 7s-1 5-3 7M10 3C8 5 7 7.5 7 10s1 5 3 7M3 10h14"/>
  </svg>`,
  settings: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="10" r="3"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.05 3.05l1.41 1.41M15.54 15.54l1.41 1.41M3.05 16.95l1.41-1.41M15.54 4.46l1.41-1.41"/>
  </svg>`,
  permalinks: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 11a4 4 0 005.66 0l2-2a4 4 0 00-5.66-5.66l-1 1M12 9a4 4 0 00-5.66 0l-2 2a4 4 0 005.66 5.66l1-1"/>
  </svg>`,
  custom: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a3 3 0 100-6 3 3 0 000 6z"/><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0z"/>
  </svg>`,
  newtab: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/>
  </svg>`,
  wordpress: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/>
    <path d="M3.75 10c0 2.55 1.48 4.76 3.63 5.83L4.4 7.27A6.24 6.24 0 003.75 10z" fill="currentColor"/>
    <path d="M14.87 9.57c0-.8-.29-1.35-.53-1.78-.33-.53-.63-1-.63-1.52 0-.6.45-1.15 1.09-1.15l.08.01A6.25 6.25 0 0010 3.75a6.25 6.25 0 00-5.28 2.9l.38.01c.62 0 1.58-.07 1.58-.07.32-.02.36.45.04.48 0 0-.32.04-.68.06l2.16 6.44 1.3-3.89-.92-2.55c-.32-.02-.62-.06-.62-.06-.32-.02-.28-.5.04-.48 0 0 .98.07 1.56.07.62 0 1.58-.07 1.58-.07.32-.02.36.45.04.48 0 0-.32.04-.68.06l2.14 6.37.59-1.97c.26-.82.46-1.41.46-1.92z" fill="currentColor"/>
    <path d="M10.07 10.64l-1.78 5.17a6.26 6.26 0 003.65-.1 1 1 0 01-.07-.14l-1.8-5.03z" fill="currentColor"/>
    <path d="M15.5 7.13a6.25 6.25 0 01-4.68 8.68l2.13-6.16c.4-.99.53-1.79.53-2.49 0-.03 0-.03-.02-.03h.04z" fill="currentColor"/>
  </svg>`,
};

/**
 * Returns the 8 predefined WordPress quick links for a group.
 * @param {string} [loginPath='/wp-login.php'] - Custom login path
 * @returns {Array}
 */
export function getDefaultWpLinks(loginPath = '/wp-login.php') {
  return [
    { id: `wp-login-${generateId()}`,    label: t('wpLinkLogin'),      path: loginPath,                           type: 'wordpress', iconKey: 'login',      order: 0 },
    { id: `wp-dash-${generateId()}`,     label: t('wpLinkDashboard'),  path: '/wp-admin/',                        type: 'wordpress', iconKey: 'dashboard',  order: 1 },
    { id: `wp-posts-${generateId()}`,    label: t('wpLinkPosts'),      path: '/wp-admin/edit.php',                type: 'wordpress', iconKey: 'posts',      order: 2 },
    { id: `wp-pages-${generateId()}`,    label: t('wpLinkPages'),      path: '/wp-admin/edit.php?post_type=page', type: 'wordpress', iconKey: 'pages',      order: 3 },
    { id: `wp-media-${generateId()}`,    label: t('wpLinkMedia'),      path: '/wp-admin/upload.php',              type: 'wordpress', iconKey: 'media',      order: 4 },
    { id: `wp-plugins-${generateId()}`,  label: t('wpLinkPlugins'),    path: '/wp-admin/plugins.php',             type: 'wordpress', iconKey: 'plugins',    order: 5 },
    { id: `wp-themes-${generateId()}`,   label: t('wpLinkAppearance'), path: '/wp-admin/themes.php',              type: 'wordpress', iconKey: 'appearance', order: 6 },
    { id: `wp-settings-${generateId()}`,   label: t('wpLinkSettings'),   path: '/wp-admin/options-general.php',      type: 'wordpress', iconKey: 'settings',   order: 7 },
    { id: `wp-permalinks-${generateId()}`, label: t('wpLinkPermalinks'), path: '/wp-admin/options-permalink.php',    type: 'wordpress', iconKey: 'permalinks', order: 8 },
  ];
}

/**
 * Queries the content script to determine whether the user is logged
 * in to WordPress on the given tab.
 * @param {number} tabId
 * @returns {Promise<boolean|null>} true / false, or null if unknown
 */
export async function getWpLoginStatus(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_WP_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve(null); // unknown
      } else {
        resolve(!!response.isLoggedIn);
      }
    });
  });
}
