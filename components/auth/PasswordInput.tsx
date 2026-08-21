"use client";

import { useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeSlashIcon } from "@/components/icons/AuthIcons";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Class(es) for the outer wrapping <div>, not the <input> itself. */
  wrapperClassName?: string;
}

/**
 * Password field with a show/hide toggle — was previously hand-rolled
 * identically in login/page.tsx and forgot-password/page.tsx (and missing
 * entirely from signup/page.tsx, which just had a plain `type="password"`
 * input with no toggle). Centralizing it here means all three password
 * fields in the app behave and look the same, and a future change to the
 * toggle only has to happen once.
 */
export function PasswordInput({ wrapperClassName, className, ...inputProps }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <input {...inputProps} type={showPassword ? "text" : "password"} className={`${className ?? ""} pr-10`} />
      <button
        type="button"
        onClick={() => setShowPassword((visible) => !visible)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center rounded bg-transparent px-3 py-0 text-gray-400 shadow-none hover:bg-transparent hover:text-gray-600 focus:outline-none focus-visible:text-gray-600 focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
