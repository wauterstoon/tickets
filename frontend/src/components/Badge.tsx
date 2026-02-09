import clsx from "clsx";

interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const toneStyles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-brand-100 text-brand-700"
  };

  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneStyles[tone])}>
      {label}
    </span>
  );
}
