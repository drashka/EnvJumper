// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { describe, it, expect } from 'vitest';
import { buildTargetUrl } from '../../popup/modules/helpers/ui-helpers.js';

describe('buildTargetUrl', () => {
  it('preserves path when switching domain', () => {
    const result = buildTargetUrl('https://alpha.com/dashboard', 'staging.alpha.com', 'https');
    expect(result).toBe('https://staging.alpha.com/dashboard');
  });

  it('preserves query string and hash', () => {
    const result = buildTargetUrl('https://alpha.com/page?tab=settings#section', 'staging.alpha.com', 'https');
    expect(result).toBe('https://staging.alpha.com/page?tab=settings#section');
  });

  it('changes protocol from http to https', () => {
    const result = buildTargetUrl('http://alpha.com/path', 'alpha.com', 'https');
    expect(result).toBe('https://alpha.com/path');
  });

  it('uses host (hostname + port) when targetDomain includes a port', () => {
    const result = buildTargetUrl('https://alpha.com/path', 'localhost:3000', 'http');
    expect(result).toBe('http://localhost:3000/path');
  });

  it('returns null for an invalid currentUrl', () => {
    const result = buildTargetUrl('not a url', 'example.com', 'https');
    expect(result).toBeNull();
  });
});
