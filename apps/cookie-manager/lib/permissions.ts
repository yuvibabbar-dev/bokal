const ALL_URLS: chrome.permissions.Permissions = { origins: ['<all_urls>'] };

export function hasAllUrlsPermission(): Promise<boolean> {
  return chrome.permissions.contains(ALL_URLS);
}

/** Must run synchronously inside a user gesture — do not await anything before calling this. */
export function requestAllUrls(): Promise<boolean> {
  return chrome.permissions.request(ALL_URLS);
}

export function onPermissionsChanged(cb: (granted: boolean) => void): () => void {
  const handler = (): void => {
    void hasAllUrlsPermission().then(cb);
  };
  chrome.permissions.onAdded.addListener(handler);
  chrome.permissions.onRemoved.addListener(handler);
  return () => {
    chrome.permissions.onAdded.removeListener(handler);
    chrome.permissions.onRemoved.removeListener(handler);
  };
}
