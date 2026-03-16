// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups } from './storage.js';
import { t } from './i18n.js';
import { el, show, hide, buildTargetUrl } from './ui-helpers.js';
import { getWpLoginStatus, buildMultisiteUrl } from './wordpress.js';
import { ICONS } from './icons.js';

// ── Drill-down navigation (site selector) ───────────────────────────────────

/**
 * Slides to the site selector view.
 */
function showSiteSelector(env, link, group) {
  const subtitle = el('jumper-site-subtitle');
  if (subtitle) subtitle.textContent = link.label || link.path;

  const sitesList = el('jumper-sites-list');
  if (!sitesList) return;
  sitesList.innerHTML = '';

  // One button per configured site
  (group.wpSites || []).forEach((site) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jumper-site-btn';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = site.label || site.prefix || '—';
    btn.appendChild(labelSpan);

    if (site.prefix) {
      const prefixSpan = document.createElement('span');
      prefixSpan.className = 'jumper-site-prefix';
      prefixSpan.textContent = `(${site.prefix})`;
      btn.appendChild(prefixSpan);
    }

    btn.addEventListener('click', () => {
      const url = buildMultisiteUrl(env.domain, site.prefix || '', 'subdirectory', link.path);
      chrome.tabs.create({ url });
      hideSiteSelector();
    });
    sitesList.appendChild(btn);
  });

  // Separator
  const sep = document.createElement('div');
  sep.className = 'jumper-site-sep';
  sitesList.appendChild(sep);

  // "All sites" button
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'jumper-site-btn jumper-site-btn--outline';
  allBtn.textContent = t('allSites');
  allBtn.addEventListener('click', () => {
    (group.wpSites || []).forEach((site) => {
      const url = buildMultisiteUrl(env.domain, site.prefix || '', 'subdirectory', link.path);
      chrome.tabs.create({ url });
    });
    hideSiteSelector();
  });
  sitesList.appendChild(allBtn);

  // "Without prefix" button
  const noBtn = document.createElement('button');
  noBtn.type = 'button';
  noBtn.className = 'jumper-site-btn jumper-site-btn--outline';
  noBtn.textContent = t('withoutPrefix');
  noBtn.addEventListener('click', () => {
    const proto = env.protocol || 'https';
    chrome.tabs.create({ url: `${proto}://${env.domain}${link.path}` });
    hideSiteSelector();
  });
  sitesList.appendChild(noBtn);

  // Slide to sites view
  const mainView = document.querySelector('.jumper-view--main');
  const sitesView = document.querySelector('.jumper-view--sites');
  if (mainView) mainView.classList.add('sliding-out');
  if (sitesView) { sitesView.classList.add('slide-in'); sitesView.removeAttribute('aria-hidden'); }
}

/**
 * Slides back to the main view.
 */
function hideSiteSelector() {
  const mainView = document.querySelector('.jumper-view--main');
  const sitesView = document.querySelector('.jumper-view--sites');
  if (mainView) mainView.classList.remove('sliding-out');
  if (sitesView) { sitesView.classList.remove('slide-in'); sitesView.setAttribute('aria-hidden', 'true'); }
}

/**
 * Initializes the Jumper panel's drill-down back button.
 * Must be called once at popup startup.
 */
export function initJumper() {
  const backBtn = el('jumper-back-btn');
  if (backBtn) backBtn.addEventListener('click', hideSiteSelector);
}

/**
 * Finds the group and environment matching the given hostname.
 * Checks environment domains, WP Multisite prefix-based subdomains, and legacy domain-based sites.
 * @param {Array} groups
 * @param {string} hostname
 * @returns {{ group: object, env: object }|null}
 */
export function findMatch(groups, hostname) {
  for (const group of groups) {
    // Direct env domain match
    for (const env of group.environments) {
      if (env.domain === hostname) return { group, env };
    }
    // WP Multisite subdomain: check prefix.envDomain for each site and env
    if (group.isWordPressMultisite && group.wpMultisiteType === 'subdomain' && group.wpSites) {
      for (const env of group.environments) {
        for (const site of group.wpSites) {
          if (!site.prefix) continue; // empty prefix = main site = env.domain (already matched above)
          const multisiteHost = `${site.prefix}.${env.domain}`;
          if (multisiteHost === hostname) return { group, env };
        }
      }
    }
    // Subdirectory: hostname is env.domain (already matched above)
    // Legacy: wpSites with domain field
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain && site.domain === hostname) {
          return { group, env: group.environments[0] || null };
        }
      }
    }
  }
  return null;
}

