import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Smoothly animates a displayed number toward `target`. */
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const shown = useRef(target);
  useEffect(() => {
    if (reduced) {
      shown.current = target;
      setValue(target);
      return;
    }
    from.current = shown.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const v = from.current + (target - from.current) * easeInOutCubic(t);
      shown.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return value;
}
