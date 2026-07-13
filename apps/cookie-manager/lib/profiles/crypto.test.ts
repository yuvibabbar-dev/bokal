import { describe, it, expect } from 'vitest';
import { encryptJson, decryptJson } from './crypto';

describe('crypto', () => {
  it('round-trips an object with the correct passphrase', async () => {
    const obj = { a: 1, cookies: [{ name: 'sid', value: 'secret' }] };
    const blob = await encryptJson(obj, 'correct horse');
    const back = await decryptJson<typeof obj>(blob, 'correct horse');
    expect(back).toEqual(obj);
  });
  it('fails to decrypt with the wrong passphrase', async () => {
    const blob = await encryptJson({ x: 1 }, 'right');
    await expect(decryptJson(blob, 'wrong')).rejects.toBeDefined();
  });
  it('uses a random salt+iv (two encryptions of the same data differ)', async () => {
    const a = await encryptJson({ x: 1 }, 'pw');
    const b = await encryptJson({ x: 1 }, 'pw');
    expect(a.ct === b.ct && a.iv === b.iv && a.salt === b.salt).toBe(false);
  });
});
