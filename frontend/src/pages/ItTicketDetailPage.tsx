import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { API_URL, priorityLabels, priorityTone, statusLabels, statusTone } from "../lib/api";
import { Message, Ticket, User } from "../lib/types";
import { io, Socket } from "socket.io-client";
import { useToast } from "../components/ToastProvider";

let socket: Socket | null = null;

export default function ItTicketDetailPage() {
  const { number } = useParams();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [note, setNote] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const loadTicket = async () => {
    if (!email || !number) return;
    const response = await fetch(`${API_URL}/api/it/tickets/${number}`, {
      headers: { "x-user-email": email }
    });
    if (!response.ok) {
      notify("Geen toegang tot dit ticket.", "error");
      return;
    }
    const data = await response.json();
    setTicket(data.ticket);
    setEngineers(data.engineers);
    setAssignedToId(data.ticket.assignedToId ?? "");
    setStatus(data.ticket.status);
  };

  const loadMessages = async () => {
    if (!email || !number) return;
    const response = await fetch(
      `${API_URL}/api/tickets/${number}/messages?email=${encodeURIComponent(email)}`
    );
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data);
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

  const handleUpdate = async () => {
    if (!number || !email) return;
    const response = await fetch(`${API_URL}/api/tickets/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-email": email },
      body: JSON.stringify({
        status,
        assignedToId: assignedToId || null,
        note: note || undefined,
        publicMessage: publicMessage || undefined
      })
    });
    if (!response.ok) {
      notify("Update mislukt.", "error");
      return;
    }
    notify("Ticket bijgewerkt.", "success");
    setNote("");
    setPublicMessage("");
    await loadTicket();
  };

  const handleSendMessage = async () => {
    if (!newMessage || !email || !number) return;
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
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/it" className="text-sm text-brand-600">
              ← Terug naar overzicht
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Ticket detail</h1>
          </div>
          <Input
            label="IT e-mailadres"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            hint="Verplicht voor toegang."
          />
          <Button type="button" onClick={() => void loadTicket().then(loadMessages)}>
            Ticket laden
          </Button>
        </div>

        {!ticket ? (
          <Card>
            <p className="text-sm text-slate-500">Selecteer een ticket en laad de gegevens.</p>
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
                    <h2 className="text-2xl font-semibold text-slate-900">{ticket.title}</h2>
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
                    <p className="text-xs uppercase tracking-wide text-slate-400">Aanvrager</p>
                    <p className="text-sm text-slate-700">{ticket.requester.name}</p>
                    <p className="text-xs text-slate-500">{ticket.requester.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">TeamViewer</p>
                    <p className="text-sm text-slate-700">ID: {ticket.teamviewerId}</p>
                    <p className="text-xs text-slate-500">Wachtwoord: ••••••</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold">Chat</h3>
                <div className="mt-4 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-500">Nog geen berichten.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderRole === "IT" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            message.senderRole === "IT"
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <p className="text-xs opacity-70">
                            {message.senderRole === "IT" ? "IT" : "Gebruiker"} •{" "}
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
                    placeholder="Typ een IT-bericht..."
                  />
                  <Button type="button" onClick={() => void handleSendMessage()}>
                    Verstuur
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold">Beheer</h3>
                <div className="mt-4 space-y-4">
                  <Select
                    label="Toewijzen aan"
                    value={assignedToId}
                    onChange={(event) => setAssignedToId(event.target.value)}
                  >
                    <option value="">Niet toegewezen</option>
                    {engineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Status wijzigen"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="AANGEVRAAGD">Aangevraagd</option>
                    <option value="IN_BEHANDELING">In behandeling</option>
                    <option value="OPGELOST">Opgelost</option>
                  </Select>
                  <Textarea
                    label="Interne notitie"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Alleen zichtbaar voor IT"
                  />
                  <Textarea
                    label="Publiek bericht"
                    value={publicMessage}
                    onChange={(event) => setPublicMessage(event.target.value)}
                    placeholder="Wordt zichtbaar voor de gebruiker"
                  />
                  <Button type="button" onClick={() => void handleUpdate()}>
                    Opslaan
                  </Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold">Bijlagen</h3>
                {ticket.attachments.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Geen bijlagen.</p>
                ) : (
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {ticket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`${API_URL}${attachment.path}`}
                        className="block rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {attachment.originalName}
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
