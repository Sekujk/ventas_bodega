import React from "react";

  interface InputFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email" | "number" | "password";
  required?: boolean;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
}) => {
  return (
    <div>
      {label && <label className="label-text">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`input-large ${className}`}
      />
    </div>
  );
};