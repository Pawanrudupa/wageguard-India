/**
 * Mechanical roll-up counter component animating numbers to target values smoothly.
 */

import React, { useEffect, useState, useRef } from "react";

interface OdometerCountProps {
  target: number;
  durationMs?: number;
  formatIndian?: boolean;
  className?: string;
}

export const OdometerCount: React.FC<OdometerCountProps> = ({
  target,
  durationMs = 500,
  formatIndian = true,
  className = "",
}) => {
  const [current, setCurrent] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // If user prefers reduced motion, jump straight to target
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            let startTime: number | null = null;

            const animate = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / durationMs, 1);
              // Ease-out cubic: fast launch, deceleration into final number
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const val = Math.floor(easeOut * target);
              setCurrent(val);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCurrent(target);
              }
            };

            requestAnimationFrame(animate);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    const el = elementRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [target, durationMs]);

  const displayString = formatIndian
    ? current.toLocaleString("en-IN")
    : current.toString();

  return (
    <span ref={elementRef} className={`font-mono ${className}`}>
      {displayString}
    </span>
  );
};
