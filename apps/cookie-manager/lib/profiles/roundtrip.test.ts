import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { encryptJson, decryptJson } from './crypto';
import { putProfile, getAllProfiles } from './db';
import type { Profile } from './types';
import type { CookieAttrs } from '../cookie-types';

const cookies: CookieAttrs[] = [
  { name: 'sid', value: 'secret-token', domain: 'example.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax', hostOnly: false },
];

describe('encrypted profile round-trip through IndexedDB', () => {
  it('stores ciphertext and recovers the cookies with the passphrase', async () => {
    const blob = await encryptJson(cookies, 'pw123');
    const profile: Profile = { id: 'rt1', name: 'enc', createdAt: 1, encrypted: true, blob };
    await putProfile(profile);

    const stored = (await getAllProfiles()).find((p) => p.id === 'rt1')!;
    expect(stored.cookies).toBeUndefined(); // no plaintext at rest
    expect(stored.blob).toBeDefined();
    // ciphertext must not contain the secret in the clear
    expect(JSON.stringify(stored.blob)).not.toContain('secret-token');

    const recovered = await decryptJson<CookieAttrs[]>(stored.blob!, 'pw123');
    expect(recovered).toEqual(cookies);
  });
});
