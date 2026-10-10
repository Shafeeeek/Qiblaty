import { useEffect, useState } from "react";

export function useStoredState(key, initial, validate = () => true) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const stored = JSON.parse(raw);
        if (validate(stored)) return stored;
      }
    } catch {
      /* Private browsing or corrupt data: use a safe default. */
    }
    return initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      window.dispatchEvent(new Event("qibla-storage-error"));
    }
  }, [key, value]);
  return [value, setValue];
}

export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const refresh = () => setNow(new Date());
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return now;
}
