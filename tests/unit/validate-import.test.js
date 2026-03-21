// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { describe, it, expect } from 'vitest';
import { validateImportData, stripBasicAuth } from '../../popup/modules/settings/import-export.js';

// ── validateImportData ────────────────────────────────────────────────────────

describe('validateImportData', () => {
  const validGroup = {
    name: 'Projet Alpha',
    environments: [
      { name: 'Production', domain: 'alpha.com', color: '#EF4444' },
    ],
  };

  it('accepts a valid payload', () => {
    expect(validateImportData({ groups: [validGroup] })).toBe(true);
  });

  it('accepts an empty groups array', () => {
    expect(validateImportData({ groups: [] })).toBe(true);
  });

  it('rejects null', () => {
    expect(validateImportData(null)).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(validateImportData({})).toBe(false);
  });

  it('rejects a payload without a groups key', () => {
    expect(validateImportData({ notGroups: [] })).toBe(false);
  });

  it('rejects a group missing a name', () => {
    const data = {
      groups: [{ environments: [{ name: 'Prod', domain: 'x.com', color: '#EF4444' }] }],
    };
    expect(validateImportData(data)).toBe(false);
  });

  it('rejects an env missing a domain', () => {
    const data = {
      groups: [{ name: 'Projet', environments: [{ name: 'Prod', color: '#EF4444' }] }],
    };
    expect(validateImportData(data)).toBe(false);
  });
});

// ── stripBasicAuth ────────────────────────────────────────────────────────────

describe('stripBasicAuth', () => {
  const groupsWithAuth = [
    {
      id: 'g1',
      name: 'Projet Auth',
      environments: [
        {
          id: 'e1',
          name: 'Staging',
          domain: 'staging.auth.com',
          color: '#F97316',
          basicAuth: { enabled: true, username: 'admin', password: 'secret' },
        },
      ],
    },
  ];

  it('removes username and password from environments', () => {
    const result = stripBasicAuth(groupsWithAuth);
    const env = result[0].environments[0];
    expect(env.basicAuth).toBeUndefined();
  });

  it('does not mutate the original groups array', () => {
    stripBasicAuth(groupsWithAuth);
    const originalEnv = groupsWithAuth[0].environments[0];
    expect(originalEnv.basicAuth).toBeDefined();
    expect(originalEnv.basicAuth.username).toBe('admin');
    expect(originalEnv.basicAuth.password).toBe('secret');
  });
});
