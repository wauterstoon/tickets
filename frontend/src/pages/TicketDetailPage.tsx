import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { API_URL, getErrorMessage, priorityLabels, priorityTone, statusLabels, statusTone } from "../lib/api";
import { ActivityLog, Message, Ticket } from "../lib/types";
import { io, Socket } from "socket.io-client";
import { useToast } from "../components/ToastProvider";

let socket: Socket | null = null;

export default function TicketDetailPage() {
  const { number } = useParams();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loadTicket = async () => {
    if (!email || !number) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${number}?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) {
        notify("Ticket niet gevonden of geen toegang.", "error");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setTicket(data);
    } catch (error) {
      notify(
        `Backend niet bereikbaar. Start de backend op poort 4000. (${getErrorMessage(error)})`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!email || !number) return;
    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${number}/messages?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      notify(
        `Berichten laden mislukt. Backend offline? (${getErrorMessage(error)})`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (!number) return;
    socket = io(API_URL);
    socket.emit("join", Number(number));
    socket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });
    return () => {
      socket?.disconnect();
    };
  }, [number]);

  const handleSendMessage = async () => {
    if (!newMessage || !email || !number) return;
    try {
      const response = await fetch(`${API_URL}/api/tickets/${number}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, content: newMessage })
      });
      if (response.ok) {
        setNewMessage("");
      } else {
        notify("Bericht verzenden mislukt.", "error");
      }
    } catch (error) {
      notify(
        `Bericht verzenden mislukt. Backend offline? (${getErrorMessage(error)})`,
        "error"
      );
    }
  };

  const timeline = useMemo(() => {
    if (!ticket) return [] as ActivityLog[];
    return [...ticket.activityLogs].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [ticket]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Input
            label="E-mailadres"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            hint="Gebruik hetzelfde e-mailadres als bij het ticket."
          />
          <Button type="button" onClick={() => void loadTicket().then(loadMessages)}>
            {loading ? "Laden..." : "Ticket ophalen"}
          </Button>
        </div>
      </Card>

      {!ticket ? (
        <Card>
          <p className="text-sm text-slate-500">Vul je e-mailadres in om dit ticket te bekijken.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Ticket #{ticket.number}
                  </p>
                  <h1 className="text-2xl font-semibold text-slate-900">{ticket.title}</h1>
                  <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge label={statusLabels[ticket.status]} tone={statusTone[ticket.status]} />
                  <Badge
                    label={priorityLabels[ticket.priority]}
                    tone={priorityTone[ticket.priority]}
                  />
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">TeamViewer ID</p>
                  <p className="text-sm text-slate-700">{ticket.teamviewerId}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Wachtwoord</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-700">
                      {showPassword ? ticket.teamviewerPassword : "••••••"}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-600"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Verberg" : "Toon"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Chat</h2>
              <div className="mt-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500">Nog geen berichten.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          message.senderRole === "USER"
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <p className="text-xs opacity-70">
                          {message.senderRole === "USER" ? "Jij" : "IT"} •{" "}
                          {new Date(message.createdAt).toLocaleString("nl-BE")}
                        </p>
                        <p className="mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Typ een bericht..."
                />
                <Button type="button" onClick={() => void handleSendMessage()}>
                  Verzenden
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold">Details</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">Aanvrager:</span> {ticket.requester.name}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Toegewezen:</span>{" "}
                  {ticket.assignedTo ? `${ticket.assignedTo.name} (${ticket.assignedTo.email})` : "Nog niet"}
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold">Bijlagen</h3>
              {ticket.attachments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Geen bijlagen.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`${API_URL}${attachment.path}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                    >
                      {attachment.originalName}
                    </a>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold">Tijdlijn</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                {timeline.length === 0 ? (
                  <p>Geen activiteiten.</p>
                ) : (
                  timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 px-3 py-2">
                      <p className="font-medium text-slate-700">{item.type}</p>
                      <p>{new Date(item.createdAt).toLocaleString("nl-BE")}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
