import { useState, useEffect, useCallback, useRef } from "react";

// ─── useNotice ────────────────────────────────────────────────────────────────
export function useNotice(duration = 2800) {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), duration);
    return () => clearTimeout(t);
  }, [notice, duration]);
  const show = useCallback((type, message) => setNotice({ type, message }), []);
  return [notice, show];
}

// ─── useDebounced ─────────────────────────────────────────────────────────────
export function useDebounced(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ─── useFocusOnSuccess ────────────────────────────────────────────────────────
// Auto-focuses a ref after a successful submission (for rapid-entry UX)
export function useFocusOnSuccess() {
  const ref = useRef(null);
  const focusInput = useCallback(() => {
    setTimeout(() => ref.current?.focus(), 80);
  }, []);
  return [ref, focusInput];
}

// ─── useToday ────────────────────────────────────────────────────────────────
export function useToday() {
  return new Date().toISOString().slice(0, 10);
}
