import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Drama, Users, Ticket, Mail, FileText, Images, LogOut, ExternalLink } from "lucide-react";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/shows", label: "Shows", icon: Drama },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/tickets", label: "Ticket Sales", icon: Ticket },
  { to: "/admin/email", label: "Bulk Email", icon: Mail },
  { to: "/admin/pages", label: "Edit Pages", icon: FileText },
  { to: "/admin/media", label: "Media Library", icon: Images },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#550000] flex">
      <aside className="w-64 shrink-0 border-r border-[#D4AF37]/15 bg-[#3D0000] hidden md:flex flex-col fixed h-full">
        <Link to="/" className="flex items-center gap-3 h-20 px-6 border-b border-[#D4AF37]/15">
          <span className="w-9 h-9 rounded-full bg-[#FAF7F2] p-1 flex items-center justify-center ring-1 ring-[#D4AF37]/40"><img src="/pp-logo.png" alt="Plantagenet Players" className="w-full h-full object-contain" /></span>
          <span className="font-serif text-amber-50">Admin</span>
        </Link>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`admin-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-[#8B1E26] text-amber-50" : "text-amber-50/60 hover:text-amber-50 hover:bg-white/5"}`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#D4AF37]/15 space-y-2">
          <Button asChild variant="ghost" className="w-full justify-start text-amber-50/60 hover:text-amber-50"><Link to="/"><ExternalLink className="w-4 h-4 mr-2" />View site</Link></Button>
          <Button onClick={() => { logout(); navigate("/"); }} variant="ghost" className="w-full justify-start text-amber-50/60 hover:text-amber-50" data-testid="admin-logout"><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64">
        {/* mobile top nav */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto p-3 border-b border-[#D4AF37]/15 bg-[#3D0000] sticky top-0 z-30">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium ${isActive ? "bg-[#8B1E26] text-amber-50" : "text-amber-50/60"}`}>{n.label}</NavLink>
          ))}
        </div>
        <div className="p-6 sm:p-10">
          <div className="flex justify-between items-center mb-8">
            <p className="text-sm text-amber-50/50">Signed in as <span className="text-[#D4AF37]">{user?.email}</span></p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
