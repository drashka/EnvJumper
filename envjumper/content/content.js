// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Content script EnvJumper.
 * Injecte une bordure colorée + badge de nom d'environnement autour de la page.
 * La position du badge est paramétrable via chrome.storage.sync (settings.badgePosition).
 * Répond aux messages GET_WP_STATUS pour détecter la connexion WordPress.
 * Supporte le mode discret (stealthMode) qui masque la bordure et le badge.
 */

(function () {
  'use strict';

  const OVERLAY_ID = 'envjump-overlay';

  /**
   * Calcule la couleur de texte (noir ou blanc) offrant le meilleur contraste.
   * @param {string} hex - Couleur hex (#RRGGBB)
   * @returns {string} '#000000' ou '#ffffff'
   */
  function contrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Retourne les styles CSS de position et border-radius du badge
   * selon la position choisie.
   * @param {string} position - 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * @returns {string[]} Tableau de propriétés CSS
   */
  function getBadgePositionStyles(position) {
    const map = {
      'top-left':     ['top: 0', 'left: 0',  'border-radius: 0 0 6px 0'],
      'top-right':    ['top: 0', 'right: 0',  'border-radius: 0 0 0 6px'],
      'bottom-left':  ['bottom: 0', 'left: 0',  'border-radius: 0 6px 0 0'],
      'bottom-right': ['bottom: 0', 'right: 0',  'border-radius: 6px 0 0 0'],
    };
    return map[position] || map['top-left'];
  }

  /**
   * Applique ou retire la bordure colorée et le badge d'environnement.
   * @param {string|null} color - Couleur hex, ou null pour retirer.
   * @param {string|null} label - Nom de l'environnement, ou null.
   * @param {string} position - Position du badge.
   */
  function applyBorder(color, label, position = 'top-left') {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    if (!color) return;

    const textColor = contrastColor(color);

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      `border: 4px solid ${color}`,
      'pointer-events: none',
      'z-index: 2147483647',
      'box-sizing: border-box',
    ].join(';');

    // Badge avec position paramétrable
    if (label) {
      const tag = document.createElement('span');
      tag.textContent = label;
      const posStyles = getBadgePositionStyles(position);
      tag.style.cssText = [
        'position: absolute',
        ...posStyles,
        `background: ${color}`,
        `color: ${textColor}`,
        'font: 600 11px/1 system-ui, sans-serif',
        'padding: 3px 10px 4px 8px',
        'letter-spacing: 0.3px',
        'pointer-events: none',
        'user-select: none',
        'box-shadow: 0 2px 6px rgba(0,0,0,.2)',
      ].join(';');
      overlay.appendChild(tag);
    }

    const target = document.body || document.documentElement;
    target.appendChild(overlay);
  }

  /**
   * Vérifie le hostname actuel dans le stockage et applique la bordure.
   * Lit aussi settings.badgePosition pour positionner le badge.
   * Si le mode discret est actif (chrome.storage.local), retire la bordure.
   *
   * Note: chrome.storage.session is NOT accessible from content scripts —
   * stealth mode is stored in chrome.storage.local and cleared on browser startup.
   */
  function checkAndApplyBorder() {
    const host = window.location.host;

    chrome.storage.local.get(['stealthMode'], (localResult) => {
      if (localResult && localResult.stealthMode) {
        applyBorder(null, null);
        return;
      }

      chrome.storage.sync.get(['groups', 'settings'], (result) => {
        const groups = result.groups || [];
        const position = (result.settings && result.settings.badgePosition) || 'top-left';
        let matchColor = null;
        let matchLabel = null;

        outer: for (const group of groups) {
          for (const env of group.environments) {
            if (env.domain === host) {
              matchColor = env.color;
              matchLabel = env.name;
              break outer;
            }
          }
          // Current format: wpSites with prefix at group level
          if (group.isWordPressMultisite && group.wpSites) {
            const type = group.wpMultisiteType || 'subdomain';
            for (const env of group.environments) {
              for (const site of group.wpSites) {
                let siteHost;
                if (type === 'subdirectory') {
                  siteHost = env.domain;
                } else {
                  siteHost = site.prefix ? `${site.prefix}.${env.domain}` : env.domain;
                }
                if (siteHost === host) {
                  matchColor = env.color;
                  matchLabel = env.name;
                  break outer;
                }
              }
            }
          }
          // Legacy: wpSites with domain field at env level (old format)
          for (const env of group.environments) {
            if (env.isWordPressMultisite && env.wpSites) {
              for (const site of env.wpSites) {
                if (site.domain === host) {
                  matchColor = env.color;
                  matchLabel = env.name;
                  break outer;
                }
              }
            }
          }
        }

        applyBorder(matchColor, matchLabel, position);
      });
    });
  }

  /**
   * Détecte si l'utilisateur est connecté à WordPress.
   * @returns {boolean}
   */
  function detectWpLoginStatus() {
    return (
      document.body.classList.contains('logged-in') ||
      !!document.getElementById('wpadminbar')
    );
  }

  // Appliquer au chargement initial
  checkAndApplyBorder();

  // Écouter les mises à jour de stockage (config ou réglages modifiés)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' || area === 'local') checkAndApplyBorder();
  });

  // Écouter les messages du service worker ou de la popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'URL_CHANGED') {
      checkAndApplyBorder();
    } else if (message.type === 'GET_WP_STATUS') {
      sendResponse({ isLoggedIn: detectWpLoginStatus() });
    } else if (message.type === 'STEALTH_MODE_CHANGED') {
      // Act immediately on the value carried in the message — no storage round-trip.
      if (message.stealthMode) {
        applyBorder(null, null);
      } else {
        checkAndApplyBorder();
      }
    }
    return true;
  });
})();
