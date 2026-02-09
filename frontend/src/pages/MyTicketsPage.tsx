import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { API_URL, statusLabels, statusTone, priorityLabels, priorityTone } from "../lib/api";
import { Ticket } from "../lib/types";
import { Link } from "react-router-dom";

export default function MyTicketsPage() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    if (!email) return;
    setLoading(true);
    const response = await fetch(`${API_URL}/api/tickets/my?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    if (email) void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Input
            label="E-mailadres"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            hint="Gebruik hetzelfde e-mailadres als bij het aanmaken."
          />
          <Button type="button" onClick={() => void loadTickets()}>
            {loading ? "Laden..." : "Tickets ophalen"}
          </Button>
        </div>
      </Card>

      {tickets.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Nog geen tickets gevonden.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Ticket #{ticket.number}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge label={statusLabels[ticket.status]} tone={statusTone[ticket.status]} />
                  <Badge label={priorityLabels[ticket.priority]} tone={priorityTone[ticket.priority]} />
                </div>
                <div className="text-sm text-slate-500">
                  <p>Toegewezen: {ticket.assignedTo ? ticket.assignedTo.name : "Nog niet"}</p>
                  <Link className="mt-2 inline-flex text-brand-600" to={`/ticket/${ticket.number}`}>
                    Ticket bekijken →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
