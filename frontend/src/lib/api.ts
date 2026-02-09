export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Onbekende fout";
};

export const statusLabels: Record<string, string> = {
  AANGEVRAAGD: "Aangevraagd",
  IN_BEHANDELING: "In behandeling",
  OPGELOST: "Opgelost"
};

export const priorityLabels: Record<string, string> = {
  LOW: "Laag",
  NORMAL: "Normaal",
  HIGH: "Hoog",
  URGENT: "Dringend"
};

export const statusTone: Record<string, "neutral" | "warning" | "success"> = {
  AANGEVRAAGD: "warning",
  IN_BEHANDELING: "neutral",
  OPGELOST: "success"
};

export const priorityTone: Record<string, "neutral" | "warning" | "danger"> = {
  LOW: "neutral",
  NORMAL: "warning",
  HIGH: "danger",
  URGENT: "danger"
};
