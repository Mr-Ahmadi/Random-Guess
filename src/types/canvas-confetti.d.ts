declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    scalar?: number;
    zIndex?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    disableForReducedMotion?: boolean;
  }
  function confetti(options?: Options): Promise<null>;
  export = confetti;
}
