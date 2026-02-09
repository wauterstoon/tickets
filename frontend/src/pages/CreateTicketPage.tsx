import { useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { useToast } from "../components/ToastProvider";
import { API_URL } from "../lib/api";

interface AttachmentPreview {
  file: File;
  url?: string;
}

const priorityOptions = [
  { value: "LOW", label: "Laag" },
  { value: "NORMAL", label: "Normaal" },
  { value: "HIGH", label: "Hoog" },
  { value: "URGENT", label: "Dringend" }
];

export default function CreateTicketPage() {
  const { notify } = useToast();
  const [form, setForm] = useState({
    email: "",
    name: "",
    title: "",
    description: "",
    teamviewerId: "",
    teamviewerPassword: "",
    priority: "NORMAL"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const imagePreviews = useMemo(
    () => attachments.filter((item) => item.file.type.startsWith("image/")),
    [attachments]
  );

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 10);
    const previews = selected.map((file) => ({
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    }));
    setAttachments(previews);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.email.includes("@")) nextErrors.email = "Vul een geldig e-mailadres in.";
    if (!form.name) nextErrors.name = "Naam is verplicht.";
    if (!form.title) nextErrors.title = "Titel is verplicht.";
    if (!form.description) nextErrors.description = "Omschrijving is verplicht.";
    if (!form.teamviewerId) nextErrors.teamviewerId = "TeamViewer ID is verplicht.";
    if (!form.teamviewerPassword) nextErrors.teamviewerPassword = "Wachtwoord is verplicht.";
    if (!form.priority) nextErrors.priority = "Prioriteit is verplicht.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      notify("Controleer de verplichte velden.", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      attachments.forEach((item) => formData.append("attachments", item.file));

      const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Ticket aanmaken mislukt.");
      const data = await response.json();
      setTicketNumber(data.ticketNumber);
      notify("Ticket succesvol aangemaakt.", "success");
    } catch (error) {
      notify("Er ging iets mis bij het aanmaken.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (ticketNumber) {
    return (
      <Card className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-semibold">Bedankt! 🎉</h1>
        <p className="mt-3 text-slate-600">
          Je ticket is aangemaakt. Ons IT-team neemt snel contact met je op.
        </p>
        <div className="mt-6 rounded-2xl bg-brand-50 px-6 py-5">
          <p className="text-sm text-brand-700">Ticketnummer</p>
          <p className="mt-2 text-3xl font-semibold text-brand-700">#{ticketNumber}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold text-slate-900">Ticket aanmaken</h1>
          <p className="mt-2 text-sm text-slate-500">
            Beschrijf het probleem zo volledig mogelijk. Een IT-engineer neemt snel contact op.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="E-mailadres"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Naam"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              error={errors.name}
              required
            />
          </div>
          <div className="mt-4 grid gap-4">
            <Input
              label="Titel"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              error={errors.title}
              required
            />
            <Textarea
              label="Omschrijving"
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              error={errors.description}
              required
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">TeamViewer gegevens</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="TeamViewer ID"
              value={form.teamviewerId}
              onChange={(event) => handleChange("teamviewerId", event.target.value)}
              error={errors.teamviewerId}
              required
            />
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-medium">Wachtwoord</span>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.teamviewerPassword}
                  onChange={(event) => handleChange("teamviewerPassword", event.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  required
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Verberg" : "Toon"}
                </button>
              </div>
              {errors.teamviewerPassword && (
                <span className="text-xs text-rose-500">{errors.teamviewerPassword}</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Select
              label="Prioriteit"
              value={form.priority}
              onChange={(event) => handleChange("priority", event.target.value)}
              error={errors.priority}
              required
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Bijlagen</h2>
          <p className="mt-2 text-sm text-slate-500">
            Voeg tot 10 bestanden toe (png, jpg, webp, pdf). Optioneel.
          </p>
          <div className="mt-4">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
          {attachments.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {imagePreviews.map((item) => (
                  <img
                    key={item.file.name}
                    src={item.url}
                    alt={item.file.name}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {attachments
                  .filter((item) => !item.file.type.startsWith("image/"))
                  .map((item) => (
                    <div key={item.file.name} className="rounded-lg border border-slate-200 px-3 py-2">
                      {item.file.name}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Bezig met verzenden..." : "Ticket indienen"}
          </Button>
        </div>
      </form>

      <Card className="h-fit">
        <h2 className="text-lg font-semibold">Wat gebeurt er daarna?</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>• Je ontvangt onmiddellijk een ticketnummer.</li>
          <li>• Een IT-engineer bekijkt je aanvraag binnen 1 werkdag.</li>
          <li>• Je kunt de status volgen via “Mijn tickets”.</li>
        </ul>
        <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">
          Tip: voeg screenshots toe voor een snellere oplossing.
        </div>
      </Card>
    </div>
  );
}
