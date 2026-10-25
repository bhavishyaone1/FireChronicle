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
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0C] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

    const sizeClasses = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-xs gap-2",
      lg: "h-10 px-4 text-sm gap-2",
    };

    const variantClasses = {
      primary:
        "bg-[#F59E0B] text-black font-semibold hover:bg-[#d97706] active:bg-[#b45309] shadow-sm",
      secondary:
        "bg-[#16191F] text-[#F3F4F6] border border-[#282D35] hover:bg-[#20252E] hover:border-[#383F4A] active:bg-[#121419]",
      subtle:
        "bg-transparent text-[#A4AAB5] hover:text-[#F3F4F6] hover:bg-[#16191F] active:bg-[#101216]",
      destructive:
        "bg-red-950/80 text-red-200 border border-red-800/60 hover:bg-red-900 active:bg-red-950",
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
