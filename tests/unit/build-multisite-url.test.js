// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { describe, it, expect } from 'vitest';
import { buildMultisiteUrl } from '../../popup/modules/projects/wordpress.js';

describe('buildMultisiteUrl', () => {
  it('subdomain + prefix: prepends prefix as subdomain', () => {
    const result = buildMultisiteUrl('monsite.com', 'fr', 'subdomain', '/wp-admin/');
    expect(result).toBe('https://fr.monsite.com/wp-admin/');
  });

  it('subdomain + empty prefix: uses base domain', () => {
    const result = buildMultisiteUrl('monsite.com', '', 'subdomain', '/wp-admin/');
    expect(result).toBe('https://monsite.com/wp-admin/');
  });

  it('subdirectory + prefix: appends prefix as path segment', () => {
    const result = buildMultisiteUrl('monsite.com', 'fr', 'subdirectory', '/wp-admin/');
    expect(result).toBe('https://monsite.com/fr/wp-admin/');
  });

  it('subdirectory + empty prefix: uses base domain without extra segment', () => {
    const result = buildMultisiteUrl('monsite.com', '', 'subdirectory', '/wp-admin/');
    expect(result).toBe('https://monsite.com/wp-admin/');
  });
});
