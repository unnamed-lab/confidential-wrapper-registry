import React from "react";

export function Logo({ className = "w-8 h-8", glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(124,92,255,0.4)]" : ""}`}
    >
      <defs>
        <linearGradient id="cyberLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
      </defs>
      
      {/* Minimalist Interlocking Wrapper Ring (Continuous Shield Ribbon) */}
      <path
        d="M24,44 C24,28 36,16 50,16 C64,16 76,28 76,44 C76,64 50,84 50,84 C50,84 24,64 24,44 Z"
        stroke="url(#cyberLogoGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Inner Shield Lock Shackle (Homomorphic Wrapper Layer) */}
      <path
        d="M38,48 V42 C38,35 43,30 50,30 C57,30 62,35 62,42 V48"
        stroke="url(#cyberLogoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />
      
      {/* Central Core Data Node */}
      <circle cx="50" cy="52" r="5" fill="#00f0ff" />
    </svg>
  );
}
