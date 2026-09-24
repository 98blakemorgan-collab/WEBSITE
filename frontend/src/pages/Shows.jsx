import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

const filters = [
  { key: "all", label: "All" },
  { key: "current", label: "Now Showing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past Productions" },
];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function Shows() {
  const [shows, setShows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shows").then((res) => { setShows(res.data); setLoading(false); });
  }, []);

  const visible = filter === "all" ? shows : shows.filter((s) => s.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p className="eyebrow mb-4">Take your seat</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">What's On</h1>
      <p className="mt-4 text-amber-50/70 max-w-xl">Local stories, big-hearted performances and a warm welcome at Plantagenet District Hall.</p>

      <div className="mt-10 flex flex-wrap gap-2" data-testid="shows-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            data-testid={`filter-${f.key}`}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
              filter === f.key
                ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                : "bg-transparent text-amber-50/70 border-[#D4AF37]/25 hover:border-[#D4AF37]/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-16 text-amber-50/50">Loading productions…</p>
      ) : visible.length === 0 ? (
        <p className="mt-16 text-amber-50/50">No productions in this category yet. Watch this space!</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((s) => {
            const from = Math.min(...(s.ticket_tiers?.map((t) => t.price) || [0]));
            return (
              <div key={s.id} className="group rounded-2xl overflow-hidden bg-[#6B0F0F] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-all flex flex-col" data-testid={`show-card-${s.id}`}>
                <div className="relative h-56 overflow-hidden">
                  <img src={s.poster_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6B0F0F] to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#550000]/80 text-[10px] font-mono tracking-wider uppercase text-[#D4AF37]">{s.genre}</span>
                  {s.status === "current" && <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#8B1E26] text-[10px] font-mono uppercase text-amber-50">Now Showing</span>}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-2xl text-amber-50 leading-tight">{s.title}</h3>
                  <p className="mt-1 text-sm text-[#D4AF37]/90 italic font-serif">{s.tagline}</p>
                  <div className="mt-4 space-y-1.5 text-xs text-amber-50/55 font-mono">
                    {s.performances?.[0] && <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{fmtDate(s.performances[0])}{s.performances.length > 1 ? ` +${s.performances.length - 1} more` : ""}</p>}
                    <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{s.venue}</p>
                  </div>
                  <div className="mt-5 pt-5 border-t border-[#D4AF37]/10 flex items-center justify-between mt-auto">
                    {s.status === "past" ? (
                      <span className="text-sm text-amber-50/40">Season closed</span>
                    ) : (
                      <span className="text-sm text-amber-50/70">From <span className="text-amber-50 font-semibold">${from.toFixed(0)}</span></span>
                    )}
                    <Button asChild size="sm" variant="ghost" className="text-[#D4AF37] hover:text-[#E5C158] hover:bg-[#D4AF37]/5" data-testid={`show-view-${s.id}`}>
                      <Link to={`/shows/${s.id}`}>{s.status === "past" ? "Details" : "Book"} <ArrowRight className="w-4 h-4 ml-1" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
