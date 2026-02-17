import { useEffect, useRef, useState } from 'react';

type UseGameTimerProps = {
  duration: number;
  isActive: boolean;
  onTimerEnd: () => void;
};

export function useGameTimer({ duration, isActive, onTimerEnd }: UseGameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const wasActivePrevRef = useRef<boolean>(isActive);

  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - elapsed / 1000);

        if (newTime <= 0) {
          onTimerEnd();
          return 0;
        }

        return newTime;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onTimerEnd]);

  useEffect(() => {
    // Preserve time remaining when transitioning from paused to active
    if (isActive && !wasActivePrevRef.current) {
      lastTimeRef.current = Date.now();
    }
    wasActivePrevRef.current = isActive;
  }, [isActive]);

  return timeRemaining;
}
