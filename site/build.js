// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

// Generates one static landing page per language into docs/ (GitHub Pages).
// Usage: npm run build:site

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18N } from './i18n.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE_URL = 'https://drashka.github.io/EnvJumper/';

// English is served at the root, other languages in their own folder.
const PAGES = [
  { lang: 'en', dir: '' },
  { lang: 'fr', dir: 'fr/' },
  { lang: 'es', dir: 'es/' },
];

// Root page only: on first visit, send French/Spanish browsers to their page
// before anything renders. An explicit choice stored by script.js always wins.
const ROOT_REDIRECT = `  <script>
    (function () {
      var routes = { fr: 'fr/', es: 'es/' };
      var stored = null;
      try { stored = localStorage.getItem('ej-lang'); } catch (e) {}
      var lang = (navigator.language || '').slice(0, 2).toLowerCase();
      if (!stored && routes[lang]) location.replace(routes[lang] + location.hash);
    })();
  </script>
`;

const template = readFileSync(join(ROOT, 'site/template.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function hreflangTags() {
  const tags = PAGES.map(({ lang, dir }) => `  <link rel="alternate" hreflang="${lang}" href="${SITE_URL}${dir}">`);
  tags.push(`  <link rel="alternate" hreflang="x-default" href="${SITE_URL}">`);
  return tags.join('\n');
}

function langLinks(current) {
  return PAGES.map(({ lang, dir }) => {
    const base = PAGES.find((p) => p.lang === current).dir ? '../' : './';
    const href = `${base}${dir}`;
    const attrs = lang === current ? ' aria-current="page"' : '';
    return `        <a href="${href}" hreflang="${lang}" lang="${lang}" data-lang="${lang}"${attrs}>${lang.toUpperCase()}</a>`;
  }).join('\n');
}

for (const { lang, dir } of PAGES) {
  const vars = {
    ...Object.fromEntries(Object.entries(I18N[lang]).map(([k, v]) => [k, escapeHtml(v)])),
    lang,
    base: dir ? '../' : '',
    canonical: `${SITE_URL}${dir}`,
    hreflang: hreflangTags(),
    langLinks: langLinks(lang),
    headScript: dir ? '' : ROOT_REDIRECT,
  };

  const html = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in vars)) throw new Error(`Missing translation "${key}" for "${lang}"`);
    return vars[key];
  });

  const out = join(ROOT, 'docs', dir, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  // The comment goes after the doctype so the page stays in standards mode
  writeFileSync(out, html.replace(/^<!doctype html>\n/i, '<!doctype html>\n<!-- Generated from site/template.html by site/build.js — do not edit -->\n'));
  console.log(`✓ docs/${dir}index.html`);
}
