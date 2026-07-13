import type { CookieAttrs } from '../cookie-types';
import { cookieUrl } from './keys';

export function toSetDetails(c: CookieAttrs): chrome.cookies.SetDetails {
  const details: chrome.cookies.SetDetails = {
    url: cookieUrl(c),
    name: c.name,
    value: c.value,
    path: c.path,
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
  };
  if (!c.hostOnly) details.domain = c.domain;
  if (c.expirationDate !== undefined) details.expirationDate = c.expirationDate;
  if (c.storeId !== undefined) details.storeId = c.storeId;
  if (c.partitionKey !== undefined) details.partitionKey = c.partitionKey;
  return details;
}

export async function setCookie(c: CookieAttrs): Promise<void> {
  const result = await chrome.cookies.set(toSetDetails(c));
  if (!result) throw new Error('The browser rejected the cookie (check its attributes).');
}

export async function removeCookie(c: CookieAttrs): Promise<void> {
  await chrome.cookies.remove({
    url: cookieUrl(c),
    name: c.name,
    storeId: c.storeId,
    partitionKey: c.partitionKey,
  });
}
