import { describe, expect, it } from 'vitest';
import { safeRedirectTarget } from './redirect';

describe('safeRedirectTarget', () => {
  it('returns the stored in-app path', () => {
    expect(safeRedirectTarget({ from: '/settings?tab=profile' })).toBe('/settings?tab=profile');
  });

  it.each([
    ['no state', null],
    ['no from', {}],
    ['an absolute URL', { from: 'https://evil.example' }],
    ['a protocol-relative URL', { from: '//evil.example' }],
    ['a relative path', { from: 'settings' }],
  ])('falls back to / for %s', (_label, state) => {
    expect(safeRedirectTarget(state)).toBe('/');
  });
});
