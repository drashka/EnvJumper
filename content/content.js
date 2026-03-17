// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Content script EnvJumper.
 * Injects a colored border + environment name badge around the page.
 * Badge position and visibility are controlled via chrome.storage.sync (settings).
 * Responds to GET_WP_STATUS messages to detect WordPress login status.
 */

(function () {
  'use strict';

  const OVERLAY_ID = 'envjump-overlay';

  /**
   * Returns the text color (black or white) with the best contrast.
   * @param {string} hex - Hex color (#RRGGBB)
   * @returns {string} '#000000' or '#ffffff'
   */
  function contrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Returns CSS position and border-radius styles for the badge.
   * @param {string} position - 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * @returns {string[]}
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
   * Applies or removes the colored border and environment badge.
   * @param {string|null} color - Hex color, or null to remove.
   * @param {string|null} label - Environment name, or null to hide badge.
   * @param {string} position - Badge position.
   */
  function applyBorder(color, showFrame, label, position = 'top-left', fontSize = 13) {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    if (!color) return;
    if (!showFrame && !label) return;

    const textColor = contrastColor(color);

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      showFrame ? `border: 4px solid ${color}` : 'border: none',
      'pointer-events: none',
      'z-index: 2147483647',
      'box-sizing: border-box',
    ].join(';');

    if (label) {
      const tag = document.createElement('span');
      tag.textContent = label;
      const posStyles = getBadgePositionStyles(position);
      tag.style.cssText = [
        'position: absolute',
        ...posStyles,
        `background: ${color}`,
        `color: ${textColor}`,
        `font: 600 ${fontSize}px/1 system-ui, sans-serif`,
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
   * Checks the current hostname against stored groups and applies the border/badge.
   * Reads settings.showFrame, settings.showLabel, settings.labelPosition.
   */
  function checkAndApplyBorder() {
    const host = window.location.host;

    chrome.storage.sync.get(['groups', 'settings'], (result) => {
      const groups = result.groups || [];
      const s = result.settings || {};
      const showFrame = s.showFrame !== false;
      const showLabel = s.showLabel !== false;
      const position = s.labelPosition || 'top-left';
      const SIZE_MAP = { s: 11, m: 13, l: 15, xl: 18 };
      const fontSize = SIZE_MAP[s.labelSize] || 13;

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
              const siteHost = type === 'subdirectory'
                ? env.domain
                : (site.prefix ? `${site.prefix}.${env.domain}` : env.domain);
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

      applyBorder(
        matchColor,
        showFrame,
        showLabel ? matchLabel : null,
        position,
        fontSize
      );
    });
  }

  /**
   * Detects whether the user is logged in to WordPress.
   * @returns {boolean}
   */
  function detectWpLoginStatus() {
    return (
      document.body.classList.contains('logged-in') ||
      !!document.getElementById('wpadminbar')
    );
  }

  // Apply on initial load
  checkAndApplyBorder();

  // React to storage changes (config or settings modified)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') checkAndApplyBorder();
  });

  // Listen for messages from the service worker or popup
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'URL_CHANGED') {
      checkAndApplyBorder();
    } else if (message.type === 'GET_WP_STATUS') {
      sendResponse({ isLoggedIn: detectWpLoginStatus() });
    }
    return true;
  });
})();
