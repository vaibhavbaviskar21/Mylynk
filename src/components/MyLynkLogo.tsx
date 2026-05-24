import React from "react";

export function MyLynkLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="mylynk-custom-vector-logo"
    >
      <defs>
        <linearGradient id="mylynk-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" /> {/* Indigo */}
          <stop offset="50%" stopColor="#ec4899" /> {/* Pink */}
          <stop offset="100%" stopColor="#f59e0b" /> {/* Amber */}
        </linearGradient>
        <radialGradient id="mylynk-logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.55)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </radialGradient>
      </defs>

      {/* Futuristic soft ambient backing glow */}
      <circle cx="50" cy="50" r="46" fill="url(#mylynk-logo-glow)" />

      {/* Elegant interlace path representing connected multi-channels */}
      <path
        d="M26 62C22 55 22 45 26 38C30.5 30 40 26 50 26C60 26 69.5 30 74 38C78 45 78 55 74 62C69.5 70 60 74 50 74C40 74 30.5 70 26 62Z"
        stroke="url(#mylynk-logo-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
      />

      {/* Main linked active rings representing centralized profiles */}
      <path
        d="M36 56C32.134 56 29 52.866 29 49C29 45.134 32.134 42 36 42H52C55.866 42 59 45.134 59 49"
        stroke="url(#mylynk-logo-grad)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      
      <path
        d="M64 44C67.866 44 71 47.134 71 51C71 54.866 67.866 58 64 58H48C44.134 58 41 54.866 41 51"
        stroke="url(#mylynk-logo-grad)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Fusion center node */}
      <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
    </svg>
  );
}

export default MyLynkLogo;
