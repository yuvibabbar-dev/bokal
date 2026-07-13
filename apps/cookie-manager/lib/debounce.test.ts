import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncer } from './debounce';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createDebouncer', () => {
  it('collapses a burst into a single call', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 50);
    d.trigger();
    d.trigger();
    d.trigger();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() prevents a pending call', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 50);
    d.trigger();
    d.cancel();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
