import React from "react";

interface FireChronicleLogoProps {
  className?: string;
  size?: number;
}

export const FireChronicleLogo: React.FC<FireChronicleLogoProps> = ({
  className = "w-5 h-5",
  size = 20,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="FireChronicle Geometric Thermal Mark"
    >
      {/* Outer ambient thermal hull */}
      <path
        d="M12 2C12 2 6 9.5 6 15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15C18 9.5 12 2 12 2Z"
        fill="url(#fc-glow-grad)"
        fillOpacity="0.15"
      />

      {/* Primary Left Facet (Ember Amber) */}
      <path
        d="M12 3.5C12 3.5 7.5 10 7.5 15C7.5 17.4853 9.51472 19.5 12 19.5V3.5Z"
        fill="#F5B32F"
      />

      {/* Primary Right Facet (Thermal Orange) */}
      <path
        d="M12 3.5C12 3.5 16.5 10 16.5 15C16.5 17.4853 14.4853 19.5 12 19.5V3.5Z"
        fill="#F47A24"
      />

      {/* Inner Thermal Core (Peak Infrared Node) */}
      <path
        d="M12 11C12 11 9.5 14 9.5 16C9.5 17.3807 10.6193 18.5 12 18.5C13.3807 18.5 14.5 17.3807 14.5 16C14.5 14 12 11 12 11Z"
        fill="#FFD166"
      />

      <defs>
        <radialGradient
          id="fc-glow-grad"
          cx="0.5"
          cy="0.6"
          r="0.5"
          fx="0.5"
          fy="0.6"
        >
          <stop offset="0%" stopColor="#F5B32F" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F47A24" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
