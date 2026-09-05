type NumberFormatter = (value: number) => string;

/** m:ss, written with the digits of the active language. */
export function formatClock(seconds: number, n: NumberFormatter): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${n(minutes)}:${n(rest).padStart(2, n(0))}`;
}

/** Signed score, e.g. +4 / −3, so penalties read clearly. */
export function formatSigned(value: number, n: NumberFormatter): string {
  if (value > 0) return `+${n(value)}`;
  if (value < 0) return `−${n(Math.abs(value))}`;
  return n(0);
}
