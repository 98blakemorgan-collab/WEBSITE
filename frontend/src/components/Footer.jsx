import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Facebook } from "lucide-react";
import { useContent } from "@/context/ContentContext";

export function Footer() {
  const { content } = useContent();
  const abn = content?.contact?.abn;
  return (
    <footer className="relative border-t border-[#D4AF37]/15 bg-[#3D0000] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-11 rounded-full bg-[#FAF7F2] p-1.5 flex items-center justify-center ring-1 ring-[#D4AF37]/40"><img src="/pp-logo.png" alt="Plantagenet Players" className="w-full h-full object-contain" /></span>
            <span className="font-serif text-xl text-amber-50">Plantagenet Players</span>
          </div>
          <p className="text-sm text-amber-50/50 max-w-md leading-relaxed">
            Community-made theatre in Mount Barker since 1953. Come for the show — stay for the
            people, the laughter and the magic behind the curtain.
          </p>
          <a href="https://www.facebook.com/plantagenetplayers" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-2 mt-5 text-sm text-[#D4AF37]/80 hover:text-[#D4AF37]" data-testid="footer-facebook">
            <Facebook className="w-4 h-4" /> Follow us on Facebook
          </a>
        </div>

        <div>
          <h4 className="font-mono text-xs tracking-[0.25em] uppercase text-[#D4AF37]/70 mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-amber-50/60">
            <li><Link to="/shows" className="hover:text-amber-50">What's On</Link></li>
            <li><Link to="/our-story" className="hover:text-amber-50">Our Story</Link></li>
            <li><Link to="/membership" className="hover:text-amber-50">Membership</Link></li>
            <li><Link to="/sponsors" className="hover:text-amber-50">Sponsors</Link></li>
            <li><Link to="/login" className="hover:text-amber-50">Member Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-xs tracking-[0.25em] uppercase text-[#D4AF37]/70 mb-4">Box Office</h4>
          <ul className="space-y-3 text-sm text-amber-50/60">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#D4AF37]/70" /> Plantagenet District Hall,<br />Memorial Drive, Mount Barker WA 6324</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#D4AF37]/70" /> boxoffice@plantagenetplayers.site</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#D4AF37]/70" /> (08) 9851 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#D4AF37]/10 py-6 text-center text-xs text-amber-50/30 font-mono tracking-wider" data-testid="footer-legal">
        © {new Date().getFullYear()} PLANTAGENET PLAYERS · COMMUNITY THEATRE SINCE 1953{abn ? ` · ABN ${abn}` : ""}
      </div>
    </footer>
  );
}
