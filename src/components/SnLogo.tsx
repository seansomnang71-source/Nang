import React from 'react';

interface SnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * Official SN STORE Brand Identity Emblem & Lockup
 * Matches the official uploaded SN Store emblem:
 * - Split double-ring circle: Purple (#4F00E8) on left, Red (#E60000) on right
 * - Top purple hanger hook + purple heart + purple ribbon bow + hanger shoulders
 * - Serif "S" in purple (#4F00E8) and "N" in red (#E60000)
 * - Script "Store" in purple with red outlined heart + red underline swoosh
 * - "FASHION • STYLE • TREND" with red dots & bottom red heart flanked by purple lines
 */
export const SnLogo: React.FC<SnLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const dimensions = {
    sm: { badge: 42, title: 'text-base', script: 'text-lg', tag: 'text-[9px]' },
    md: { badge: 52, title: 'text-xl', script: 'text-2xl', tag: 'text-[10px]' },
    lg: { badge: 68, title: 'text-2xl', script: 'text-3xl', tag: 'text-xs' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {/* Official SN STORE Circular Emblem SVG */}
      <svg
        width={dimensions.badge}
        height={dimensions.badge}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 rounded-full bg-white shadow-2xs"
        aria-label="SN Store Official Logo"
      >
        <defs>
          <linearGradient id="snSplitRing" x1="0" y1="100" x2="200" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4A00E0" />
            <stop offset="48%" stopColor="#4A00E0" />
            <stop offset="55%" stopColor="#E60000" />
            <stop offset="100%" stopColor="#E60000" />
          </linearGradient>
        </defs>

        {/* White circular background */}
        <circle cx="100" cy="106" r="86" fill="#FFFFFF" />

        {/* Outer & Inner Double Split Ring (with top gap for hanger hook) */}
        <path
          d="M 88 23 A 84 84 0 1 0 112 23"
          stroke="url(#snSplitRing)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 88 28 A 79 79 0 1 0 112 28"
          stroke="url(#snSplitRing)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Hanger Hook at Top */}
        <path
          d="M 94 20 C 94 9, 109 9, 109 19 C 109 25, 100 26, 100 31"
          stroke="#4A00E0"
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Purple Heart below Hook */}
        <path
          d="M 100 42 C 100 42, 91 36, 91 31 C 91 28, 94 26, 96.5 26 C 98.2 26, 99.4 27, 100 28.5 C 100.6 27, 101.8 26, 103.5 26 C 106 26, 109 28, 109 31 C 109 36, 100 42, 100 42 Z"
          fill="#4A00E0"
        />

        {/* Hanger Arms */}
        <path
          d="M 94 45 L 58 60 C 55 61.5, 55 64, 57 65"
          stroke="#5B00FF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 106 45 L 142 60 C 145 61.5, 145 64, 143 65"
          stroke="#5B00FF"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Purple Ribbon Bow + Tails */}
        <path
          d="M 97 44 C 86 38, 78 40, 79 47 C 80 52, 90 50, 97 47 Z"
          fill="#5B00FF"
        />
        <path
          d="M 103 44 C 114 38, 122 40, 121 47 C 120 52, 110 50, 103 47 Z"
          fill="#5B00FF"
        />
        <rect x="97" y="43" width="6" height="5.5" rx="1.5" fill="#4A00E0" stroke="#FFFFFF" strokeWidth="0.8" />
        {/* Ribbon Tails */}
        <path d="M 97 48 L 86 62 L 91 61 L 94 65 L 99 50 Z" fill="#5B00FF" />
        <path d="M 103 48 L 114 62 L 109 61 L 106 65 L 101 50 Z" fill="#5B00FF" />

        {/* Large Serif "S" (Purple) and "N" (Red) */}
        <text
          x="72"
          y="125"
          textAnchor="middle"
          fill="#5200FF"
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontWeight="700"
          fontSize="82"
        >
          S
        </text>
        <text
          x="128"
          y="125"
          textAnchor="middle"
          fill="#E60000"
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontWeight="700"
          fontSize="82"
        >
          N
        </text>

        {/* Script "Store" in Purple */}
        <text
          x="95"
          y="153"
          textAnchor="middle"
          fill="#4A00E0"
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize="36"
        >
          Store
        </text>

        {/* Red Outlined Heart after "Store" */}
        <path
          d="M 142 145 C 142 145, 136 140, 136 136.5 C 136 134.5, 137.5 133, 139.2 133 C 140.5 133, 141.5 133.8, 142 135 C 142.5 133.8, 143.5 133, 144.8 133 C 146.5 133, 148 134.5, 148 136.5 C 148 140, 142 145, 142 145 Z"
          stroke="#E60000"
          strokeWidth="2.2"
          fill="none"
        />

        {/* Red Swoosh Underline below "Store" */}
        <path
          d="M 86 160 Q 116 152 145 156"
          stroke="#E60000"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* FASHION • STYLE • TREND */}
        <text
          x="100"
          y="170"
          textAnchor="middle"
          fill="#4A00E0"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="7.2"
          letterSpacing="1.6"
        >
          FASHION • STYLE • TREND
        </text>

        {/* Bottom Horizontal Lines & Red Heart */}
        <line x1="68" y1="177" x2="93" y2="177" stroke="#4A00E0" strokeWidth="1.2" />
        <path
          d="M 100 181 C 100 181, 96.5 178, 96.5 176 C 96.5 174.8, 97.4 174, 98.4 174 C 99.1 174, 99.7 174.4, 100 175.1 C 100.3 174.4, 100.9 174, 101.6 174 C 102.6 174, 103.5 174.8, 103.5 176 C 103.5 178, 100 181, 100 181 Z"
          fill="#E60000"
        />
        <line x1="107" y1="177" x2="132" y2="177" stroke="#4A00E0" strokeWidth="1.2" />
      </svg>

      {/* Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className={`font-bold tracking-tight text-[#5200FF] ${dimensions.title}`}>
            S
          </span>
          <span className={`font-bold tracking-tight text-[#E60000] -ml-1 ${dimensions.title}`}>
            N
          </span>
          <span
            className={`font-display-serif italic font-semibold text-[#4A00E0] ml-0.5 ${dimensions.script}`}
          >
            Store
          </span>
          <span className="text-[#E60000] text-xs leading-none" aria-hidden="true">
            ♡
          </span>
        </div>
        {showTagline && (
          <span
            className={`font-semibold tracking-[0.16em] text-[#4A00E0] mt-0.5 ${dimensions.tag}`}
          >
            FASHION <span className="text-[#E60000]">•</span> STYLE{' '}
            <span className="text-[#E60000]">•</span> TREND
          </span>
        )}
      </div>
    </div>
  );
};

