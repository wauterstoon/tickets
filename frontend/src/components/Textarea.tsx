import { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <textarea
        className={clsx(
          "min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200",
          error && "border-rose-400",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-500">{error}</span> : hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
