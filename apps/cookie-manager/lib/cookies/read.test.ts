import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllCookies, getActiveTabUrl, setInspectedTab } from './read';

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

describe('getActiveTabUrl inspected-tab override (DevTools)', () => {
  afterEach(() => setInspectedTab(null)); // module-level state — reset so it can't leak between tests

  it('reads the inspected tab url when set, else the active tab', async () => {
    (globalThis as unknown as { chrome: unknown }).chrome = {
      tabs: {
        get: vi.fn(async (id: number) => ({ id, url: 'https://inspected.example/' })),
        query: vi.fn(async () => [{ id: 1, url: 'https://active.example/' }]),
      },
    };
    setInspectedTab(5);
    expect(await getActiveTabUrl()).toBe('https://inspected.example/');
    expect(chrome.tabs.get).toHaveBeenCalledWith(5);
    setInspectedTab(null);
    expect(await getActiveTabUrl()).toBe('https://active.example/');
  });
});
