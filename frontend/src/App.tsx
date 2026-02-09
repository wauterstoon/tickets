import { Routes, Route, Link, NavLink, Outlet } from "react-router-dom";
import CreateTicketPage from "./pages/CreateTicketPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import ItDashboardPage from "./pages/ItDashboardPage";
import ItTicketDetailPage from "./pages/ItTicketDetailPage";

function UserLayout() {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/create" className="text-lg font-semibold text-slate-900">
            IT Support Ticket System
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-slate-500">
            <NavLink
              to="/create"
              className={({ isActive }) => (isActive ? "text-brand-600" : "hover:text-slate-700")}
            >
              Ticket aanmaken
            </NavLink>
            <NavLink
              to="/my-tickets"
              className={({ isActive }) => (isActive ? "text-brand-600" : "hover:text-slate-700")}
            >
              Mijn tickets
            </NavLink>
            <NavLink
              to="/it"
              className={({ isActive }) => (isActive ? "text-brand-600" : "hover:text-slate-700")}
            >
              IT dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/create" element={<CreateTicketPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/ticket/:number" element={<TicketDetailPage />} />
        </Route>
        <Route path="/it" element={<ItDashboardPage />} />
        <Route path="/it/ticket/:number" element={<ItTicketDetailPage />} />
        <Route path="*" element={<CreateTicketPage />} />
      </Routes>
    </div>
  );
}
