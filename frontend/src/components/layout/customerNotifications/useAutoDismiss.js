import { useEffect } from "react";

export function useAutoDismiss(value, dismiss, delay) {
  useEffect(() => {
    if (!value) return undefined;
    const timeoutId = window.setTimeout(dismiss, delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, dismiss, delay]);
}
