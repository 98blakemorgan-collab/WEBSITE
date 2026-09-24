import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Ticket, LogOut, LayoutDashboard, User } from "lucide-react";

const links = [
  { to: "/shows", label: "What's On" },
  { to: "/our-story", label: "Our Story" },
  { to: "/membership", label: "Membership" },
  { to: "/sponsors", label: "Sponsors" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D0A0B]/85 backdrop-blur-xl border-b border-[#D4AF37]/15">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
          <span className="w-11 h-11 rounded-full bg-[#FAF7F2] p-1.5 flex items-center justify-center ring-1 ring-[#D4AF37]/40 group-hover:ring-[#D4AF37] transition-all">
            <img src="/pp-logo.png" alt="Plantagenet Players" className="w-full h-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg text-amber-50 tracking-tight">Plantagenet Players</span>
            <span className="block text-[10px] font-mono tracking-[0.25em] uppercase text-[#D4AF37]/70">Est. 1953 · Mount Barker</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  isActive ? "text-[#D4AF37]" : "text-amber-50/70 hover:text-amber-50"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {user && user !== false ? (
            <>
              {user.role === "admin" && (
                <Button asChild variant="ghost" className="text-amber-50/80 hover:text-amber-50 hover:bg-white/5" data-testid="nav-admin-btn">
                  <Link to="/admin"><LayoutDashboard className="w-4 h-4 mr-2" />Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="text-amber-50/80 hover:text-amber-50 hover:bg-white/5" data-testid="nav-portal-btn">
                <Link to="/portal"><User className="w-4 h-4 mr-2" />{user.name?.split(" ")[0] || "Portal"}</Link>
              </Button>
              <Button onClick={doLogout} variant="ghost" size="icon" className="text-amber-50/60 hover:text-amber-50" data-testid="nav-logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="text-amber-50/80 hover:text-amber-50 hover:bg-white/5" data-testid="nav-login-btn">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
          <Button asChild className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 px-5" data-testid="nav-book-btn">
            <Link to="/shows"><Ticket className="w-4 h-4 mr-2" />Book Tickets</Link>
          </Button>
        </div>

        <button className="lg:hidden text-amber-50" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-[#D4AF37]/15 bg-[#0D0A0B] px-4 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? "text-[#D4AF37] bg-white/5" : "text-amber-50/80"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            {user && user !== false ? (
              <>
                {user.role === "admin" && (
                  <Button asChild variant="outline" className="w-full border-[#D4AF37]/30 text-amber-50"><Link to="/admin" onClick={() => setOpen(false)}>Admin Dashboard</Link></Button>
                )}
                <Button asChild variant="outline" className="w-full border-[#D4AF37]/30 text-amber-50"><Link to="/portal" onClick={() => setOpen(false)}>My Portal</Link></Button>
                <Button onClick={() => { doLogout(); setOpen(false); }} variant="ghost" className="w-full text-amber-50/70">Sign Out</Button>
              </>
            ) : (
              <Button asChild variant="outline" className="w-full border-[#D4AF37]/30 text-amber-50"><Link to="/login" onClick={() => setOpen(false)}>Sign In</Link></Button>
            )}
            <Button asChild className="w-full rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50"><Link to="/shows" onClick={() => setOpen(false)}>Book Tickets</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
