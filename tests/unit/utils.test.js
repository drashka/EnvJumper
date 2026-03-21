// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { describe, it, expect } from 'vitest';
import { findMatch } from '../../background/utils.js';

const makeGroup = (overrides = {}) => ({
  id: 'g1',
  name: 'Test Group',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  environments: [],
  ...overrides,
});

describe('findMatch', () => {
  it('returns group and env on direct domain match', () => {
    const env = { id: 'e1', name: 'Production', domain: 'example.com', color: '#EF4444' };
    const group = makeGroup({ environments: [env] });
    const result = findMatch([group], 'example.com');
    expect(result).not.toBeNull();
    expect(result.env).toBe(env);
    expect(result.group).toBe(group);
  });

  it('returns null when no group matches', () => {
    const env = { id: 'e1', name: 'Production', domain: 'example.com', color: '#EF4444' };
    const group = makeGroup({ environments: [env] });
    const result = findMatch([group], 'other.com');
    expect(result).toBeNull();
  });

  it('matches WP Multisite subdomain with prefix', () => {
    const env = { id: 'e1', name: 'Production', domain: 'monsite.com', color: '#EF4444' };
    const group = makeGroup({
      isWordPressMultisite: true,
      wpMultisiteType: 'subdomain',
      wpSites: [{ label: 'Français', prefix: 'fr' }],
      environments: [env],
    });
    const result = findMatch([group], 'fr.monsite.com');
    expect(result).not.toBeNull();
    expect(result.env).toBe(env);
    expect(result.group).toBe(group);
  });

  it('matches WP Multisite subdomain with empty prefix (base domain)', () => {
    const env = { id: 'e1', name: 'Production', domain: 'monsite.com', color: '#EF4444' };
    const group = makeGroup({
      isWordPressMultisite: true,
      wpMultisiteType: 'subdomain',
      wpSites: [{ label: 'Principal', prefix: '' }],
      environments: [env],
    });
    const result = findMatch([group], 'monsite.com');
    expect(result).not.toBeNull();
    expect(result.env).toBe(env);
  });

  it('returns match from the second group when first does not match', () => {
    const env1 = { id: 'e1', name: 'Production', domain: 'first.com', color: '#EF4444' };
    const env2 = { id: 'e2', name: 'Production', domain: 'second.com', color: '#3B82F6' };
    const group1 = makeGroup({ id: 'g1', environments: [env1] });
    const group2 = makeGroup({ id: 'g2', environments: [env2] });
    const result = findMatch([group1, group2], 'second.com');
    expect(result).not.toBeNull();
    expect(result.group).toBe(group2);
    expect(result.env).toBe(env2);
  });

  it('returns null for a group with empty environments array', () => {
    const group = makeGroup({ environments: [] });
    const result = findMatch([group], 'example.com');
    expect(result).toBeNull();
  });

  it('does not crash when isWordPressMultisite is true but wpSites is empty', () => {
    const env = { id: 'e1', name: 'Production', domain: 'monsite.com', color: '#EF4444' };
    const group = makeGroup({
      isWordPressMultisite: true,
      wpMultisiteType: 'subdomain',
      wpSites: [],
      environments: [env],
    });
    expect(() => findMatch([group], 'fr.monsite.com')).not.toThrow();
    expect(findMatch([group], 'fr.monsite.com')).toBeNull();
  });
});
