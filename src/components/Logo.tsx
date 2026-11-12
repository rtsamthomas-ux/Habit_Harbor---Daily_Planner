export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1F6A68" />
      <path d="M16 7.5v2.5" stroke="#FAF4E8" strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 15a4.5 4.5 0 0 1 9 0" stroke="#FAF4E8" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 20.5q2.25-2.2 4.5 0t4.5 0t4.5 0t4.5 0" stroke="#93D3CE" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 25q1.8-1.6 3.6 0t3.6 0t3.6 0" stroke="#FAF4E8" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
