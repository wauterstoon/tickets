import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import clsx from "clsx";

interface Toast {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
}

interface ToastContextValue {
  notify: (message: string, tone?: Toast["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "rounded-xl px-4 py-3 text-sm font-medium shadow-soft",
              toast.tone === "success" && "bg-emerald-600 text-white",
              toast.tone === "error" && "bg-rose-600 text-white",
              toast.tone === "info" && "bg-slate-900 text-white"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast moet binnen ToastProvider worden gebruikt");
  return context;
}
