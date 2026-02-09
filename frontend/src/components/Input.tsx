import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        className={clsx(
          "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200",
          error && "border-rose-400",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-500">{error}</span> : hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
