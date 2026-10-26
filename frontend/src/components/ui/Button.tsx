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
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090B0F] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

    const sizeClasses = {
      sm: "h-7 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-xs gap-2",
      lg: "h-10 px-4 text-sm gap-2",
    };

    const variantClasses = {
      primary:
        "bg-[#F59E0B] text-black font-semibold hover:bg-[#d97706] active:bg-[#b45309] shadow-sm",
      secondary:
        "bg-[#151A22] text-[#F1F5F9] border border-[#28313D] hover:bg-[#1E242E] hover:border-[#383F4A] active:bg-[#10141B]",
      subtle:
        "bg-transparent text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22] active:bg-[#10141B]",
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
