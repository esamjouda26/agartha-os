import { useEffect, useState } from "react";

/**
 * Debounce a value by a given delay in milliseconds.
 * Prevents API spam on search inputs (SOP requirement).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
