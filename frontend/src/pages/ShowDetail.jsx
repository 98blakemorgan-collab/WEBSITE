import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Calendar, Minus, Plus, ArrowLeft, Loader2, Ticket } from "lucide-react";

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export default function ShowDetail() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [tier, setTier] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    api.get(`/shows/${id}`).then((res) => {
      setShow(res.data);
      const firstAvail = res.data.ticket_tiers?.find((t) => t.available > 0) || res.data.ticket_tiers?.[0];
      if (firstAvail) setTier(firstAvail.name);
    });
  }, [id]);

  if (!show) {
    return <div className="max-w-7xl mx-auto px-4 py-32 text-amber-50/50 flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>;
  }

  const selectedTier = show.ticket_tiers?.find((t) => t.name === tier);
  const total = selectedTier ? selectedTier.price * qty : 0;
  const isPast = show.status === "past";

  const checkout = async () => {
    if (!selectedTier) return;
    if (!user && !buyerEmail) { toast.error("Please enter your email for your tickets."); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/payments/checkout", {
        show_id: show.id,
        tier_name: tier,
        quantity: qty,
        origin_url: window.location.origin,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        marketing_opt_in: marketing,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not start checkout");
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <img src={show.poster_url} alt={show.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#550000] via-[#550000]/60 to-[#550000]/20" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Link to="/shows" className="inline-flex items-center gap-2 text-sm text-amber-50/70 hover:text-amber-50 mb-4" data-testid="back-to-shows"><ArrowLeft className="w-4 h-4" /> All productions</Link>
          <p className="eyebrow mb-2">{show.genre}</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-50 tracking-tight">{show.title}</h1>
          <p className="mt-2 text-[#D4AF37] font-serif italic text-xl">{show.tagline}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="font-serif text-2xl text-amber-50 mb-4">About the production</h2>
          <p className="text-amber-50/70 leading-relaxed text-lg">{show.description}</p>

          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[#6B0F0F] border border-[#D4AF37]/15">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Performances</h3>
              {show.performances?.length ? (
                <ul className="space-y-2 text-sm text-amber-50/80">
                  {show.performances.map((p) => <li key={p} className="font-mono">{fmtDateTime(p)}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-amber-50/50">Past production — season closed.</p>
              )}
            </div>
            <div className="p-6 rounded-xl bg-[#6B0F0F] border border-[#D4AF37]/15">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue</h3>
              <p className="text-sm text-amber-50/80">{show.venue}</p>
            </div>
          </div>
          {(show.director || show.duration || show.synopsis || show.cast?.length || show.crew?.length) ? (
            <div className="mt-10">
              <div className="flex flex-wrap gap-8 mb-6 text-sm">
                {show.director && <div><span className="font-mono text-xs uppercase text-[#D4AF37]/70">Director</span><p className="text-amber-50 mt-1">{show.director}</p></div>}
                {show.duration && <div><span className="font-mono text-xs uppercase text-[#D4AF37]/70">Running time</span><p className="text-amber-50 mt-1">{show.duration}</p></div>}
              </div>
              {show.synopsis && <p className="text-amber-50/70 leading-relaxed mb-8">{show.synopsis}</p>}
              <div className="grid sm:grid-cols-2 gap-8">
                {show.cast?.length > 0 && (
                  <div data-testid="cast-list">
                    <h3 className="font-serif text-xl text-amber-50 mb-3">Cast</h3>
                    <ul className="space-y-2">
                      {show.cast.map((c) => (
                        <li key={`${c.actor}-${c.role}`} className="flex justify-between gap-4 text-sm border-b border-[#D4AF37]/10 pb-2">
                          <span className="text-amber-50">{c.actor}</span>
                          <span className="text-amber-50/50 italic text-right">{c.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {show.crew?.length > 0 && (
                  <div data-testid="crew-list">
                    <h3 className="font-serif text-xl text-amber-50 mb-3">Creative &amp; Crew</h3>
                    <ul className="space-y-2">
                      {show.crew.map((c) => (
                        <li key={`${c.role}-${c.name}`} className="flex justify-between gap-4 text-sm border-b border-[#D4AF37]/10 pb-2">
                          <span className="text-amber-50/50 italic">{c.role}</span>
                          <span className="text-amber-50 text-right">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Booking box */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-[#7A1616] border border-[#D4AF37]/25" data-testid="booking-box">
            <h3 className="font-serif text-2xl text-amber-50 mb-1">Book Tickets</h3>
            {isPast ? (
              <p className="mt-4 text-sm text-amber-50/60">This season has closed. Browse our <Link to="/shows" className="text-[#D4AF37] underline">upcoming shows</Link>.</p>
            ) : (
              <>
                <p className="text-sm text-amber-50/50 mb-6">Select your seats and quantity.</p>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Section</label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className="bg-[#550000] border-[#D4AF37]/25 text-amber-50" data-testid="tier-select">
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#6B0F0F] border-[#D4AF37]/25 text-amber-50">
                    {show.ticket_tiers?.map((t) => (
                      <SelectItem key={t.name} value={t.name} disabled={t.available <= 0} data-testid={`tier-option-${t.name}`}>
                        {t.name} — ${t.price.toFixed(2)} {t.available <= 0 ? "(Sold out)" : `(${t.available} left)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2 mt-6">Quantity</label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="border-[#D4AF37]/30 bg-transparent text-amber-50 rounded-full" onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-minus"><Minus className="w-4 h-4" /></Button>
                  <span className="text-2xl font-serif text-amber-50 w-10 text-center" data-testid="qty-value">{qty}</span>
                  <Button variant="outline" size="icon" className="border-[#D4AF37]/30 bg-transparent text-amber-50 rounded-full" onClick={() => setQty(Math.min(selectedTier?.available || 20, qty + 1))} data-testid="qty-plus"><Plus className="w-4 h-4" /></Button>
                </div>

                <div className="mt-6 pt-6 border-t border-[#D4AF37]/15 flex items-center justify-between">
                  <span className="text-sm text-amber-50/60">Total</span>
                  <span className="font-serif text-3xl text-[#D4AF37]" data-testid="total-amount">${total.toFixed(2)}</span>
                </div>

                {!user && (
                  <div className="mt-6 space-y-3" data-testid="guest-fields">
                    <Input placeholder="Your name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="bg-[#550000] border-[#D4AF37]/25 text-amber-50" data-testid="buyer-name" />
                    <Input type="email" placeholder="Your email (for your tickets)" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="bg-[#550000] border-[#D4AF37]/25 text-amber-50" data-testid="buyer-email" />
                  </div>
                )}
                <label className="mt-4 flex items-start gap-2 text-xs text-amber-50/70 cursor-pointer">
                  <Checkbox checked={marketing} onCheckedChange={(v) => setMarketing(!!v)} className="border-[#D4AF37]/40 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:text-slate-950 mt-0.5" data-testid="marketing-optin" />
                  Keep me posted about upcoming shows, events and special offers.
                </label>

                <Button onClick={checkout} disabled={busy || !selectedTier || selectedTier.available <= 0} className="w-full mt-6 h-12 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50 font-semibold" data-testid="checkout-btn">
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…</> : <><Ticket className="w-4 h-4 mr-2" /> Pay with Stripe</>}
                </Button>
                <p className="mt-3 text-[11px] text-amber-50/40 text-center font-mono">Secure checkout · Test card 4242 4242 4242 4242</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
