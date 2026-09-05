import { useEffect, useRef, useState } from 'react';

type UseGameTimerOptions = {
  /** Seconds on the clock when the turn starts. Read once per mount. */
  duration: number;
  isActive: boolean;
  onEnd: () => void;
};

/**
 * A wall-clock countdown driven by requestAnimationFrame.
 *
 * The duration is captured when the hook mounts: a turn owns its clock, so the
 * component that hosts the timer is remounted (keyed on the turn) whenever a
 * new turn begins. Pausing keeps whatever is left on the clock.
 */
export function useGameTimer({ duration, isActive, onEnd }: UseGameTimerOptions) {
  const [remaining, setRemaining] = useState(duration);
  const remainingRef = useRef(duration);
  const frameRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!isActive || endedRef.current) return;

    const startedAt = performance.now();
    const startRemaining = remainingRef.current;

    const tick = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const next = Math.max(0, startRemaining - elapsed);
      remainingRef.current = next;
      setRemaining(next);

      if (next <= 0) {
        if (!endedRef.current) {
          endedRef.current = true;
          onEndRef.current();
        }
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isActive]);

  return remaining;
}
