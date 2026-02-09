import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { API_URL, getErrorMessage, priorityLabels, priorityTone, statusLabels, statusTone } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Ticket } from "../lib/types";

export default function ItDashboardPage() {
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assigned: "",
    sort: "newest"
  });
  const [search, setSearch] = useState("");

  const loadTickets = async () => {
    if (!email) return;
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.assigned) params.set("assigned", filters.assigned);
    if (filters.sort) params.set("sort", filters.sort);

    try {
      const response = await fetch(`${API_URL}/api/it/tickets?${params.toString()}`, {
        headers: { "x-user-email": email }
      });
      if (!response.ok) throw new Error("Tickets laden mislukt.");
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      setTickets([]);
      notify(
        `Backend niet bereikbaar of geen toegang. (${getErrorMessage(error)})`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (email) void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, email]);

  const filteredTickets = useMemo(() => {
    if (!search) return tickets;
    return tickets.filter((ticket) => ticket.number === Number(search));
  }, [tickets, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid lg:grid-cols-[280px,1fr]">
        <aside className="border-r border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">IT Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Beheer alle binnenkomende tickets.</p>
          <div className="mt-6 space-y-4">
            <Input
              label="IT e-mailadres"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              hint="Moet overeenkomen met IT_ADMIN_EMAILS."
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">Alle</option>
              <option value="AANGEVRAAGD">Aangevraagd</option>
              <option value="IN_BEHANDELING">In behandeling</option>
              <option value="OPGELOST">Opgelost</option>
            </Select>
            <Select
              label="Prioriteit"
              value={filters.priority}
              onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <option value="">Alle</option>
              <option value="LOW">Laag</option>
              <option value="NORMAL">Normaal</option>
              <option value="HIGH">Hoog</option>
              <option value="URGENT">Dringend</option>
            </Select>
            <Select
              label="Toewijzing"
              value={filters.assigned}
              onChange={(event) => setFilters((prev) => ({ ...prev, assigned: event.target.value }))}
            >
              <option value="">Alle</option>
              <option value="assigned">Toegewezen</option>
              <option value="unassigned">Niet toegewezen</option>
            </Select>
            <Select
              label="Sortering"
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            >
              <option value="newest">Nieuwste</option>
              <option value="oldest">Oudste</option>
              <option value="priority">Prioriteit</option>
            </Select>
            <Button type="button" onClick={() => void loadTickets()}>
              Filters toepassen
            </Button>
          </div>
        </aside>

        <main className="p-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Tickets overzicht</h1>
              <p className="text-sm text-slate-500">Zoek en beheer alle binnenkomende aanvragen.</p>
            </div>
            <Input
              label="Zoek ticketnummer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="bv. 123"
            />
          </div>

          {filteredTickets.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Geen tickets gevonden.</p>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="pb-3">#</th>
                      <th className="pb-3">Titel</th>
                      <th className="pb-3">Aanvrager</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Prioriteit</th>
                      <th className="pb-3">Toegewezen</th>
                      <th className="pb-3">Laatste update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="text-slate-600">
                        <td className="py-3 font-medium text-slate-800">#{ticket.number}</td>
                        <td className="py-3">
                          <Link
                            className="font-semibold text-brand-600"
                            to={`/it/ticket/${ticket.number}`}
                          >
                            {ticket.title}
                          </Link>
                        </td>
                        <td className="py-3">{ticket.requester.name}</td>
                        <td className="py-3">
                          <Badge
                            label={statusLabels[ticket.status]}
                            tone={statusTone[ticket.status]}
                          />
                        </td>
                        <td className="py-3">
                          <Badge
                            label={priorityLabels[ticket.priority]}
                            tone={priorityTone[ticket.priority]}
                          />
                        </td>
                        <td className="py-3">{ticket.assignedTo ? ticket.assignedTo.name : "-"}</td>
                        <td className="py-3">{new Date(ticket.updatedAt).toLocaleDateString("nl-BE")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
