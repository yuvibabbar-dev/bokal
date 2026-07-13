import { describe, it, expect } from 'vitest';
import { toHeaderString, parseHeaderString } from './header';

describe('toHeaderString', () => {
  it('joins name=value pairs with "; "', () => {
    expect(toHeaderString([{ name: 'a', value: '1' }, { name: 'b', value: '2' }])).toBe('a=1; b=2');
  });
});

describe('parseHeaderString', () => {
  it('parses a raw a=b; c=d string, scoping to the domain', () => {
    const out = parseHeaderString('sid=abc; theme=dark', 'example.com');
    expect(out.map((c) => [c.name, c.value])).toEqual([['sid', 'abc'], ['theme', 'dark']]);
    expect(out[0]!.domain).toBe('example.com');
    expect(out[0]!.path).toBe('/');
  });
  it('strips a leading "Cookie:" prefix', () => {
    expect(parseHeaderString('Cookie: a=1', 'e.com').map((c) => c.name)).toEqual(['a']);
  });
  it('keeps "=" inside a value (base64)', () => {
    expect(parseHeaderString('t=YWJj==', 'e.com')[0]!.value).toBe('YWJj==');
  });
  it('ignores empty and malformed segments', () => {
    expect(parseHeaderString('; a=1 ;; broken ; =nope', 'e.com').map((c) => c.name)).toEqual(['a']);
  });
});
