// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from '../i18n.js';
import { ICONS } from '../icons.js';
import { showSiteSelector } from './jumper-multisite.js';

/**
 * Builds the card body (quick links) for a Jumper card.
 * @param {object} env
 * @param {object} group
 * @param {boolean|null} wpIsLoggedIn
 * @returns {HTMLElement} The card body element
 */
export function buildJumperCardBody(env, group, wpIsLoggedIn) {
  const body = document.createElement('div');
  body.className = 'jumper-card-body';

  const inner = document.createElement('div');
  inner.className = 'jumper-card-body-inner';

  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  if (links.length > 0) {
    const showWpNotice = group.cms === 'wordpress' && wpIsLoggedIn === false;
    if (showWpNotice) {
      const notice = document.createElement('div');
      notice.className = 'wp-status-notice';
      notice.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="14" height="14"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01"/></svg> ${t('wpNotLoggedIn')}`;
      inner.appendChild(notice);
    }

    links.forEach((link) => {
      const isCmsLink = link.type === 'cms' || link.type === 'wordpress';
      const isNetworkLink = link.type === 'network';
      const isLoginLink = link.icon === 'log-in';
      const isAdminLink = (isCmsLink || isNetworkLink) && !isLoginLink;
      const isDisabled = showWpNotice && isAdminLink;

      const isSubdir = group.isWordPressMultisite && group.wpMultisiteType === 'subdirectory';
      const defaultPrefix = isCmsLink;
      const hasPrefix = !isNetworkLink && isSubdir && (link.multisitePrefix !== undefined ? link.multisitePrefix : defaultPrefix);

      const row = document.createElement('button');
      row.className = 'link-quick-row' + (isDisabled ? ' disabled' : '') + (hasPrefix ? ' has-prefix' : '');
      row.type = 'button';

      const iconSvg = ICONS[link.icon] || ICONS['link'];
      const iconDiv = document.createElement('span');
      iconDiv.className = 'link-icon';
      iconDiv.innerHTML = iconSvg;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'link-label';
      labelSpan.textContent = link.label || link.path;


      row.appendChild(iconDiv);
      row.appendChild(labelSpan);

      if (hasPrefix) {
        const globeDiv = document.createElement('span');
        globeDiv.className = 'link-globe-icon';
        globeDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
        row.appendChild(globeDiv);
      } else {
        const newtabDiv = document.createElement('span');
        newtabDiv.className = 'link-newtab-icon';
        newtabDiv.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
        row.appendChild(newtabDiv);
      }

      if (!isDisabled) {
        if (hasPrefix && group.wpSites && group.wpSites.length > 0) {
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            showSiteSelector(env, link, group);
          });
        } else {
          row.addEventListener('click', () => {
            const proto = env.protocol || 'https';
            chrome.tabs.create({ url: `${proto}://${env.domain}${link.path}` });
          });
        }
      }

      inner.appendChild(row);
    });
  } else {
    const noLinks = document.createElement('p');
    noLinks.style.cssText = 'font-size:12px;color:var(--color-text-muted);padding:4px 0;';
    noLinks.textContent = t('noLinksConfigured');
    inner.appendChild(noLinks);
  }

  body.appendChild(inner);
  return body;
}
