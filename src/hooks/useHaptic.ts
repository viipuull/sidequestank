export function useHaptic() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator === "undefined") return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // no-op
    }
  };
  return {
    tick: () => vibrate(8),
    tap: () => vibrate(12),
    success: () => vibrate([15, 40, 25]),
    celebrate: () => vibrate([20, 60, 30, 60, 40]),
    error: () => vibrate([40, 30, 40]),
  };
}