export function createDebouncer(fn: () => void, delayMs: number): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const trigger = (): void => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, delayMs);
  };
  return { trigger, cancel };
}
