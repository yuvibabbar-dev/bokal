import { describe, it, expect } from 'vitest';
import { isEntitled } from './entitlement';

const GRACE = 14 * 24 * 60 * 60 * 1000;
const NOW = 1_000_000_000_000;

describe('isEntitled', () => {
  it('is false with no cache', () => expect(isEntitled(null, NOW, GRACE)).toBe(false));
  it('is false when never paid', () => expect(isEntitled({ paid: false, checkedAt: NOW }, NOW, GRACE)).toBe(false));
  it('is true when paid and freshly checked', () => expect(isEntitled({ paid: true, checkedAt: NOW }, NOW, GRACE)).toBe(true));
  it('honors paid within the grace window', () => expect(isEntitled({ paid: true, checkedAt: NOW - GRACE + 1000 }, NOW, GRACE)).toBe(true));
  it('revokes paid once the grace window has elapsed', () => expect(isEntitled({ paid: true, checkedAt: NOW - GRACE - 1 }, NOW, GRACE)).toBe(false));
});
