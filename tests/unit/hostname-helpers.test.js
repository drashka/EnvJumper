// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { describe, it, expect } from 'vitest';
import { projectNameFromHostname, envNameFromHostname } from '../../popup/modules/helpers/hostname.js';

// ── projectNameFromHostname ───────────────────────────────────────────────────

describe('projectNameFromHostname', () => {
  it('strips staging subdomain and TLD, returns Title Case', () => {
    expect(projectNameFromHostname('staging.mon-projet.com')).toBe('Mon Projet');
  });

  it('strips www subdomain and TLD', () => {
    expect(projectNameFromHostname('www.example.com')).toBe('Example');
  });

  it('strips language subdomain fr', () => {
    expect(projectNameFromHostname('fr.monsite.com')).toBe('Monsite');
  });

  it('strips admin subdomain', () => {
    expect(projectNameFromHostname('admin.myapp.io')).toBe('Myapp');
  });
});

// ── envNameFromHostname ───────────────────────────────────────────────────────

describe('envNameFromHostname', () => {
  it('staging subdomain → Staging', () => {
    expect(envNameFromHostname('staging.xxx.com')).toBe('Staging');
  });

  it('www subdomain → Production', () => {
    expect(envNameFromHostname('www.xxx.com')).toBe('Production');
  });

  it('bare domain (no subdomain) → Production', () => {
    expect(envNameFromHostname('xxx.com')).toBe('Production');
  });

  it('dev subdomain → Dev', () => {
    expect(envNameFromHostname('dev.xxx.com')).toBe('Dev');
  });

  it('local subdomain → Local', () => {
    expect(envNameFromHostname('local.xxx.com')).toBe('Local');
  });

  it('test subdomain → Test', () => {
    expect(envNameFromHostname('test.xxx.com')).toBe('Test');
  });

  it('qa subdomain → Test', () => {
    expect(envNameFromHostname('qa.xxx.com')).toBe('Test');
  });

  it('unknown subdomain → capitalized subdomain name', () => {
    expect(envNameFromHostname('custom.xxx.com')).toBe('Custom');
  });
});
