import { describe, it, expect, beforeEach } from 'vitest';
import { recordAction, shouldPromptReview, dismissReviewPrompt, reviewUrl } from './review';

function fakeLocal() {
  const map = new Map<string, unknown>();
  return {
    get: async (key: string) => (map.has(key) ? { [key]: map.get(key) } : {}),
    set: async (obj: Record<string, unknown>) => { for (const [k, v] of Object.entries(obj)) map.set(k, v); },
  };
}

beforeEach(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local: fakeLocal() },
    runtime: { id: 'abc123' },
  };
});

describe('review prompt', () => {
  it('prompts only after the 3rd action', async () => {
    await recordAction();
    await recordAction();
    expect(await shouldPromptReview()).toBe(false);
    await recordAction();
    expect(await shouldPromptReview()).toBe(true);
  });

  it('never prompts again after dismissal', async () => {
    await recordAction();
    await recordAction();
    await recordAction();
    await dismissReviewPrompt();
    expect(await shouldPromptReview()).toBe(false);
    await recordAction(); // further actions do not resurrect it
    expect(await shouldPromptReview()).toBe(false);
  });

  it('links to the CWS reviews page for this extension id', () => {
    expect(reviewUrl()).toBe('https://chromewebstore.google.com/detail/abc123/reviews');
  });
});
