import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, Ticket } from "lucide-react";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("checking"); // checking | paid | failed
  const [info, setInfo] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) { setState("failed"); return; }
    let active = true;
    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (!active) return;
        if (data.payment_status === "paid") { setInfo(data); setState("paid"); return; }
        if (["expired", "failed"].includes(data.payment_status)) { setState("failed"); return; }
      } catch { /* keep trying */ }
      attempts.current += 1;
      if (attempts.current > 10) { setState("failed"); return; }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { active = false; };
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      {state === "checking" && (
        <div data-testid="payment-checking">
          <Loader2 className="w-14 h-14 text-[#D4AF37] animate-spin mx-auto" />
          <h1 className="mt-6 font-serif text-3xl text-amber-50">Confirming your payment…</h1>
          <p className="mt-3 text-amber-50/60">Please hold while we secure your seats.</p>
        </div>
      )}
      {state === "paid" && (
        <div className="animate-fade-up" data-testid="payment-success">
          <CheckCircle2 className="w-16 h-16 text-[#D4AF37] mx-auto" />
          <h1 className="mt-6 font-serif text-4xl text-amber-50">You're going to the show!</h1>
          <p className="mt-3 text-amber-50/70">
            {info?.quantity} ticket{info?.quantity > 1 ? "s" : ""} to <span className="text-[#D4AF37]">{info?.show_title}</span> confirmed
            {info?.amount ? ` — $${Number(info.amount).toFixed(2)} AUD` : ""}.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild className="rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50" data-testid="view-tickets-btn"><Link to="/portal"><Ticket className="w-4 h-4 mr-2" />View my tickets</Link></Button>
            <Button asChild variant="outline" className="rounded-full border-[#D4AF37]/30 bg-transparent text-amber-50"><Link to="/shows">Browse more shows</Link></Button>
          </div>
        </div>
      )}
      {state === "failed" && (
        <div data-testid="payment-failed">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="mt-6 font-serif text-3xl text-amber-50">We couldn't confirm your payment</h1>
          <p className="mt-3 text-amber-50/60">If you were charged, please contact our box office and we'll sort it out.</p>
          <Button asChild className="mt-8 rounded-full bg-[#8B1E26] hover:bg-[#A6242F] text-amber-50"><Link to="/shows">Back to shows</Link></Button>
        </div>
      )}
    </div>
  );
}
