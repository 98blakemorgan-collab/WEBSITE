import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DollarSign, Users, Drama, Lightbulb, Ticket, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const cards = [
  { key: "revenue", label: "Ticket Revenue", icon: DollarSign, fmt: (v) => `$${Number(v).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`, color: "#D4AF37" },
  { key: "tickets_sold", label: "Tickets Sold", icon: Ticket, fmt: (v) => v, color: "#8B1E26" },
  { key: "members", label: "Members", icon: Users, fmt: (v) => v, color: "#D4AF37" },
  { key: "upcoming_shows", label: "Upcoming Shows", icon: Drama, fmt: (v) => v, color: "#8B1E26" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);

  if (!stats) return <p className="text-amber-50/50">Loading dashboard…</p>;

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-serif text-3xl text-amber-50 mb-1">Overview</h1>
      <p className="text-amber-50/50 mb-8">A snapshot of the season at a glance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.key} className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15" data-testid={`stat-${c.key}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-50/50">{c.label}</span>
              <c.icon className="w-5 h-5" style={{ color: c.color }} />
            </div>
            <p className="font-serif text-3xl text-amber-50">{c.fmt(stats[c.key])}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15">
          <h3 className="font-serif text-xl text-amber-50 mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#D4AF37]" /> Revenue by Production</h3>
          {stats.revenue_by_show?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.revenue_by_show}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4AF3722" vertical={false} />
                <XAxis dataKey="show" tick={{ fill: "#A399A2", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#A399A2", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#241D21", border: "1px solid #D4AF3744", borderRadius: 8, color: "#fdf6e3" }} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="revenue" fill="#8B1E26" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-amber-50/40 text-sm">No sales yet — revenue will appear here as tickets sell.</div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15">
          <h3 className="font-serif text-xl text-amber-50 mb-6 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-[#D4AF37]" /> Technical</h3>
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-[#D4AF37]/10">
              <span className="text-sm text-amber-50/60">Lighting fixtures</span>
              <span className="font-serif text-2xl text-amber-50">{stats.fixtures}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[#D4AF37]/10">
              <span className="text-sm text-amber-50/60">In service</span>
              <span className="font-serif text-2xl text-emerald-400">{stats.fixtures_in_service}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-amber-50/60">Active members</span>
              <span className="font-serif text-2xl text-[#D4AF37]">{stats.active_members}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
