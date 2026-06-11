import { useRef, useCallback } from 'react';

/**
 * useCCLI — Chronometric Cognitive Load Index hook
 * Tracks Inter-Keystroke Interval (IKI), backspace frequency, and pauses
 * to compute a Chronometric Load Score (CLS) between 0.0 (relaxed) and 1.0 (high load).
 *
 * Blueprint: Component 4 — CCLI Engine & Chronometric Adaptive Gate (CAG)
 */
export function useCCLI(): {
  cls: number;
  resetCLS: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
} {
  const lastKeyTimeRef = useRef<number | null>(null);
  const ikiSamplesRef = useRef<number[]>([]);
  const backspaceCountRef = useRef(0);
  const totalKeyCountRef = useRef(0);
  const pauseCountRef = useRef(0);
  const clsRef = useRef(0);

  const PAUSE_THRESHOLD_MS = 2000; // >2s gap = typing pause

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();

    totalKeyCountRef.current += 1;

    if (e.key === 'Backspace') {
      backspaceCountRef.current += 1;
    }

    if (lastKeyTimeRef.current !== null) {
      const iki = now - lastKeyTimeRef.current;
      
      if (iki > PAUSE_THRESHOLD_MS) {
        // Count as a significant pause
        pauseCountRef.current += 1;
      } else {
        // Only record non-pause IKIs for average calculation
        ikiSamplesRef.current.push(iki);
        // Keep last 50 samples to stay responsive
        if (ikiSamplesRef.current.length > 50) {
          ikiSamplesRef.current.shift();
        }
      }
    }

    lastKeyTimeRef.current = now;

    // Compute CLS
    const avgIKI = ikiSamplesRef.current.length > 0
      ? ikiSamplesRef.current.reduce((a, b) => a + b, 0) / ikiSamplesRef.current.length
      : 200; // default 200ms = normal typing speed

    const total = totalKeyCountRef.current;
    const backspaces = backspaceCountRef.current;
    const pauses = pauseCountRef.current;

    // --- IKI penalty: slow typing = high load (>500ms avg → high load) ---
    // Normalize: 100ms=fast(0), 600ms=slow(1)
    const ikiPenalty = Math.min(1.0, Math.max(0.0, (avgIKI - 100) / 500));

    // --- Backspace penalty: high ratio = struggling ---
    const backspacePenalty = total > 5 ? Math.min(1.0, backspaces / total * 3) : 0;

    // --- Pause penalty: each pause adds load ---
    const pausePenalty = Math.min(1.0, pauses * 0.2);

    const cls = parseFloat(((ikiPenalty + backspacePenalty + pausePenalty) / 3).toFixed(3));
    clsRef.current = cls;
  }, []);

  const resetCLS = useCallback(() => {
    lastKeyTimeRef.current = null;
    ikiSamplesRef.current = [];
    backspaceCountRef.current = 0;
    totalKeyCountRef.current = 0;
    pauseCountRef.current = 0;
    clsRef.current = 0;
  }, []);

  return {
    cls: clsRef.current,
    resetCLS,
    onKeyDown,
  };
}
