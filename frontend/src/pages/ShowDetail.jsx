import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
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
    setBusy(true);
    try {
      const { data } = await api.post("/payments/checkout", {
        show_id: show.id,
        tier_name: tier,
        quantity: qty,
        origin_url: window.location.origin,
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A0B] via-[#0D0A0B]/60 to-[#0D0A0B]/20" />
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
            <div className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Performances</h3>
              {show.performances?.length ? (
                <ul className="space-y-2 text-sm text-amber-50/80">
                  {show.performances.map((p, i) => <li key={i} className="font-mono">{fmtDateTime(p)}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-amber-50/50">Past production — season closed.</p>
              )}
            </div>
            <div className="p-6 rounded-xl bg-[#181316] border border-[#D4AF37]/15">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue</h3>
              <p className="text-sm text-amber-50/80">{show.venue}</p>
            </div>
          </div>
        </div>

        {/* Booking box */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-[#241D21] border border-[#D4AF37]/25" data-testid="booking-box">
            <h3 className="font-serif text-2xl text-amber-50 mb-1">Book Tickets</h3>
            {isPast ? (
              <p className="mt-4 text-sm text-amber-50/60">This season has closed. Browse our <Link to="/shows" className="text-[#D4AF37] underline">upcoming shows</Link>.</p>
            ) : (
              <>
                <p className="text-sm text-amber-50/50 mb-6">Select your seats and quantity.</p>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-50/60 mb-2">Section</label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className="bg-[#0D0A0B] border-[#D4AF37]/25 text-amber-50" data-testid="tier-select">
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181316] border-[#D4AF37]/25 text-amber-50">
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
