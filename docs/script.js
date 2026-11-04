// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

(() => {
  const LANG_KEY = 'ej-lang';

  const saveLang = (lang) => { try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage unavailable */ } };

  // ─── Language ──────────────────────────────────────────────
  // Remember an explicit language choice (read by the redirect in the root page's <head>)
  document.querySelectorAll('a[data-lang]').forEach((link) => {
    link.addEventListener('click', () => saveLang(link.dataset.lang));
  });

  // ─── Live demo ─────────────────────────────────────────────
  // Environments are read from the popup buttons, so domains follow the page language
  const domainEl = document.getElementById('demo-domain');
  const badgeEl = document.getElementById('demo-badge');
  const envButtons = document.querySelectorAll('.env[data-env]');
  const ENVS = [...envButtons].map((btn) => ({
    name: btn.querySelector('span').textContent,
    domain: btn.querySelector('small').textContent,
    color: btn.style.getPropertyValue('--c').trim(),
  }));
  let active = 0;
  let timer = null;

  function setEnv(index) {
    active = index;
    const env = ENVS[index];
    document.documentElement.style.setProperty('--env', env.color);
    domainEl.textContent = env.domain;
    domainEl.classList.remove('swap');
    void domainEl.offsetWidth; // restart the swap animation
    domainEl.classList.add('swap');
    badgeEl.textContent = env.name;
    envButtons.forEach((btn) => {
      const on = Number(btn.dataset.env) === index;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  envButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      clearInterval(timer);
      setEnv(Number(btn.dataset.env));
    });
  });

  setEnv(0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timer = setInterval(() => setEnv((active + 1) % ENVS.length), 2600);
  }

  // ─── Tour ──────────────────────────────────────────────────
  const tourImg = document.getElementById('tour-img');
  const tabs = document.querySelectorAll('[data-slide]');

  function showSlide(slide) {
    // Keep the language folder and base path, swap only the file name
    tourImg.src = tourImg.getAttribute('src').replace(/[^/]+\.png$/, `${slide}.png`);
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.slide === slide)));
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => showSlide(tab.dataset.slide)));
  showSlide('02-switch');
})();
