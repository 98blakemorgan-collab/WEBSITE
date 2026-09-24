import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Archive() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shows?status=past").then((r) => { setShows(r.data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p className="eyebrow mb-4">Production archive</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">Our past shows</h1>
      <p className="mt-4 text-amber-50/70 max-w-xl">Seven decades of community theatre — a look back at the productions that have graced our stage.</p>

      {loading ? (
        <p className="mt-16 text-amber-50/50">Loading archive…</p>
      ) : shows.length === 0 ? (
        <p className="mt-16 text-amber-50/50">Our archive is being compiled — check back soon.</p>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shows.map((s) => (
            <Link key={s.id} to={`/shows/${s.id}`} data-testid={`archive-card-${s.id}`}
              className="group rounded-2xl overflow-hidden bg-[#6B0F0F] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-all flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img src={s.poster_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#6B0F0F] to-transparent" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#3D0000]/80 text-[10px] font-mono tracking-wider uppercase text-[#D4AF37]">{s.genre}</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-serif text-2xl text-amber-50 leading-tight">{s.title}</h3>
                <p className="mt-1 text-sm text-[#D4AF37]/90 italic font-serif">{s.tagline}</p>
                {s.director && <p className="mt-3 text-xs font-mono text-amber-50/50">Directed by {s.director}</p>}
                <span className="mt-auto pt-5 text-sm text-[#D4AF37] inline-flex items-center">View production <ArrowRight className="w-4 h-4 ml-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
