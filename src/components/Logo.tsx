type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * "Dowr" means a turn / a lap - the mark is a lap of the circle handing the
 * word from one player to the next.
 */
export function Logo({ size = 44, className }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dowrWarm" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="dowrCool" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="46" fill="url(#dowrWarm)" opacity="0.12" />

      {/* the lap */}
      <path
        d="M78 38a32 32 0 1 1-13-14"
        stroke="url(#dowrWarm)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M62 12l18 8-9 17z" fill="url(#dowrWarm)" />

      {/* the word being passed */}
      <circle cx="50" cy="50" r="17" fill="url(#dowrCool)" opacity="0.22" />
      <circle cx="40" cy="50" r="4.4" fill="url(#dowrCool)" />
      <circle cx="50" cy="50" r="4.4" fill="url(#dowrCool)" />
      <circle cx="60" cy="50" r="4.4" fill="url(#dowrCool)" />
    </svg>
  );
}
