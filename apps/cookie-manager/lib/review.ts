// One-time, non-incentivized review nudge shown after the user's 3rd successful cookie action.
// Counter + shown-flag live in storage.local; once shown/dismissed it never counts or prompts again.
const COUNT_KEY = 'wafer:actionCount';
const SHOWN_KEY = 'wafer:reviewPromptShown';
const THRESHOLD = 3;

async function getLocal<T>(key: string): Promise<T | undefined> {
  const r = await chrome.storage.local.get(key);
  return r[key] as T | undefined;
}

export async function recordAction(): Promise<void> {
  if (await getLocal<boolean>(SHOWN_KEY)) return; // stop counting once resolved
  const count = (await getLocal<number>(COUNT_KEY)) ?? 0;
  await chrome.storage.local.set({ [COUNT_KEY]: count + 1 });
}

export async function shouldPromptReview(): Promise<boolean> {
  if (await getLocal<boolean>(SHOWN_KEY)) return false;
  const count = (await getLocal<number>(COUNT_KEY)) ?? 0;
  return count >= THRESHOLD;
}

export async function dismissReviewPrompt(): Promise<void> {
  await chrome.storage.local.set({ [SHOWN_KEY]: true });
}

export function reviewUrl(): string {
  const id = typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : '';
  return `https://chromewebstore.google.com/detail/${id}/reviews`;
}
