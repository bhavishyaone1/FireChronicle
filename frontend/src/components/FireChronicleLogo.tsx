import React from "react";

interface FireChronicleLogoProps {
  className?: string;
  size?: number;
}

export const FireChronicleLogo: React.FC<FireChronicleLogoProps> = ({
  className = "w-6 h-6",
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="FireChronicle Flame Logo"
    >
      <defs>
        <linearGradient id="fc-flame-outer" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFAA00" />
          <stop offset="40%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#D91E00" />
        </linearGradient>
        <linearGradient id="fc-flame-inner" x1="16" y1="12" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="50%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FF4400" />
        </linearGradient>
        <linearGradient id="fc-flame-core" x1="16" y1="18" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFDE59" />
          <stop offset="100%" stopColor="#FF9100" />
        </linearGradient>
        <filter id="fc-flame-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="16" cy="18" r="10" fill="#FF5500" opacity="0.25" filter="url(#fc-flame-glow)" />

      {/* Main Outer Flame Silhouette */}
      <path
        d="M16 2C16 2 21 8.5 21 14.5C21 16.2 20.4 17.7 19.5 19C19.8 17.5 19.4 15.8 18.2 14.6C18.2 14.6 18.5 17.5 17 19.5C16.2 17.2 14.5 15.5 14.5 13C14.5 13 11 16 11 20C11 20.8 11.2 21.6 11.6 22.3C9.4 20.5 8 17.7 8 14.5C8 8.5 16 2 16 2Z"
        fill="url(#fc-flame-outer)"
      />

      {/* Lower full body curve */}
      <path
        d="M16 3C16 3 24 10.5 24 18.5C24 23.5 19.8 28 16 28C12.2 28 8 23.5 8 18.5C8 14.5 10.5 10.5 13.5 7.5C13 10.5 14.2 13.5 16.5 15C16 12 17 9 19.5 7C17.5 10 18.5 13.5 20.5 15.5C21.5 16.8 22 18.5 22 20C22 23.3 19.3 26 16 26C12.7 26 10 23.3 10 20C10 17.5 11.5 15.2 13 13.8C12.5 15.8 13.5 18 15 19C14.5 17.5 15 16 16 15C16.8 17 18.5 18.5 18.5 21C18.5 22.4 17.4 23.5 16 23.5C14.6 23.5 13.5 22.4 13.5 21C13.5 19.5 14.8 18.2 16 17C16 17 16 3 16 3Z"
        fill="url(#fc-flame-outer)"
      />

      {/* Inner Active Hotspot Flame */}
      <path
        d="M16 12C16 12 20 17 20 21C20 23.8 17.8 26 16 26C14.2 26 12 23.8 12 21C12 18 14.2 15 16 12Z"
        fill="url(#fc-flame-inner)"
      />

      {/* Core Intense White-Yellow Kernel */}
      <path
        d="M16 18C16 18 18 20.8 18 22.5C18 24 16.9 25 16 25C15.1 25 14 24 14 22.5C14 20.8 16 18 16 18Z"
        fill="url(#fc-flame-core)"
      />
    </svg>
  );
};
