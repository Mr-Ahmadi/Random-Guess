import type { CSSProperties } from 'react';
import { TEAM_COLOR_COUNT } from '../state/gameReducer';

/** Exposes a team's palette colour to CSS as `--team-color`. */
export function teamColorVar(colorIndex: number): CSSProperties {
  return { ['--team-color' as string]: `var(--team-${(colorIndex % TEAM_COLOR_COUNT) + 1})` } as CSSProperties;
}
