// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { t } from '../i18n.js';
import { el, openTab } from '../helpers/ui-helpers.js';
import { buildMultisiteUrl } from '../projects/wordpress.js';

/**
 * Slides to the site selector drill-down view.
 * @param {object} env
 * @param {object} link
 * @param {object} group
 */
export function showSiteSelector(env, link, group) {
  const msType = group.wpMultisiteType || 'subdomain';
  const proto = env.protocol || 'https';

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
      const url = buildMultisiteUrl(env.domain, site.prefix || '', msType, link.path, proto);
      openTab(url);
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
      const url = buildMultisiteUrl(env.domain, site.prefix || '', msType, link.path, proto);
      openTab(url);
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
    openTab(`${proto}://${env.domain}${link.path}`);
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
 * Slides back to the main Jumper view.
 */
export function hideSiteSelector() {
  const mainView = document.querySelector('.jumper-view--main');
  const sitesView = document.querySelector('.jumper-view--sites');
  if (mainView) mainView.classList.remove('sliding-out');
  if (sitesView) { sitesView.classList.remove('slide-in'); sitesView.setAttribute('aria-hidden', 'true'); }
}
