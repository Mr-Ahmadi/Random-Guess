export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { width: '32', height: '32' },
    md: { width: '48', height: '48' },
    lg: { width: '64', height: '64' },
  };

  const dimensions = sizeMap[size];

  return (
    <svg
      viewBox="0 0 100 100"
      width={dimensions.width}
      height={dimensions.height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" opacity="0.1" />

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="2"
      />

      {/* Question mark design */}
      <path
        d="M 50 25 Q 60 25 65 32 Q 68 37 65 42 Q 62 45 58 43"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Question mark dot */}
      <circle cx="50" cy="62" r="2.5" fill="url(#logoGradient)" />

      {/* Target rings for "guessing" concept */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.6" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="url(#accentGradient)" strokeWidth="1.5" opacity="0.4" />

      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill="url(#logoGradient)" />
    </svg>
  );
}
