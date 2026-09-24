import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  useEffect(() => { api.get("/sponsors").then((r) => setSponsors(r.data)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <p className="eyebrow mb-4">Our supporters</p>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">Helping local theatre thrive.</h1>
      <p className="mt-4 text-amber-50/70 max-w-2xl">Sponsors help put stories on stage, develop local talent and keep community theatre accessible to everyone in the Great Southern.</p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sponsors.map((s) => (
          <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="p-6 rounded-2xl bg-[#181316] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 text-center flex flex-col items-center justify-center min-h-[210px] transition-colors" data-testid={`sponsor-${s.name}`}>
            <div className="w-full h-24 rounded-lg bg-[#FAF7F2] flex items-center justify-center p-3 mb-4">
              <img src={s.logo} alt={s.name} className="max-w-full max-h-full object-contain" />
            </div>
            <p className="font-serif text-base text-amber-50 leading-tight">{s.name}</p>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/70">{s.tier}</p>
          </a>
        ))}
      </div>

      <div className="mt-16 p-10 rounded-2xl bg-gradient-to-br from-[#241D21] to-[#181316] border border-[#D4AF37]/25 text-center">
        <h2 className="font-serif text-3xl text-amber-50">Put your business in the spotlight.</h2>
        <p className="mt-3 text-amber-50/65 max-w-xl mx-auto">Support local arts and connect with audiences across the Great Southern.</p>
        <Button asChild className="mt-6 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-950 font-semibold px-8" data-testid="become-sponsor-btn">
          <Link to="/contact">Become a sponsor</Link>
        </Button>
      </div>
    </div>
  );
}
