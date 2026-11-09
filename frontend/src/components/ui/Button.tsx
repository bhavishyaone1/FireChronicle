"use client";

import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B32F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090B] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

    const sizeClasses = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-xs gap-2",
      lg: "h-10 px-4 text-sm gap-2",
    };

    const variantClasses = {
      primary:
        "bg-[#F5B32F] text-[#08090B] font-semibold hover:bg-[#F47A24] hover:text-[#08090B] active:bg-[#e06915] shadow-sm",
      secondary:
        "bg-[#171A20] text-[#F4F5F7] border border-[#2A3039] hover:bg-[#1D222A] hover:border-[#3A4350] active:bg-[#101216]",
      subtle:
        "bg-transparent text-[#B1B7C1] hover:text-[#F4F5F7] hover:bg-[#171A20] active:bg-[#101216]",
      destructive:
        "bg-[#8F2529]/40 text-[#F4F5F7] border border-[#E5484D]/50 hover:bg-[#8F2529]/60 active:bg-[#8F2529]/80",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
