import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Ticket, ArrowRight, Drama, Wrench, Users, HandHeart } from "lucide-react";

const HERO = "/venue/slide-4.jpg";

const roles = [
  { icon: Drama, title: "On Stage", desc: "Acting, singing, dancing and ensemble roles." },
  { icon: Wrench, title: "Backstage", desc: "Sets, props, costumes, stage crew and make-up." },
  { icon: Users, title: "Technical", desc: "Lighting, sound, projection and show operation." },
  { icon: HandHeart, title: "Front of House", desc: "Tickets, hospitality, publicity and welcome." },
];

export default function Home() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get("/shows").then((res) => {
      const list = res.data;
      setFeatured(list.find((s) => s.status === "current") || list.find((s) => s.status === "upcoming") || list[0]);
    });
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={HERO} alt="Stage" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0A0B] via-[#0D0A0B]/85 to-[#0D0A0B]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A0B] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-6">Community Theatre since 1953</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-amber-50 leading-[0.95] tracking-tight">
              Stories begin <span className="italic text-[#D4AF37]">here.</span>
            </h1>
            <p className="mt-7 text-lg text-amber-50/70 leading-relaxed max-w-xl">
              Community-made theatre in Mount Barker. Come for the show — stay for the people,
              the laughter and the magic behind the curtain.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 px-8 h-12" data-testid="hero-whatson-btn">
                <Link to="/shows"><Ticket className="w-5 h-5 mr-2" />What's On</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-[#D4AF37]/40 bg-transparent text-amber-50 hover:bg-[#D4AF37]/10 px-8 h-12" data-testid="hero-join-btn">
                <Link to="/membership">Find your place <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 gold-hairline animate-glow" />
      </section>

      {/* FEATURED SHOW */}
      {featured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 group">
              <img src={featured.poster_url} alt={featured.title} className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#8B1E26] text-amber-50 text-xs font-mono tracking-wider uppercase">
                {featured.status === "current" ? "Now Showing" : "Next Production"}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">Take your seat</p>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-amber-50 tracking-tight">{featured.title}</h2>
              <p className="mt-3 text-[#D4AF37] font-serif italic text-xl">{featured.tagline}</p>
              <p className="mt-6 text-amber-50/70 leading-relaxed">{featured.description}</p>
              <div className="mt-8">
                <Button asChild size="lg" className="rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-950 font-semibold px-8" data-testid="home-featured-book-btn">
                  <Link to={`/shows/${featured.id}`}>Book Tickets <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FIND YOUR PART */}
      <section className="relative py-20 sm:py-28 border-y border-[#D4AF37]/10 bg-[#0A0708]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Find your part</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-50">You don't have to act.</h2>
            <p className="mt-4 text-amber-50/70">Theatre needs all kinds of people. Experience is welcome; curiosity is enough.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r) => (
              <div key={r.title} className="p-7 rounded-2xl bg-[#181316] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-colors">
                <r.icon className="w-8 h-8 text-[#D4AF37] mb-5" />
                <h3 className="font-serif text-xl text-amber-50">{r.title}</h3>
                <p className="mt-2 text-sm text-amber-50/60 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Button asChild variant="outline" className="rounded-full border-[#D4AF37]/40 bg-transparent text-amber-50 hover:bg-[#D4AF37]/10" data-testid="home-membership-btn">
              <Link to="/membership">Apply for membership <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HERITAGE STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <p className="eyebrow mb-4">Our story</p>
        <h2 className="font-serif text-4xl sm:text-5xl font-bold text-amber-50 max-w-3xl mx-auto leading-tight">
          More than 70 years <span className="italic text-[#D4AF37]">in the spotlight.</span>
        </h2>
        <p className="mt-6 text-amber-50/70 max-w-2xl mx-auto leading-relaxed">
          Plantagenet Players have entertained Mount Barker and the Great Southern with variety
          shows, satire, melodrama, music and community productions since 1953.
        </p>
        <div className="mt-8">
          <Button asChild variant="ghost" className="text-[#D4AF37] hover:text-[#E5C158] hover:bg-[#D4AF37]/5" data-testid="home-story-btn">
            <Link to="/our-story">Explore our history <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
