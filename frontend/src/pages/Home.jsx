import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useContent } from "@/context/ContentContext";
import { Button } from "@/components/ui/button";
import { Ticket, ArrowRight, Drama, Wrench, Users, HandHeart } from "lucide-react";

const roles = [
  { icon: Drama, title: "On Stage", desc: "Acting, singing, dancing and ensemble roles." },
  { icon: Wrench, title: "Backstage", desc: "Sets, props, costumes, stage crew and make-up." },
  { icon: Users, title: "Technical", desc: "Lighting, sound, projection and show operation." },
  { icon: HandHeart, title: "Front of House", desc: "Tickets, hospitality, publicity and welcome." },
];

const FALLBACK_SLIDES = ["/venue/slide-4.jpg", "/venue/slider-1.jpg", "/venue/slide-7.jpg", "/venue/slide-8.jpg"];

export default function Home() {
  const { content } = useContent();
  const c = content.home || {};
  const slides = c.slides?.length ? c.slides : FALLBACK_SLIDES;

  const [featured, setFeatured] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.get("/shows").then((res) => {
      const list = res.data;
      const up = list
        .filter((s) => ["upcoming", "current"].includes(s.status))
        .sort((a, b) => (a.performances?.[0] || "9999").localeCompare(b.performances?.[0] || "9999"));
      setFeatured(up[0] || list.find((s) => s.status === "current") || list[0]);
    });
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div>
      {/* HERO SLIDESHOW */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden grain">
        <div className="absolute inset-0">
          {slides.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === active ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#550000] via-[#550000]/85 to-[#550000]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#550000] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-6">{c.eyebrow || "Community Theatre since 1953"}</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-amber-50 leading-[0.95] tracking-tight">
              {c.title_line1 || "Stories begin"} <span className="italic text-[#D4AF37]">{c.title_highlight || "here."}</span>
            </h1>
            <p className="mt-7 text-lg text-amber-50/70 leading-relaxed max-w-xl">
              {c.subtitle || "Community-made theatre in Mount Barker. Come for the show — stay for the people, the laughter and the magic behind the curtain."}
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
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} data-testid={`hero-dot-${i}`}
                className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-[#D4AF37]" : "w-2 bg-amber-50/40"}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        )}
      </section>

      {/* FEATURED SHOW */}
      {featured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 group">
              <img src={featured.poster_url} alt={featured.title} className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#8B1E26] text-amber-50 text-xs font-mono tracking-wider uppercase">
                {featured.status === "current" ? "Now Showing" : featured.status === "upcoming" ? "Next Production" : "From the Archive"}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-4">{featured.status === "past" ? "From the archive" : "Next on stage"}</p>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-amber-50 tracking-tight">{featured.title}</h2>
              <p className="mt-3 text-[#D4AF37] font-serif italic text-xl">{featured.tagline}</p>
              {featured.performances?.[0] && (
                <p className="mt-3 text-sm font-mono text-amber-50/60">{new Date(featured.performances[0]).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              )}
              <p className="mt-6 text-amber-50/70 leading-relaxed">{featured.description}</p>
              <div className="mt-8">
                <Button asChild size="lg" className="rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-slate-950 font-semibold px-8" data-testid="home-featured-book-btn">
                  <Link to={`/shows/${featured.id}`}>{featured.status === "past" ? "View Production" : "Book Tickets"} <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FIND YOUR PART */}
      <section className="relative py-20 sm:py-28 border-y border-[#D4AF37]/10 bg-[#3D0000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Find your part</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-50">{c.find_part_title || "You don't have to act."}</h2>
            <p className="mt-4 text-amber-50/70">{c.find_part_desc || "Theatre needs all kinds of people. Experience is welcome; curiosity is enough."}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r) => (
              <div key={r.title} className="p-7 rounded-2xl bg-[#6B0F0F] border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 transition-colors">
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
          {c.heritage_text || "Plantagenet Players have entertained Mount Barker and the Great Southern with variety shows, satire, melodrama, music and community productions since 1953."}
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
