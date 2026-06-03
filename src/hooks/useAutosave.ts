import { useEffect, useRef } from 'react';

export const useAutosave = (
  key: string,
  value: string,
  intervalMs: number = 5000
) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const interval = setInterval(() => {
      if (valueRef.current) {
        localStorage.setItem(key, valueRef.current);
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [key, intervalMs]);

  const clearDraft = () => localStorage.removeItem(key);
  const getDraft = () => localStorage.getItem(key) || '';

  return { clearDraft, getDraft };
};
