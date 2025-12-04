/**
 * Nest icon SVG component for Message Nest
 * Represents a bird's nest, symbolizing messages/inbox
 */
export default function NestIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Nest shape - curved lines forming a nest */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 18c2.5-1 5-2 8-2s5.5 1 8 2M3 18v-3c0-1.5 1-3 3-3s3 1.5 3 3v3M3 18h18M9 15v3m6-3v3"
      />
      {/* Small eggs/messages inside nest */}
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
      {/* Nest opening/entrance */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 15c0-1 1-2 2-2s2 1 2 2m4 0c0-1 1-2 2-2s2 1 2 2"
        opacity="0.5"
      />
    </svg>
  );
}

