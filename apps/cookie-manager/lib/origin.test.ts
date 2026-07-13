import { describe, it, expect } from 'vitest';
import { isSecureOrigin } from './origin';

describe('isSecureOrigin', () => {
  it('is true for https', () => expect(isSecureOrigin('https://example.com/x')).toBe(true));
  it('is false for plain http', () => expect(isSecureOrigin('http://example.com/x')).toBe(false));
  it('is true for http localhost', () => expect(isSecureOrigin('http://localhost:3000/')).toBe(true));
  it('is true for http 127.0.0.1', () => expect(isSecureOrigin('http://127.0.0.1/')).toBe(true));
  it('is false for a non-url', () => expect(isSecureOrigin('not a url')).toBe(false));
});
