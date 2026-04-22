import React from "react";

interface LargeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const LargeButton: React.FC<LargeButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  fullWidth = true,
  className = "",
}) => {
  const baseClass = "btn-large";
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};