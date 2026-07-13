import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { putProfile, getAllProfiles, deleteProfileDb } from './db';
import type { Profile } from './types';

function p(id: string): Profile {
  return { id, name: `p-${id}`, createdAt: 1, encrypted: false, cookies: [] };
}

describe('profiles db', () => {
  it('put + getAll round-trips', async () => {
    await putProfile(p('a'));
    await putProfile(p('b'));
    const all = await getAllProfiles();
    expect(all.map((x) => x.id).sort()).toEqual(['a', 'b']);
  });
  it('delete removes a profile', async () => {
    await putProfile(p('c'));
    await deleteProfileDb('a');
    const all = await getAllProfiles();
    expect(all.some((x) => x.id === 'a')).toBe(false);
  });
});
