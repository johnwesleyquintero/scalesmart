'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, useCallback, useState } from 'react';
import styles from './logo.module.css';

interface LogoProps extends HTMLAttributes<SVGElement> {
  className?: string;
}

export default function Logo({ className, ...props }: Readonly<LogoProps>) {
  const [isHovered, setIsHovered] = useState(false);

  const handleInteraction = useCallback((active: boolean) => {
    setIsHovered(active);
  }, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      className={cn(className, styles.logo, isHovered && styles.hovered)}
      onMouseEnter={() => {
        handleInteraction(true);
      }}
      onMouseLeave={() => {
        handleInteraction(false);
      }}
      onFocus={() => {
        handleInteraction(true);
      }}
      onBlur={() => {
        handleInteraction(false);
      }}
      tabIndex={0}
      {...props}
    >
      <defs>
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3245ff">
            <animate
              attributeName="stop-color"
              values="#3245ff; #bc52ee; #3245ff"
              dur="5s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#bc52ee">
            <animate
              attributeName="stop-color"
              values="#bc52ee; #3245ff; #bc52ee"
              dur="5s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
        <filter id="shadow" x="-40%" y="-40%" width="200%" height="200%">
          <feDropShadow
            dx="2"
            dy="2"
            stdDeviation="2"
            floodColor="rgba(0,0,0,0.3)"
          />
        </filter>
      </defs>

      <path
        fill="url(#mainGradient)"
        d="M20 5L35 35H5L20 5Z"
        className={styles.logoMark}
        filter="url(#shadow)"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        d="M25 15l10 15-15-10-10 15"
        className={styles.dynamicLine}
      >
        <animate
          attributeName="stroke-dasharray"
          values="0, 100; 100, 0"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
