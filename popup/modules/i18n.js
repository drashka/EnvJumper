// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Wrapper for chrome.i18n.getMessage.
 * Falls back to the key itself if no translation is found.
 * @param {string} key
 * @param {string|string[]} [subs]
 * @returns {string}
 */
export function t(key, subs) {
  return chrome.i18n.getMessage(key, subs) || key;
}

/**
 * Injects translations into all elements with a data-i18n attribute.
 */
export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const msg = t(key);
    if (msg) el.textContent = msg;
  });
}
