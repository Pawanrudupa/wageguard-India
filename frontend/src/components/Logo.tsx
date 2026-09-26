/**
 * Standalone neo-brutalist Balance Mark logo representing legal balance,
 * statutory worker rights, and empirical wage protection.
 *
 * Uses strict design tokens:
 * - Central post, crossbar, and stepped base: var(--ink, #111111)
 * - Left pan (wages / worker dues): var(--accent, #D9A404)
 * - Right pan (statutory rights / legal trust): var(--trust, #22304A)
 */

import React from "react";

interface LogoProps {
  size?: number | string;
  className?: string;
  ariaLabel?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  className = "",
  ariaLabel = "WageGuard India Balance Mark",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Stepped Sturdy Base */}
      <rect x="10" y="54" width="44" height="6" fill="var(--ink, #111111)" />
      <rect x="18" y="49" width="28" height="5" fill="var(--ink, #111111)" />

      {/* Central Vertical Pillar Post */}
      <rect x="29" y="13" width="6" height="36" fill="var(--ink, #111111)" />

      {/* Horizontal Crossbar Beam */}
      <rect x="6" y="13" width="52" height="5" fill="var(--ink, #111111)" />

      {/* Fulcrum Top Apex */}
      <polygon points="32,5 27,13 37,13" fill="var(--ink, #111111)" />

      {/* Left Hanger Rod */}
      <rect x="14.5" y="18" width="3" height="12" fill="var(--ink, #111111)" />

      {/* Left Pan: Turmeric Gold (#D9A404) */}
      <polygon
        points="6,30 26,30 23,42 9,42"
        fill="var(--accent, #D9A404)"
        stroke="var(--ink, #111111)"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />

      {/* Right Hanger Rod */}
      <rect x="46.5" y="18" width="3" height="12" fill="var(--ink, #111111)" />

      {/* Right Pan: Deep Indigo (#22304A) */}
      <polygon
        points="38,30 58,30 55,42 41,42"
        fill="var(--trust, #22304A)"
        stroke="var(--ink, #111111)"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
    </svg>
  );
};
