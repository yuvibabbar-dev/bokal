import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllCookies } from './read';

const uP = { name: 'a', value: '1', domain: 'x.com', path: '/', secure: true, httpOnly: false, sameSite: 'lax', hostOnly: true };
const part = {
  name: 'b', value: '2', domain: 'y.com', path: '/', secure: true, httpOnly: false, sameSite: 'no_restriction', hostOnly: true,
  partitionKey: { topLevelSite: 'https://top.com' },
};

beforeEach(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    cookies: { getAll: vi.fn(async (d: { partitionKey?: unknown }) => (d && d.partitionKey ? [uP, part] : [uP])) },
  };
});

describe('getAllCookies', () => {
  it('includes partitioned cookies via partitionKey:{}', async () => {
    const out = await getAllCookies();
    expect(chrome.cookies.getAll).toHaveBeenCalledWith({ partitionKey: {} });
    expect(out.find((c) => c.name === 'b')?.partitionKey?.topLevelSite).toBe('https://top.com');
    expect(out).toHaveLength(2);
  });

  it('falls back to unpartitioned on old Chrome (getAll rejects with partitionKey)', async () => {
    (chrome.cookies.getAll as unknown) = vi.fn(async (d: { partitionKey?: unknown }) => {
      if (d && d.partitionKey) throw new Error('unsupported');
      return [uP];
    });
    const out = await getAllCookies();
    expect(out).toHaveLength(1);
    expect(out[0]?.name).toBe('a');
  });
});