/**
 * Renders the Jumper panel for the currently active browser tab.
 * Shows a match card or a "no match" state.
 */
export async function renderJumperPanel() {
  hide('jumper-match');
  hide('jumper-no-match');
  show('jumper-loading');

  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  let hostname;
  try {
    // Use .host to include port for non-standard ports (e.g. localhost:3000)
    hostname = new URL(tab.url).host;
  } catch {
    hide('jumper-loading');
    show('jumper-no-match');
    return;
  }

  const groups = await getGroups();
  const match = findMatch(groups, hostname);

  hide('jumper-loading');

  if (!match) {
    el('detected-hostname').textContent = t('detectedHostname', hostname);
    show('jumper-no-match');
    return;
  }

  const { group, env: currentEnv } = match;

  // Display the group name
  el('jumper-group-name').textContent = group.name;

  // Fetch WP login status if the group is WordPress
  let wpIsLoggedIn = null;
  if (group.cms === 'wordpress') {
    wpIsLoggedIn = await getWpLoginStatus(tab.id);
  }

  // Build the cards — current env first, opened by default
  const cardsList = el('jumper-cards-list');
  cardsList.innerHTML = '';

  const sortedEnvs = currentEnv
    ? [currentEnv, ...group.environments.filter((e) => e.id !== currentEnv.id)]
    : group.environments;

  sortedEnvs.forEach((env) => {
    const isCurrent = currentEnv && env.id === currentEnv.id;
    const loggedIn = isCurrent ? wpIsLoggedIn : null;
    const card = buildJumperCard(env, isCurrent, tab.url, loggedIn, group);
    if (isCurrent) card.classList.add('open');
    cardsList.appendChild(card);
  });

  show('jumper-match');
}

/**
 * Builds an environment card in the Jumper panel.
 * @param {object} env - The environment
 * @param {boolean} isCurrent - Whether this is the active env
 * @param {string} currentUrl - URL of the active tab
 * @param {boolean|null} wpIsLoggedIn - WP login status (null = unknown)
 * @param {object} group - The group the environment belongs to
 * @returns {HTMLElement}
 */
