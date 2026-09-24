import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, BadgeCheck, Calendar, QrCode } from "lucide-react";

function statusColor(s) {
  return { active: "text-emerald-400", pending: "text-[#D4AF37]", none: "text-amber-50/40", expired: "text-red-400" }[s] || "text-amber-50/60";
}

export default function Portal() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => { api.get("/tickets/my").then((r) => setTickets(r.data)); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="eyebrow mb-3">Member portal</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-amber-50">Hello, {user?.name?.split(" ")[0]}.</h1>
      <p className="mt-3 text-amber-50/60">Manage your tickets and membership with Plantagenet Players.</p>

      <Tabs defaultValue="tickets" className="mt-10">
        <TabsList className="bg-[#181316] border border-[#D4AF37]/15">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-[#8B1E26] data-[state=active]:text-amber-50" data-testid="tab-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="membership" className="data-[state=active]:bg-[#8B1E26] data-[state=active]:text-amber-50" data-testid="tab-membership">My Membership</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-8">
          {tickets.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#181316] border border-[#D4AF37]/15 text-center" data-testid="no-tickets">
              <Ticket className="w-10 h-10 text-[#D4AF37]/50 mx-auto mb-4" />
              <p className="text-amber-50/60">You don't have any tickets yet.</p>
              <Button asChild className="mt-5 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50"><Link to="/shows">Browse shows</Link></Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl bg-gradient-to-br from-[#241D21] to-[#181316] border border-[#D4AF37]/25 overflow-hidden" data-testid={`ticket-${t.id}`}>
                  <div className="p-6 flex justify-between items-start">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4AF37]/70">Admit One · {t.tier_name}</p>
                      <h3 className="font-serif text-2xl text-amber-50 mt-1">{t.show_title}</h3>
                      <p className="mt-2 text-sm text-amber-50/60 font-mono">Ticket {t.code}</p>
                    </div>
                    <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-950" />
                    </div>
                  </div>
                  <div className="px-6 py-3 border-t border-dashed border-[#D4AF37]/25 flex justify-between text-xs font-mono text-amber-50/50">
                    <span>Plantagenet Hall</span>
                    <span>${Number(t.unit_price).toFixed(2)} AUD</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="membership" className="mt-8">
          <div className="p-8 rounded-2xl bg-[#181316] border border-[#D4AF37]/15 max-w-xl" data-testid="membership-card">
            <div className="flex items-center gap-3 mb-6">
              <BadgeCheck className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <h3 className="font-serif text-2xl text-amber-50">Membership</h3>
                <p className={`text-sm font-mono uppercase tracking-wider ${statusColor(user?.membership_status)}`}>{user?.membership_status || "none"}</p>
              </div>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#D4AF37]/10 pb-3"><dt className="text-amber-50/50">Type</dt><dd className="text-amber-50">{user?.membership_type || "—"}</dd></div>
              <div className="flex justify-between border-b border-[#D4AF37]/10 pb-3"><dt className="text-amber-50/50">Interests</dt><dd className="text-amber-50 text-right">{user?.interests?.length ? user.interests.join(", ") : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-amber-50/50 flex items-center gap-2"><Calendar className="w-4 h-4" />Renews</dt><dd className="text-amber-50">{user?.membership_expiry || "—"}</dd></div>
            </dl>
            {(!user?.membership_status || user.membership_status === "none") && (
              <Button asChild className="w-full mt-7 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50"><Link to="/membership">Apply for membership</Link></Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
