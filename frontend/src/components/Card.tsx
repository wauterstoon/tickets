import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("rounded-2xl bg-white p-6 shadow-soft", className)}>
      {children}
    </div>
  );
}