function buildJumperCard(env, isCurrent, currentUrl, wpIsLoggedIn, group) {
  const card = document.createElement('div');
  card.className = 'jumper-card' + (isCurrent ? ' is-current' : '');
  card.style.setProperty('--env-color', env.color || '#6B7280');

  // ── Card header
  const header = document.createElement('div');
  header.className = 'jumper-card-header';

  // Color dot
  const dot = document.createElement('span');
  dot.className = 'color-dot';
  dot.style.backgroundColor = env.color || '#6B7280';

  // Environment name
  const nameSpan = document.createElement('span');
  nameSpan.className = 'jumper-card-name';
  nameSpan.textContent = env.name || t('unnamed');

  header.appendChild(dot);
  header.appendChild(nameSpan);

  // Lock icon if basicAuth is enabled
  if (env.basicAuth && env.basicAuth.enabled) {
    const lockIcon = document.createElement('span');
    lockIcon.className = 'env-basicauth-icon';
    lockIcon.title = 'Basic Auth';
    lockIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    header.appendChild(lockIcon);
  }

  if (isCurrent) {
    // "Current" badge to the right of the name
    const badge = document.createElement('span');
    badge.className = 'badge-current';
    badge.style.setProperty('--env-color', env.color || '#6B7280');
    badge.textContent = t('badgeCurrent');
    header.appendChild(badge);
  }

  {
    // Navigation buttons (same tab / new tab) — present on all envs
    const actions = document.createElement('div');
    actions.className = 'jumper-card-actions';

    const btnSameTab = document.createElement('button');
    btnSameTab.className = 'btn-icon';
    btnSameTab.title = t('navigateSameTab');
    btnSameTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M5 10h10M11 6l4 4-4 4"/></svg>`;
    btnSameTab.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = buildTargetUrl(currentUrl, env.domain, env.protocol || 'https');
      if (url) chrome.tabs.update(undefined, { url });
      window.close();
    });

    const btnNewTab = document.createElement('button');
    btnNewTab.className = 'btn-icon';
    btnNewTab.title = t('openNewTab');
    btnNewTab.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
    btnNewTab.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = buildTargetUrl(currentUrl, env.domain, env.protocol || 'https');
      if (url) chrome.tabs.create({ url });
    });

    actions.appendChild(btnSameTab);
    actions.appendChild(btnNewTab);
    header.appendChild(actions);
  }

  // Chevron for accordion
  const chevron = document.createElement('span');
  chevron.className = 'jumper-card-chevron';
  chevron.textContent = '▶';
  header.appendChild(chevron);

  // ── Card body (group quick links)
  const body = document.createElement('div');
  body.className = 'jumper-card-body';

  const inner = document.createElement('div');
  inner.className = 'jumper-card-body-inner';

  // Links come from the group, sorted by order
  const links = (group.links || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  if (links.length > 0) {
    // "Not logged in" notice if WordPress and not authenticated (only for the active env)
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
      const isLoginLink = (link.icon === 'log-in') || (link.iconKey === 'login');
      const isAdminLink = (isCmsLink || isNetworkLink) && !isLoginLink;
      const isDisabled = showWpNotice && isAdminLink;

      // Determine if this link should show a site-selector popover
      // (only for subdirectory multisite + non-network links with multisitePrefix)
      const isSubdir = group.isWordPressMultisite && group.wpMultisiteType === 'subdirectory';
      const defaultPrefix = isCmsLink; // cms links default to true, custom to false
      const hasPrefix = !isNetworkLink && isSubdir && (link.multisitePrefix !== undefined ? link.multisitePrefix : defaultPrefix);

      const row = document.createElement('button');
      row.className = 'link-quick-row' + (isDisabled ? ' disabled' : '') + (hasPrefix ? ' has-prefix' : '');
      row.type = 'button';

      // Icon
      const iconSvg = ICONS[link.icon] || ICONS[link.iconKey] || ICONS['link'];
      const iconDiv = document.createElement('span');
      iconDiv.className = 'link-icon';
      iconDiv.innerHTML = iconSvg;

      // Label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'link-label';
      labelSpan.textContent = link.label || link.path;

      // Custom badge (custom links)
      if (link.badge && link.type === 'custom') {
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'link-badge link-badge-custom';
        badgeSpan.textContent = link.badge;
        labelSpan.appendChild(badgeSpan);
      }

      // Network badge
      if (isNetworkLink) {
        const netBadge = document.createElement('span');
        netBadge.className = 'link-badge link-badge-network';
        netBadge.textContent = t('networkBadge');
        labelSpan.appendChild(netBadge);
      }

      row.appendChild(iconDiv);
      row.appendChild(labelSpan);

      if (hasPrefix) {
        // Globe icon indicator (multisite prefix)
        const globeDiv = document.createElement('span');
        globeDiv.className = 'link-globe-icon';
        globeDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
        row.appendChild(globeDiv);
      } else {
        // "New tab" icon (standard links)
        const newtabDiv = document.createElement('span');
        newtabDiv.className = 'link-newtab-icon';
        newtabDiv.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4"/></svg>`;
        row.appendChild(newtabDiv);
      }

      if (!isDisabled) {
        if (hasPrefix && group.wpSites && group.wpSites.length > 0) {
          // Drill-down navigation: slide to the site selector view
          row.addEventListener('click', (e) => {
            e.stopPropagation();
            showSiteSelector(env, link, group);
          });
        } else {
          // Standard click: open in new tab
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

  // Click on header to open/close (accordion)
  header.addEventListener('click', (e) => {
    if (e.target.closest('.btn-icon')) return;
    const isOpen = card.classList.contains('open');
    // Close all cards
    card.closest('#jumper-cards-list').querySelectorAll('.jumper-card').forEach((c) => {
      c.classList.remove('open');
    });
    // Open this one if it was closed, and scroll to it
    if (!isOpen) {
      card.classList.add('open');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}
